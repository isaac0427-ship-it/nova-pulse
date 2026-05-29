-- =============================================================
-- STEP 1: Delete ghost auth user (invisible to API but blocks creation)
-- =============================================================
DELETE FROM auth.users WHERE email = 'isaac_0427@icloud.com';

-- =============================================================
-- STEP 2: Back up existing nova-systems tables (rename, don't drop)
-- Index names are schema-scoped in Postgres, so rename them too
-- to avoid conflicts when we recreate them on the new tables.
-- =============================================================
ALTER INDEX IF EXISTS idx_leads_business_id       RENAME TO ns_idx_leads_business_id;
ALTER INDEX IF EXISTS idx_leads_status            RENAME TO ns_idx_leads_status;
ALTER INDEX IF EXISTS idx_leads_source            RENAME TO ns_idx_leads_source;
ALTER INDEX IF EXISTS idx_leads_created_at        RENAME TO ns_idx_leads_created_at;
ALTER INDEX IF EXISTS idx_leads_last_activity     RENAME TO ns_idx_leads_last_activity;
ALTER INDEX IF EXISTS idx_lead_events_lead_id     RENAME TO ns_idx_lead_events_lead_id;
ALTER INDEX IF EXISTS idx_lead_events_created_at  RENAME TO ns_idx_lead_events_created_at;
ALTER INDEX IF EXISTS idx_communications_lead_id      RENAME TO ns_idx_communications_lead_id;
ALTER INDEX IF EXISTS idx_communications_business_id  RENAME TO ns_idx_communications_business_id;
ALTER INDEX IF EXISTS idx_communications_type         RENAME TO ns_idx_communications_type;
ALTER INDEX IF EXISTS idx_communications_status       RENAME TO ns_idx_communications_status;
ALTER INDEX IF EXISTS idx_alerts_business_id  RENAME TO ns_idx_alerts_business_id;
ALTER INDEX IF EXISTS idx_alerts_lead_id      RENAME TO ns_idx_alerts_lead_id;
ALTER INDEX IF EXISTS idx_alerts_is_resolved  RENAME TO ns_idx_alerts_is_resolved;
ALTER INDEX IF EXISTS idx_alerts_is_read      RENAME TO ns_idx_alerts_is_read;
ALTER INDEX IF EXISTS idx_alerts_severity     RENAME TO ns_idx_alerts_severity;
ALTER INDEX IF EXISTS idx_alerts_created_at   RENAME TO ns_idx_alerts_created_at;
ALTER INDEX IF EXISTS idx_reports_business_id RENAME TO ns_idx_reports_business_id;
ALTER INDEX IF EXISTS idx_reports_created_at  RENAME TO ns_idx_reports_created_at;

ALTER TABLE IF EXISTS businesses    RENAME TO ns_businesses;
ALTER TABLE IF EXISTS leads         RENAME TO ns_leads;
ALTER TABLE IF EXISTS communications RENAME TO ns_communications;

-- =============================================================
-- STEP 3: Enable UUID extension
-- =============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- BUSINESSES
-- =============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  business_hours JSONB NOT NULL DEFAULT '{}',
  twilio_number TEXT,
  twilio_sid TEXT,
  gmail_connected BOOLEAN NOT NULL DEFAULT FALSE,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own business" ON businesses;
CREATE POLICY "Users can manage own business" ON businesses
  FOR ALL USING (auth.uid() = owner_id);

-- =============================================================
-- LEADS
-- =============================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('phone_call', 'web_form', 'email', 'sms', 'manual')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'waiting', 'booked', 'quoted', 'closed', 'lost', 'ignored')),
  name TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  first_contact_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_response_at TIMESTAMPTZ,
  response_time_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads(last_activity_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can manage leads" ON leads;
CREATE POLICY "Business owners can manage leads" ON leads
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================
-- LEAD EVENTS
-- =============================================================
CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at DESC);

ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can manage lead events" ON lead_events;
CREATE POLICY "Business owners can manage lead events" ON lead_events
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================
-- COMMUNICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'sms', 'email', 'note')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  duration_seconds INTEGER,
  status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'failed', 'sent', 'received')),
  from_number TEXT,
  to_number TEXT,
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_communications_lead_id ON communications(lead_id);
CREATE INDEX IF NOT EXISTS idx_communications_business_id ON communications(business_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(type);
CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(status);

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can manage communications" ON communications;
CREATE POLICY "Business owners can manage communications" ON communications
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================
-- ALERTS
-- =============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('missed_call', 'no_response', 'dead_lead', 'slow_response', 'stalled_lead')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_business_id ON alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_alerts_lead_id ON alerts(lead_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_resolved ON alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can manage alerts" ON alerts;
CREATE POLICY "Business owners can manage alerts" ON alerts
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================
-- REPORTS
-- =============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_leads INTEGER NOT NULL DEFAULT 0,
  new_leads INTEGER NOT NULL DEFAULT 0,
  converted_leads INTEGER NOT NULL DEFAULT 0,
  lost_leads INTEGER NOT NULL DEFAULT 0,
  ignored_leads INTEGER NOT NULL DEFAULT 0,
  missed_calls INTEGER NOT NULL DEFAULT 0,
  avg_response_time_seconds INTEGER NOT NULL DEFAULT 0,
  source_breakdown JSONB NOT NULL DEFAULT '{}',
  status_breakdown JSONB NOT NULL DEFAULT '{}',
  operational_score INTEGER NOT NULL DEFAULT 0,
  bottlenecks TEXT[] NOT NULL DEFAULT '{}',
  observations TEXT[] NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_business_id ON reports(business_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can view reports" ON reports;
CREATE POLICY "Business owners can view reports" ON reports
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================
-- INTEGRATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('twilio', 'gmail', 'webhook')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  config JSONB NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Business owners can manage integrations" ON integrations;
CREATE POLICY "Business owners can manage integrations" ON integrations
  FOR ALL USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- =============================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS businesses_updated_at ON businesses;
CREATE TRIGGER businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO lead_events (lead_id, business_id, type, title, description)
    VALUES (NEW.id, NEW.business_id, 'status_change', 'Status Changed',
      format('Status changed from %s to %s', OLD.status, NEW.status));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lead_status_change_log ON leads;
CREATE TRIGGER lead_status_change_log
  AFTER UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION log_lead_status_change();

-- =============================================================
-- REALTIME (safe to run even if already added)
-- =============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'communications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE communications;
  END IF;
END $$;
