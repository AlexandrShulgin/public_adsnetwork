import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvGetShardedIndex, OpenRTBAd, ZoneConfig } from '@/lib/kv';
import { logError } from '@/lib/analytics';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

/**
 * @swagger
 * /api/serve:
 *   get:
 *     tags: [Public]
 *     summary: Ad Serving (Auction)
 *     description: Returns the best ad based on a real-time auction. Optimized for <10ms latency.
 *     parameters:
 *       - in: query
 *         name: zone
 *         description: ID of the ad zone
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ad found and returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ad:
 *                   type: object
 *                 auction:
 *                   type: object
 */
export async function GET(request: NextRequest) {
  const t0 = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get('zone') || searchParams.get('site') || 'default';
    
    // 1. Identity Layer & Zone Config
    const ip = request.headers.get('cf-connecting-ip') || '127.0.0.1';
    const ua = request.headers.get('user-agent') || 'unknown';
    const geo = request.headers.get('cf-ipcountry') || 'US';
    
    // Anti-Fraud: Cloudflare Bot Management Score
    const botScore = parseInt(request.headers.get('cf-bot-score') || '100');
    if (botScore < 10) { // High probability bot
      return new NextResponse(JSON.stringify({ error: 'Blocked by bot policy' }), { status: 403 });
    }
    
    const zoneConfig = await kvGet<ZoneConfig>(`zone:${zoneId}`);
    
    // Simple device detection
    const isMobile = ua.toLowerCase().includes('mobile');
    const deviceType = isMobile ? 'mobile' : 'desktop';

    // 2. Delegate to Auction Engine DO (Ultra High Speed RAM Auction)
    const { env } = getRequestContext() as any;
    const auctionEngineNamespace = env.AUCTION_ENGINE;
    
    if (auctionEngineNamespace) {
      const doId = auctionEngineNamespace.idFromName('default');
      const obj = auctionEngineNamespace.get(doId);
      
      try {
        const doResponse = await obj.fetch(new Request('http://do/auction', {
          method: 'POST',
          body: JSON.stringify({ 
            zoneId, 
            geo, 
            deviceType, 
            floorPrice: zoneConfig?.floor_price || 0,
            ip,
            ua,
            botScore
          })
        }));

        if (doResponse.ok) {
          const result = await doResponse.json() as any;
          const auctionDuration = Date.now() - t0;
          
          return new NextResponse(JSON.stringify({ 
            ad: result.ad, 
            zoneId,
            auction: {
              ...result.auction,
              duration_ms: auctionDuration,
              engine: 'durable_object'
            }
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'X-Auction-Latency': `${auctionDuration}ms`,
              'X-Auction-Engine': 'DurableObject'
            },
          });
        }
      } catch (doErr) {
        console.error("Durable Object Auction Failed, falling back to KV:", doErr);
      }
    }

    // 3. Fallback: Standard Edge Worker Auction (KV-based)
    const [zoneAds, geoAds, deviceAds] = await Promise.all([
      kvGetShardedIndex(`idx:zone:${zoneId}`, 1),
      kvGetShardedIndex(`idx:geo:${geo}`, 1),
      kvGetShardedIndex(`idx:device:${deviceType}`, 1)
    ]);

    // 3. Bitset-style Intersection (Candidate selection)
    // Find ads that match all targeting criteria
    let candidates = zoneAds.filter(id => 
      geoAds.includes(id) && deviceAds.includes(id)
    );

    if (candidates.length === 0) {
      // Fallback to active ads if targeting is too restrictive (House Ads logic)
      candidates = await kvGetShardedIndex('idx:ads:active', 1);
    }

    // 4. Auction Phase (Max 8 candidates)
    const topCandidates = candidates.slice(0, 8);
    const adDataResults = await Promise.all(
      topCandidates.map(async (id) => {
        const ad = await kvGet<OpenRTBAd>(`ad:${id}`);
        // Basic budget check (frequency capping would be here too)
        return ad && ad.bid_cpm >= (zoneConfig?.floor_price || 0) ? ad : null;
      })
    );

    const validAds = adDataResults.filter((ad): ad is OpenRTBAd => !!ad);
    
    if (validAds.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No suitable ads found' }), {
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Sort by bid (CPM)
    validAds.sort((a, b) => b.bid_cpm - a.bid_cpm);

    const winner = validAds[0];
    
    // 5. Second Price Auction Calculation
    // price = second_highest_bid + $0.01 (or floor if only one ad)
    const secondBid = validAds.length > 1 ? validAds[1].bid_cpm : (zoneConfig?.floor_price || 0);
    const clearingPrice = Math.min(winner.bid_cpm, secondBid + 0.01);

    const auctionDuration = Date.now() - t0;

    return new NextResponse(JSON.stringify({ 
      ad: {
        ...winner,
        clearingPrice
      }, 
      zoneId,
      auction: {
        duration_ms: auctionDuration,
        candidates: validAds.length,
        clearing_price: clearingPrice
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Auction-Latency': `${auctionDuration}ms`
      },
    });

  } catch (err: any) {
    const { env } = getRequestContext();
    await logError(env, err, { route: '/api/serve' });
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
