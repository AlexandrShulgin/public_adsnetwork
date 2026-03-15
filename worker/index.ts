import { AuctionEngine } from './auction-engine';
import { BudgetAuthority } from './budget-authority';
import QueueConsumer from './queue-consumer';

// Export Durable Object classes for Namespaces
export { AuctionEngine, BudgetAuthority };

// Default export for the Worker itself (Queue Consumer and dummy fetch)
export default {
  async fetch(request: Request, env: any, ctx: any) {
    return new Response("TrendAds Engine: Active", { status: 200 });
  },

  async queue(batch: any, env: any) {
    return QueueConsumer.queue(batch, env);
  }
};
