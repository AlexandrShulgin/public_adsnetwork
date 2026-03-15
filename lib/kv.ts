/**
 * Cloudflare KV Library for Enterprise Ads
 * Optimized for OpenRTB metadata and sharded indices.
 */

export interface OpenRTBAd {
  ad_id: string;
  campaign_id: string;
  advertiser_id: string;
  bid_cpm: number;
  bid_type: 'CPM' | 'CPC';
  creative_id: string;
  creative_size: string;
  image_url: string;
  target_url: string;
  title?: string;
  description?: string;
  logo_url?: string;
  cta?: string;
  geo_target?: string[];
  device_target?: string[];
  zone_target?: string[];
  pacing_strategy?: string;
  daily_budget?: number;
}

export interface ZoneConfig {
  id: string;
  publisher_id: string;
  size: string;
  floor_price: number;
  allowed_formats: string[];
  category?: string;
  refresh_rate?: number;
}

export const getKV = () => (process.env as any).TREND_ADS_KV;

/**
 * Standard KV GET with JSON parsing
 */
export const kvGet = async <T>(key: string): Promise<T | null> => {
  const kv = getKV();
  if (!kv) return null;
  const value = await kv.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as unknown as T;
  }
};

/**
 * KV GET for binary data (used for Bitsets)
 */
export const kvGetBuffer = async (key: string): Promise<ArrayBuffer | null> => {
  const kv = getKV();
  if (!kv) return null;
  return await kv.get(key, 'arrayBuffer');
};

/**
 * Standard KV SET
 */
export const kvSet = async (key: string, value: any, ttlSeconds?: number) => {
  const kv = getKV();
  if (!kv) return;
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  const options: any = {};
  if (ttlSeconds) options.expirationTtl = ttlSeconds;
  await kv.put(key, stringValue, options);
};

/**
 * KV SET for binary data (Bitsets)
 */
export const kvSetBuffer = async (key: string, value: ArrayBuffer, ttlSeconds?: number) => {
  const kv = getKV();
  if (!kv) return;
  const options: any = {};
  if (ttlSeconds) options.expirationTtl = ttlSeconds;
  await kv.put(key, value, options);
};

/**
 * Atomic Key Deletion
 */
export const kvDelete = async (key: string) => {
  const kv = getKV();
  if (kv) await kv.delete(key);
};

/**
 * Helper to manage Sharded Indices
 * Example: idx:zone:header:0, idx:zone:header:1
 */
export const kvGetShardedIndex = async (prefix: string, shardCount: number = 1): Promise<string[]> => {
  const results = await Promise.all(
    Array.from({ length: shardCount }).map((_, i) => kvGet<string[]>(`${prefix}:${i}`))
  );
  return results.flat().filter((id): id is string => !!id);
};
