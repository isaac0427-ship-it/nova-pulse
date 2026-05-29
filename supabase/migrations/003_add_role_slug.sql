-- Migration 003: Add role/slug to businesses, set up Isaac, seed Arctic Air HVAC
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Add columns
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client'
  CHECK (role IN ('super_admin', 'client'));

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Unique constraint on slug
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'businesses_slug_key' AND table_name = 'businesses'
  ) THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_role ON businesses(role);

-- 3. Set Isaac as super_admin
DO $$
DECLARE
  isaac_id UUID;
  isaac_biz_id UUID;
BEGIN
  SELECT id INTO isaac_id FROM auth.users WHERE email = 'isaac_0427@icloud.com' LIMIT 1;

  IF isaac_id IS NOT NULL THEN
    SELECT id INTO isaac_biz_id FROM businesses WHERE owner_id = isaac_id LIMIT 1;

    IF isaac_biz_id IS NOT NULL THEN
      UPDATE businesses SET role = 'super_admin', slug = 'nova' WHERE id = isaac_biz_id;
    ELSE
      INSERT INTO businesses (
        owner_id, name, type, owner_name, phone, email, timezone, business_hours,
        gmail_connected, role, slug
      ) VALUES (
        isaac_id, 'Nova Systems', 'saas', 'Isaac Crosby', '+18605550100',
        'isaac_0427@icloud.com', 'America/New_York',
        '{"monday":{"open":true,"start":"09:00","end":"17:00"},"tuesday":{"open":true,"start":"09:00","end":"17:00"},"wednesday":{"open":true,"start":"09:00","end":"17:00"},"thursday":{"open":true,"start":"09:00","end":"17:00"},"friday":{"open":true,"start":"09:00","end":"17:00"},"saturday":{"open":false,"start":"09:00","end":"17:00"},"sunday":{"open":false,"start":"09:00","end":"17:00"}}',
        false, 'super_admin', 'nova'
      );
    END IF;
  END IF;
END $$;

-- 4. Create Arctic Air HVAC user + business + 47 leads
DO $$
DECLARE
  arctic_uid UUID;
  arctic_bid UUID;
  now_ts TIMESTAMPTZ := now();
BEGIN

  -- Create auth user for Arctic Air
  SELECT id INTO arctic_uid FROM auth.users WHERE email = 'mike@arcticairhvac.com' LIMIT 1;

  IF arctic_uid IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'mike@arcticairhvac.com',
      crypt('ArcticAir2024!', gen_salt('bf')),
      now_ts, now_ts, now_ts,
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Mike Torres"}',
      'authenticated', 'authenticated',
      '', '', '', ''
    ) RETURNING id INTO arctic_uid;

    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'mike@arcticairhvac.com',
      arctic_uid,
      format('{"sub":"%s","email":"mike@arcticairhvac.com"}', arctic_uid)::jsonb,
      'email', now_ts, now_ts, now_ts
    );
  END IF;

  -- Create or update Arctic Air business
  SELECT id INTO arctic_bid FROM businesses WHERE slug = 'arctic-air' OR owner_id = arctic_uid LIMIT 1;

  IF arctic_bid IS NULL THEN
    INSERT INTO businesses (
      id, owner_id, name, type, owner_name, phone, email, timezone, business_hours,
      twilio_number, gmail_connected, role, slug, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), arctic_uid,
      'Arctic Air HVAC', 'hvac', 'Mike Torres', '+18605550142',
      'mike@arcticairhvac.com', 'America/New_York',
      '{"monday":{"open":true,"start":"07:00","end":"18:00"},"tuesday":{"open":true,"start":"07:00","end":"18:00"},"wednesday":{"open":true,"start":"07:00","end":"18:00"},"thursday":{"open":true,"start":"07:00","end":"18:00"},"friday":{"open":true,"start":"07:00","end":"18:00"},"saturday":{"open":true,"start":"08:00","end":"14:00"},"sunday":{"open":false,"start":"09:00","end":"17:00"}}',
      '+19789136892', false, 'client', 'arctic-air',
      now_ts - interval '60 days', now_ts
    ) RETURNING id INTO arctic_bid;
  ELSE
    UPDATE businesses SET role = 'client', slug = 'arctic-air', owner_id = arctic_uid WHERE id = arctic_bid;
  END IF;

  -- Clear existing leads for clean seed
  DELETE FROM leads WHERE business_id = arctic_bid;

  -- Seed 47 leads
  -- Legend: MISSED = phone_call + new/ignored + no response_time_seconds
  -- DEAD = last_activity_at > 72h ago

  -- Lead 1: Contacted phone call (NOT a missed call)
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'contacted', 'James Kowalski', '+18605551001', 'A/C unit making noise', now_ts-interval '3 days', now_ts-interval '2 days 22 hours', now_ts-interval '2 days 23 hours 50 min', 600, now_ts-interval '3 days', now_ts-interval '2 days');

  -- Lead 2: MISSED CALL
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'new', 'Patricia Murphy', '+18605551002', NULL, now_ts-interval '1 day', now_ts-interval '1 day', NULL, NULL, now_ts-interval '1 day', now_ts-interval '1 day');

  -- Lead 3: waiting
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'waiting', 'Robert Chen', '+18605551003', 'Heating system replacement quote', now_ts-interval '4 days', now_ts-interval '1 day', now_ts-interval '3 days 22 hours', 7200, now_ts-interval '4 days', now_ts-interval '1 day');

  -- Lead 4: booked
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'booked', 'Linda Williams', '+18605551004', 'Annual maintenance appointment', now_ts-interval '5 days', now_ts-interval '3 days', now_ts-interval '4 days 22 hours 15 min', 2700, now_ts-interval '5 days', now_ts-interval '3 days');

  -- Lead 5: MISSED CALL
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'new', 'Michael Anderson', '+18605551005', NULL, now_ts-interval '2 days', now_ts-interval '2 days', NULL, NULL, now_ts-interval '2 days', now_ts-interval '2 days');

  -- Lead 6: quoted
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'quoted', 'Barbara Thompson', '+18605551006', 'Full HVAC replacement, 3,000 sq ft home', now_ts-interval '7 days', now_ts-interval '2 days', now_ts-interval '6 days 22 hours', 7200, now_ts-interval '7 days', now_ts-interval '2 days');

  -- Lead 7: DEAD - waiting, 4 days no activity
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'waiting', 'William Martinez', '+18605551007', 'Waiting on price confirmation', now_ts-interval '8 days', now_ts-interval '4 days 2 hours', now_ts-interval '7 days 20 hours', 14400, now_ts-interval '8 days', now_ts-interval '4 days 2 hours');

  -- Lead 8: closed
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'closed', 'Elizabeth Davis', '+18605551008', 'Installed new Carrier system', now_ts-interval '10 days', now_ts-interval '3 days', now_ts-interval '10 days 23 hours 40 min', 1200, now_ts-interval '10 days', now_ts-interval '3 days');

  -- Lead 9: new, today
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'new', 'David Wilson', '+18605551009', 'AC not cooling, needs inspection', now_ts-interval '6 hours', now_ts-interval '6 hours', NULL, NULL, now_ts-interval '6 hours', now_ts-interval '6 hours');

  -- Lead 10: contacted
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'email', 'contacted', 'Jennifer Taylor', '+18605551010', 'Ductwork inspection request', now_ts-interval '3 days', now_ts-interval '2 days', now_ts-interval '2 days 23 hours', 3600, now_ts-interval '3 days', now_ts-interval '2 days');

  -- Lead 11: MISSED CALL (recently missed, not dead)
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'new', 'Richard Moore', '+18605551011', NULL, now_ts-interval '2 days 4 hours', now_ts-interval '2 days 4 hours', NULL, NULL, now_ts-interval '2 days 4 hours', now_ts-interval '2 days 4 hours');

  -- Lead 12: booked
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'booked', 'Susan Jackson', '+18605551012', 'Emergency AC repair booked', now_ts-interval '4 days', now_ts-interval '1 day', now_ts-interval '3 days 23 hours 50 min', 600, now_ts-interval '4 days', now_ts-interval '1 day');

  -- Lead 13: lost
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'lost', 'Joseph White', '+18605551013', 'Went with another contractor', now_ts-interval '15 days', now_ts-interval '8 days', now_ts-interval '14 days 22 hours', 5400, now_ts-interval '15 days', now_ts-interval '8 days');

  -- Lead 14: contacted
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'contacted', 'Thomas Harris', '+18605551014', 'Furnace tune-up inquiry', now_ts-interval '1 day 4 hours', now_ts-interval '1 day', now_ts-interval '1 day 3 hours 35 min', 1500, now_ts-interval '1 day 4 hours', now_ts-interval '1 day');

  -- Lead 15: new, today
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'manual', 'new', 'Jessica Lewis', '+18605551015', 'Referred by existing customer', now_ts-interval '3 hours', now_ts-interval '3 hours', NULL, NULL, now_ts-interval '3 hours', now_ts-interval '3 hours');

  -- Lead 16: quoted
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'quoted', 'Charles Robinson', '+18605551016', 'Commercial HVAC for small office', now_ts-interval '8 days', now_ts-interval '2 days', now_ts-interval '7 days 21 hours', 10800, now_ts-interval '8 days', now_ts-interval '2 days');

  -- Lead 17: DEAD - waiting, 5 days no activity
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'waiting', 'Sarah Clark', '+18605551017', 'Waiting on homeowner approval', now_ts-interval '9 days', now_ts-interval '5 days 3 hours', now_ts-interval '8 days 21 hours', 10800, now_ts-interval '9 days', now_ts-interval '5 days 3 hours');

  -- Lead 18: MISSED CALL
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'new', 'Christopher Rodriguez', '+18605551018', NULL, now_ts-interval '3 days', now_ts-interval '3 days', NULL, NULL, now_ts-interval '3 days', now_ts-interval '3 days');

  -- Lead 19: booked
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'email', 'booked', 'Lisa Walker', '+18605551019', 'New construction HVAC install', now_ts-interval '6 days', now_ts-interval '2 days', now_ts-interval '5 days 22 hours 20 min', 2400, now_ts-interval '6 days', now_ts-interval '2 days');

  -- Lead 20: closed
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'closed', 'Matthew Hall', '+18605551020', 'Replaced condenser unit', now_ts-interval '12 days', now_ts-interval '4 days', now_ts-interval '11 days 23 hours', 3600, now_ts-interval '12 days', now_ts-interval '4 days');

  -- Lead 21: MISSED CALL
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'new', 'Nancy Young', '+18605551021', NULL, now_ts-interval '1 day 6 hours', now_ts-interval '1 day 6 hours', NULL, NULL, now_ts-interval '1 day 6 hours', now_ts-interval '1 day 6 hours');

  -- Lead 22: waiting
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'waiting', 'Mark Allen', '+18605551022', 'Requesting extended warranty info', now_ts-interval '5 days', now_ts-interval '2 days', now_ts-interval '4 days 22 hours', 9000, now_ts-interval '5 days', now_ts-interval '2 days');

  -- Lead 23: DEAD - lost, 7 days no activity
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'lost', 'Betty King', '+18605551023', 'Price too high', now_ts-interval '20 days', now_ts-interval '7 days 4 hours', now_ts-interval '19 days 22 hours', 5400, now_ts-interval '20 days', now_ts-interval '7 days 4 hours');

  -- Lead 24: MISSED CALL + DEAD
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'ignored', 'Steven Wright', '+18605551024', NULL, now_ts-interval '7 days', now_ts-interval '6 days 2 hours', NULL, NULL, now_ts-interval '7 days', now_ts-interval '6 days 2 hours');

  -- Lead 25: DEAD - ignored, 10 days
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'ignored', 'Dorothy Scott', '+18605551025', 'Submitted form, never followed up', now_ts-interval '25 days', now_ts-interval '10 days 5 hours', NULL, NULL, now_ts-interval '25 days', now_ts-interval '10 days 5 hours');

  -- Lead 26: waiting
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'waiting', 'Edward Green', '+18605551026', 'Scheduling conflict, will call back', now_ts-interval '3 days', now_ts-interval '1 day', now_ts-interval '2 days 22 hours 30 min', 5400, now_ts-interval '3 days', now_ts-interval '1 day');

  -- Lead 27: MISSED CALL
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'new', 'Margaret Adams', '+18605551027', NULL, now_ts-interval '2 days 8 hours', now_ts-interval '2 days 8 hours', NULL, NULL, now_ts-interval '2 days 8 hours', now_ts-interval '2 days 8 hours');

  -- Lead 28: new, today
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'email', 'new', 'Kevin Baker', '+18605551028', 'Heat pump installation quote', now_ts-interval '4 hours', now_ts-interval '4 hours', NULL, NULL, now_ts-interval '4 hours', now_ts-interval '4 hours');

  -- Lead 29: booked
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'booked', 'Carol Gonzalez', '+18605551029', 'Spring AC tune-up booked for Sat', now_ts-interval '3 days', now_ts-interval '1 day', now_ts-interval '2 days 23 hours 10 min', 3000, now_ts-interval '3 days', now_ts-interval '1 day');

  -- Lead 30: closed
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'closed', 'Brian Nelson', '+18605551030', 'Replaced blower motor', now_ts-interval '9 days', now_ts-interval '5 days', now_ts-interval '8 days 23 hours 25 min', 2100, now_ts-interval '9 days', now_ts-interval '5 days');

  -- Lead 31: quoted
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'quoted', 'Ruth Carter', '+18605551031', 'Full system replacement quote sent', now_ts-interval '5 days', now_ts-interval '1 day', now_ts-interval '4 days 23 hours 35 min', 1500, now_ts-interval '5 days', now_ts-interval '1 day');

  -- Lead 32: waiting
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'waiting', 'Kenneth Mitchell', '+18605551032', 'Customer reviewing proposal', now_ts-interval '6 days', now_ts-interval '2 days', now_ts-interval '5 days 21 hours', 10800, now_ts-interval '6 days', now_ts-interval '2 days');

  -- Lead 33: MISSED CALL + DEAD
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'ignored', 'Sharon Perez', '+18605551033', NULL, now_ts-interval '9 days', now_ts-interval '8 days 3 hours', NULL, NULL, now_ts-interval '9 days', now_ts-interval '8 days 3 hours');

  -- Lead 34: new, today
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'new', 'George Roberts', '+18605551034', 'AC making loud noise upstairs', now_ts-interval '2 hours', now_ts-interval '2 hours', NULL, NULL, now_ts-interval '2 hours', now_ts-interval '2 hours');

  -- Lead 35: MISSED CALL
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'new', 'Donna Turner', '+18605551035', NULL, now_ts-interval '1 day 2 hours', now_ts-interval '1 day 2 hours', NULL, NULL, now_ts-interval '1 day 2 hours', now_ts-interval '1 day 2 hours');

  -- Lead 36: lost
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'lost', 'Larry Phillips', '+18605551036', 'Already hired another company', now_ts-interval '14 days', now_ts-interval '6 days', now_ts-interval '13 days 23 hours', 3600, now_ts-interval '14 days', now_ts-interval '6 days');

  -- Lead 37: DEAD - waiting, 4 days
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'email', 'waiting', 'Carol Campbell', '+18605551037', 'Needs approval from property management', now_ts-interval '7 days', now_ts-interval '4 days 5 hours', now_ts-interval '6 days 22 hours', 7200, now_ts-interval '7 days', now_ts-interval '4 days 5 hours');

  -- Lead 38: MISSED CALL
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'new', 'Jerry Parker', '+18605551038', NULL, now_ts-interval '2 days 6 hours', now_ts-interval '2 days 6 hours', NULL, NULL, now_ts-interval '2 days 6 hours', now_ts-interval '2 days 6 hours');

  -- Lead 39: closed
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'closed', 'Virginia Evans', '+18605551039', 'New Lennox system installed', now_ts-interval '11 days', now_ts-interval '3 days', now_ts-interval '10 days 22 hours', 5400, now_ts-interval '11 days', now_ts-interval '3 days');

  -- Lead 40: new, today
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'new', 'Aaron Edwards', '+18605551040', 'No heat, emergency', now_ts-interval '1 hour', now_ts-interval '1 hour', NULL, NULL, now_ts-interval '1 hour', now_ts-interval '1 hour');

  -- Lead 41: booked
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'booked', 'Kathleen Collins', '+18605551041', 'Fall furnace service scheduled', now_ts-interval '2 days', now_ts-interval '12 hours', now_ts-interval '1 day 23 hours', 3600, now_ts-interval '2 days', now_ts-interval '12 hours');

  -- Lead 42: MISSED CALL + DEAD
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'ignored', 'Carl Stewart', '+18605551042', NULL, now_ts-interval '7 days', now_ts-interval '6 days 4 hours', NULL, NULL, now_ts-interval '7 days', now_ts-interval '6 days 4 hours');

  -- Lead 43: waiting
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'email', 'waiting', 'Christine Sanchez', '+18605551043', 'Comparing 3 quotes, will decide soon', now_ts-interval '3 days', now_ts-interval '1 day', now_ts-interval '2 days 22 hours', 3600, now_ts-interval '3 days', now_ts-interval '1 day');

  -- Lead 44: quoted
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'quoted', 'Arthur Morris', '+18605551044', 'Zoning system for 2-story home', now_ts-interval '6 days', now_ts-interval '2 days', now_ts-interval '5 days 21 hours', 9000, now_ts-interval '6 days', now_ts-interval '2 days');

  -- Lead 45: lost
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'sms', 'lost', 'Carolyn Rogers', '+18605551045', 'Decided to repair rather than replace', now_ts-interval '16 days', now_ts-interval '7 days', now_ts-interval '15 days 22 hours', 7200, now_ts-interval '16 days', now_ts-interval '7 days');

  -- Lead 46: MISSED CALL + DEAD
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'phone_call', 'ignored', 'Henry Reed', '+18605551046', NULL, now_ts-interval '8 days', now_ts-interval '7 days 3 hours', NULL, NULL, now_ts-interval '8 days', now_ts-interval '7 days 3 hours');

  -- Lead 47: new, today
  INSERT INTO leads (id, business_id, source, status, name, phone, notes, first_contact_at, last_activity_at, first_response_at, response_time_seconds, created_at, updated_at)
  VALUES (gen_random_uuid(), arctic_bid, 'web_form', 'new', 'Diane Cook', '+18605551047', 'AC unit leaking water', now_ts-interval '30 minutes', now_ts-interval '30 minutes', NULL, NULL, now_ts-interval '30 minutes', now_ts-interval '30 minutes');

END $$;
