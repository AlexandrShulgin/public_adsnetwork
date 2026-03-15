import { OpenRTBAd, ZoneConfig } from '../lib/kv';

/**
 * AuctionEngine Durable Object
 * Handles high-speed, in-memory auctions for a set of zones.
 */
export class AuctionEngine {
  state: any;
  env: any;
  hotCache: Map<string, OpenRTBAd> = new Map();
  bitsets: Map<string, Set<string>> = new Map();
  rateLimits: Map<string, { count: number, ts: number }> = new Map();
  pacingState: Map<string, { lastRequest: number, skips: number }> = new Map();

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
    
    // Potential: Load initial state from KV on startup
    this.state.blockConcurrencyWhile(async () => {
      await this.warmBoot();
    });
  }

  async warmBoot() {
    console.log("AuctionEngine: Warm boot starting...");
    // In a real production environment, we'd load a snapshot from KV
    // For now, we'll initialize with empty and let the first requests populate it
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/auction") {
      return this.handleAuction(request);
    }

    if (path === "/sync") {
      return this.handleSync(request);
    }

    return new Response("Not Found", { status: 404 });
  }

  async handleAuction(request: Request) {
    const t0 = Date.now();
    const { zoneId, geo, deviceType, floorPrice, ip } = await request.json() as any;

    // 0. Rate Limiting (Anti-Fraud)
    if (this.isRateLimited(ip)) {
      return Response.json({ error: "Rate limited" }, { status: 429 });
    }

    // 1. Bitset Intersection
    const candidates = this.getTargetingCandidates(zoneId, geo, deviceType);
    
    // 2. Hydrate Ad Metadata & Quality Check (with Pacing)
    const validAds: OpenRTBAd[] = [];
    for (const adId of candidates) {
      const ad = this.hotCache.get(adId);
      if (ad && ad.bid_cpm >= floorPrice) {
        // Probabilistic Pacing check
        if (!this.shouldSkipByPacing(ad.campaign_id)) {
          validAds.push(ad);
        }
      }
    }

    if (validAds.length === 0) {
      return Response.json({ error: "No candidates" }, { status: 404 });
    }

    // 3. Sort & Second Price Calculation
    validAds.sort((a, b) => b.bid_cpm - a.bid_cpm);
    const winner = validAds[0];
    const secondPrice = validAds.length > 1 ? validAds[1].bid_cpm : floorPrice;
    const clearingPrice = Math.min(winner.bid_cpm, secondPrice + 0.01);

    return Response.json({
      ad: { ...winner, clearingPrice },
      latency_ms: Date.now() - t0,
      candidates: validAds.length
    });
  }

  getTargetingCandidates(zoneId: string, geo: string, deviceType: string): string[] {
    const zoneSet = this.bitsets.get(`zone:${zoneId}`) || new Set();
    const geoSet = this.bitsets.get(`geo:${geo}`) || new Set();
    const deviceSet = this.bitsets.get(`device:${deviceType}`) || new Set();

    // Intersection
    const result = [...zoneSet].filter(id => geoSet.has(id) && deviceSet.has(id));
    return result;
  }

  async handleSync(request: Request) {
    const { ads, indices } = await request.json() as any;
    
    // Update Hot Cache
    for (const ad of ads) {
      this.hotCache.set(ad.ad_id, ad);
    }

    // Update Bitsets
    for (const [key, ids] of Object.entries(indices)) {
      if (Array.isArray(ids)) {
        this.bitsets.set(key, new Set(ids as string[]));
      }
    }

    return Response.json({ success: true, cacheSize: this.hotCache.size });
  }

  isRateLimited(ip: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(ip);
    if (limit && now - limit.ts < 1000) { // 1 second window
      if (limit.count > 10) return true; // Max 10 req/sec per individual DO shard
      limit.count++;
    } else {
      this.rateLimits.set(ip, { count: 1, ts: now });
    }
    return false;
  }

  shouldSkipByPacing(campaignId: string): boolean {
    // Probabilistic Pacing: Skip 10% of requests by default if budget is tight
    // In production, this would be a dynamic % based on time-of-day and remaining budget
    return Math.random() < 0.1; 
  }
}
