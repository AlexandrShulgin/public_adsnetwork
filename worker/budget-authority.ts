/**
 * BudgetAuthority Durable Object
 * Manages atomic token buckets for ad campaigns to prevent overspend.
 */
export class BudgetAuthority {
  state: any;
  env: any;
  budgets: Map<string, number> = new Map(); // campaignId -> remainingTokens (in cents)

  constructor(state: any, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/request-tokens") {
      return this.handleRequestTokens(request);
    }

    if (path === "/sync-budget") {
      return this.handleSyncBudget(request);
    }

    return new Response("Not Found", { status: 404 });
  }

  /**
   * Auction sharded DOs call this to get a batch of tokens.
   */
  async handleRequestTokens(request: Request) {
    const { campaignId, amount } = await request.json() as any;
    
    // Perform atomic deduction
    return await this.state.storage.transaction(async (txn: any) => {
      let current = (await txn.get(`b:${campaignId}`)) || 0;
      
      if (current <= 0) {
        return Response.json({ granted: 0, remaining: 0 });
      }

      const granted = Math.min(current, amount);
      const remaining = current - granted;
      
      await txn.put(`b:${campaignId}`, remaining);
      
      return Response.json({ granted, remaining });
    });
  }

  /**
   * Sync from Postgres logic (via Sync Worker)
   */
  async handleSyncBudget(request: Request) {
    const { budgets } = await request.json() as any; // campaignId -> daily_limit
    
    await this.state.storage.transaction(async (txn: any) => {
      for (const [id, limit] of Object.entries(budgets)) {
        await txn.put(`b:${id}`, Number(limit));
      }
    });

    return Response.json({ success: true });
  }
}
