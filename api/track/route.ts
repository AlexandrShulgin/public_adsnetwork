import { NextRequest, NextResponse } from 'next/server';
import { logEvent, logError } from '@/lib/analytics';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { kvGet, kvSet } from '@/lib/kv';

export const runtime = 'edge';

/**
 * @swagger
 * /api/track:
 *   get:
 *     tags: [Public]
 *     summary: Event Tracking
 *     description: Tracks impressions, clicks, and bids asynchronously.
 *     parameters:
 *       - in: query
 *         name: event
 *         required: true
 *         schema:
 *           type: string
 *           enum: [impression, click, bid]
 *       - in: query
 *         name: adId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: cp
 *         description: Clearing Price
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Event tracked
 */
export async function GET(request: NextRequest) {
  const { env } = getRequestContext();
  
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event') as 'impression' | 'click' | 'bid';
    const adId = searchParams.get('adId');
    const zoneId = searchParams.get('zoneId') || 'default';
    const campaignId = searchParams.get('campaignId');
    const clearingPrice = parseFloat(searchParams.get('cp') || '0');
    
    if (!adId || !event) {
      return new NextResponse('Missing parameters', { status: 400 });
    }

    // 1. Context & Fingerprinting
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const ua = request.headers.get('user-agent') || 'unknown';
    const country = request.headers.get('cf-ipcountry') || 'XX';
    
    // Deduplication Hash (Prevent double clicks/impressions in a short window)
    const dedupKey = `dedup:${event}:${adId}:${ip}:${Math.floor(Date.now() / 60000)}`; // 1-minute window
    const isDuplicate = await kvGet(dedupKey);
    
    if (isDuplicate) {
      return new NextResponse('Duplicate', { status: 204 });
    }
    
    // Mark as processed
    await kvSet(dedupKey, true, 3600); // 1 hour TTL for dedup cache

    // 2. Queue for Financial Processing (Async)
    // We assume TREND_ADS_QUEUE is bound in the environment
    const queue = (env as any).TREND_ADS_QUEUE;
    const eventData = {
      type: event,
      ad_id: adId,
      campaign_id: campaignId,
      zone_id: zoneId,
      price: clearingPrice,
      ip_hash: ip, // In production, use a hash
      ua_hash: ua,
      geo: country,
      ts: Date.now()
    };

    if (queue) {
      await queue.send(eventData);
    }

    // 3. Real-time Analytics Logging
    await logEvent(env, {
      adId,
      zoneId: zoneId,
      eventType: event,
      geo: country,
      costUsd: clearingPrice / 1000, // Convert CPM to single unit if needed
      metadata: { ua, ip }
    });

    // 4. Response
    if (event === 'impression') {
      const pixel = new Uint8Array([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
        0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
      ]);
      return new NextResponse(pixel, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new NextResponse(JSON.stringify({ status: 'queued' }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err: any) {
    await logError(env, err, { route: '/api/track' });
    return new NextResponse(JSON.stringify({ error: "Internal Error" }), { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
