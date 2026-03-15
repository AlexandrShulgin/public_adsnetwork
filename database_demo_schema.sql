-- TrendAds Demo Database Schema (Simplified)

-- 1. Campaigns: Logical grouping of ads and budget
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed'
    total_spend DECIMAL(12, 4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Ads: Creative content and targeting settings
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT NOT NULL,
    geos JSONB DEFAULT '["US", "GB"]',
    bid_cpm DECIMAL(12, 4) DEFAULT 0.10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Zones: Ad placements on publisher sites
CREATE TABLE IF NOT EXISTS ad_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    floor_price DECIMAL(12, 4) DEFAULT 0.05,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Events: Raw logs for impressions and clicks
-- This table is populated by the queue-consumer worker
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL, -- 'impression', 'click'
    ad_id UUID REFERENCES ads(id),
    zone_id UUID REFERENCES ad_zones(id),
    geo TEXT,
    unit_price DECIMAL(12, 6),
    ts TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Indexing for fast analytics
CREATE INDEX idx_events_ad_id ON events(ad_id);
CREATE INDEX idx_events_type_ts ON events(event_type, ts);
