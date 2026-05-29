CREATE TABLE IF NOT EXISTS diagnostic_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  monthly_leads TEXT,
  biggest_challenge TEXT,
  referral_source TEXT,
  best_contact_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
