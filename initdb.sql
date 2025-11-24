CREATE DATABASE subscription_db;
CREATE DATABASE payment_db;


\connect subscription_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "firstName" VARCHAR(255) NOT NULL,
  "lastName"  VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  "manHours" INT NOT NULL,
  "pricePerManHour" NUMERIC(10,2) DEFAULT 0,
  "billingCycle" VARCHAR(20) NOT NULL DEFAULT 'free',
  discount NUMERIC(5,2) DEFAULT NULL,
  features JSON DEFAULT '[]'::json
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "planId" UUID REFERENCES plans(id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL DEFAULT 'active',          
  "paymentStatus" VARCHAR(20) NOT NULL DEFAULT 'pending',

  "startDate" TIMESTAMP NOT NULL DEFAULT NOW(),
  "endDate" TIMESTAMP NULL,

  "manHoursUsed" INT DEFAULT 0,

  "totalCost" NUMERIC(10,2) DEFAULT 0,

  "paymentId" VARCHAR NULL,

  "pendingChange" JSON NULL,

  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  "bonusManHours" INT NOT NULL DEFAULT 0,
  "startsAt" TIMESTAMP NOT NULL,
  "endsAt" TIMESTAMP NOT NULL,
  "maxUses" INT NULL,
  "usedCount" INT NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- NEW: Add referralId column to users (FK to referrals)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "referralId" UUID NULL;

ALTER TABLE users
  ADD CONSTRAINT fk_users_referral
  FOREIGN KEY ("referralId")
  REFERENCES referrals(id)
  ON DELETE SET NULL;


INSERT INTO users (id, "firstName", "lastName", email, password, "isActive") VALUES
  ('00000000-0000-0000-0000-000000000001', 'Alice', 'Johnson', 'alice@example.com',
    '$2b$10$N9qo8uLOickgx2ZMRZo5e.NHn84qxdloQbaO5SpM90oCbGyF/F7Sy', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'Bob',   'Smith',   'bob@example.com',
    '$2b$10$N9qo8uLOickgx2ZMRZo5e.NHn84qxdloQbaO5SpM90oCbGyF/F7Sy', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'Carol', 'Lee',     'carol@example.com',
    '$2b$10$N9qo8uLOickgx2ZMRZo5e.NHn84qxdloQbaO5SpM90oCbGyF/F7Sy', TRUE)
ON CONFLICT (email) DO NOTHING;


INSERT INTO plans (id, name, "manHours", "pricePerManHour", "billingCycle", discount, features) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Free',   20,   0.00, 'free', NULL, '["Basic insights"]'),
  ('10000000-0000-0000-0000-000000000002', 'Pro',    20,   1.50, 'monthly', 15,   '["AI Workflow Assist","Priority Support"]'),
  ('10000000-0000-0000-0000-000000000003', 'Scale', 1000,  0.00, 'custom',  NULL, '["Dedicated Support","Unlimited Man-Hours"]')
ON CONFLICT (name) DO NOTHING;


INSERT INTO referrals (
  id, code, "bonusManHours", "startsAt", "endsAt", "maxUses", "usedCount", "isActive"
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'REF50',
    50,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '60 days',
    NULL,
    0,
    TRUE
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    'REF100',
    100,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '60 days',
    NULL,
    0,
    TRUE
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    'REF150',
    150,
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '60 days',
    NULL,
    0,
    TRUE
  )
ON CONFLICT (code) DO NOTHING;

UPDATE users
SET "referralId" = '20000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE users
SET "referralId" = '20000000-0000-0000-0000-000000000002'
WHERE id = '00000000-0000-0000-0000-000000000002';


INSERT INTO subscriptions (
  id, "userId", "planId", status, "paymentStatus",
  "startDate", "endDate", "manHoursUsed", "totalCost", "paymentId", "pendingChange"
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001', 
    '10000000-0000-0000-0000-000000000001', 
    'active',
    'success',
    NOW() - INTERVAL '20 days',
    NULL,
    5,
    0.00,
    'pay_success_1',
    NULL
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000002', 
    '10000000-0000-0000-0000-000000000002', 
    'pending_payment',
    'pending',
    NOW(),
    NULL,
    0,
    30.00,
    'pay_pending_1',
    NULL
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000002', 
    '10000000-0000-0000-0000-000000000002', 
    'canceled',
    'success',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '30 days',
    20,
    45.00,
    'pay_success_2',
    NULL
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000003', 
    '10000000-0000-0000-0000-000000000002', 
    'active',
    'pending',
    NOW() - INTERVAL '5 days',
    NULL,
    2,
    25.50,
    'pay_pending_2',
    '{"type": "upgrade", "newPlanId": "10000000-0000-0000-0000-000000000003", "newManHours": 1000}'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '00000000-0000-0000-0000-000000000003', 
    '10000000-0000-0000-0000-000000000003', 
    'failed',
    'failed',
    NOW() - INTERVAL '1 day',
    NULL,
    0,
    120.00,
    'pay_failed_1',
    NULL
  );

-- 2. Payment Service DB (payment_db)
\connect payment_db;

-- Enable UUID extension in this DB as well
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS payment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "subscriptionId" UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  "webhookUrl" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO payment ("subscriptionId", amount, currency, status, attempts, "webhookUrl") VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    0.00,
    'USD',
    'success',
    1,
    'http://subscription-service:3000/webhooks/payment'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    30.00,
    'USD',
    'pending',
    0,
    'http://subscription-service:3000/webhooks/payment'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    45.00,
    'USD',
    'success',
    2,
    'http://subscription-service:3000/webhooks/payment'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    25.50,
    'USD',
    'pending',
    1,
    'http://subscription-service:3000/webhooks/payment'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    120.00,
    'USD',
    'failed',
    3,
    'http://subscription-service:3000/webhooks/payment'
  );
