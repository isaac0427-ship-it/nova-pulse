-- 005: Full tracking schema extensions
-- Run in Supabase SQL Editor

-- Add forwarding/notification columns to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS forwarding_phone TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS notify_phone TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS avg_customer_value INTEGER DEFAULT 500;

-- Extend leads status CHECK to include 'dead'
DO $$
BEGIN
  BEGIN
    ALTER TABLE leads DROP CONSTRAINT leads_status_check;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (
    status IN ('new','contacted','waiting','booked','quoted','closed','lost','ignored','dead')
  );
END $$;

-- Update Arctic Air with real Twilio + forwarding numbers
UPDATE businesses SET
  twilio_number    = '+19789136892',
  forwarding_phone = '+12037060504',
  notify_phone     = '+12037060504',
  avg_customer_value = 400
WHERE email = 'mike@arcticairhvac.com';

-- Confirm Isaac super_admin entry has notify phone
UPDATE businesses SET
  notify_phone = '+12037060504'
WHERE email = 'isaac_0427@icloud.com';
