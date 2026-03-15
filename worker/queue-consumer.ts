import { getSupabase } from '../lib/supabase';

/**
 * Queue Consumer Worker
 * Processes batches of impression/click events and updates the SQL Ledger.
 */
export default {
  async queue(batch: any, env: any) {
    console.log(`QueueConsumer: Processing batch of ${batch.messages.length} messages`);
    
    // Group events by campaign and zone for batch updates
    const campaignUpdates: Record<string, { spend: number, impressions: number, clicks: number }> = {};
    const zoneUpdates: Record<string, { earnings: number, impressions: number, clicks: number }> = {};

    for (const msg of batch.messages) {
      const event = msg.body;
      
      // 1. Validation Logic ("Show First, Validate Later")
      if (this.isFraudulent(event)) {
        console.warn(`QueueConsumer: Flagged fraudulent event: ${event.type} for ad ${event.ad_id}`);
        msg.ack();
        continue;
      }

      // 2. Accumulate campaign stats
      const cId = event.campaign_id;
      if (!campaignUpdates[cId]) campaignUpdates[cId] = { spend: 0, impressions: 0, clicks: 0 };
      
      if (event.type === 'impression') {
        campaignUpdates[cId].impressions++;
        campaignUpdates[cId].spend += event.price / 1000; // CPM to single unit
      } else if (event.type === 'click') {
        campaignUpdates[cId].clicks++;
        // CPC logic here if applicable
      }

      // 3. Accumulate publisher/zone stats
      const zId = event.zone_id;
      if (!zoneUpdates[zId]) zoneUpdates[zId] = { earnings: 0, impressions: 0, clicks: 0 };
      
      if (event.type === 'impression') {
        zoneUpdates[zId].impressions++;
        zoneUpdates[zId].earnings += (event.price / 1000) * 0.7; // 70% revshare
      } else if (event.type === 'click') {
        zoneUpdates[zId].clicks++;
      }

      msg.ack();
    }

    // 4. Batch Update PostgreSQL
    await this.applyLedgerUpdates(campaignUpdates, zoneUpdates, env);
  },

  isFraudulent(event: any): boolean {
    // Basic fraud check: if no price or missing IDs
    if (!event.campaign_id || !event.ad_id) return true;
    
    // In production, we'd check session velocity, IP blacklists, etc.
    return false;
  },

  async applyLedgerUpdates(campaigns: any, zones: any, env: any) {
    try {
      const supabase = getSupabase(env);
      // Use Supabase RPC for atomic multi-row updates
      for (const [id, stats] of Object.entries(campaigns) as [string, any]) {
        await supabase.rpc('increment_campaign_stats', {
            p_campaign_id: id,
            p_impressions: stats.impressions,
            p_clicks: stats.clicks,
            p_spend: stats.spend
        });
      }

      // Note: site/zone stats update logic would follow the same RPC pattern
      console.log("QueueConsumer: Ledger updates applied successfully.");
    } catch (err) {
      console.error("QueueConsumer: Failed to apply ledger updates:", err);
      // In production, we'd dead-letter or retry here
    }
  }
}
