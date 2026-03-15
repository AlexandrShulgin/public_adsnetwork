export const getAnalytics = () => (process.env as any).TREND_ADS_ANALYTICS;

export const logEvent = async (
  env: any,
  data: {
    adId: string;
    zoneId: string;
    eventType: 'impression' | 'click' | 'bid';
    geo: string;
    device?: string;
    costUsd: number;
    metadata?: any;
  }
) => {
  const analytics = env.TREND_ADS_ANALYTICS;
  
  if (!analytics) {
    console.warn("Analytics Engine binding TREND_ADS_ANALYTICS not found. Falling back to console.");
    console.log("EVENT_LOG:", JSON.stringify(data));
    return;
  }

  // Analytics Engine expects a dataset object with blobs (strings) and doubles (numbers)
  // Dataset: ad_events
  analytics.writeDataPoint({
    blobs: [
      data.adId,
      data.zoneId || 'unknown',
      data.eventType,
      data.geo,
      data.device || 'unknown'
    ],
    doubles: [
      data.costUsd
    ],
    indexes: [data.adId] // Used for efficient filtering
  });
};

export async function logError(
  env: any,
  error: Error | string,
  context?: { route?: string; userId?: string; details?: any }
) {
  if (!env || !env.TREND_ADS_ANALYTICS) {
    console.error('Analytics Engine binding (TREND_ADS_ANALYTICS) not found.');
    return;
  }

  const message = typeof error === 'string' ? error : error.message;
  
  try {
    env.TREND_ADS_ANALYTICS.writeDataPoint({
      blobs: [
        'error',            // blob1
        context?.route || 'unknown_route', // blob2
        message.substring(0, 100),         // blob3 (short message)
        context?.userId || 'anonymous',    // blob4
        JSON.stringify(context?.details || {}).substring(0, 100) // blob5
      ],
      doubles: [
        0, // double1 (cost or value, 0 for errors)
      ],
      indexes: [context?.route || 'error'] // index
    });
    console.log(`Error logged to Analytics Engine: ${message}`);
  } catch (err) {
    console.error('Failed to log error to Analytics Engine:', err);
  }
}
