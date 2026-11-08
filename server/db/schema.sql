-- =========================================================================
-- Anusandhan (अनुसंधान) - Production PostgreSQL Schema
-- Tuned for Supabase / Neon with PgBouncer Connection Pooling
-- =========================================================================

-- 1. Users & Scholars
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    university VARCHAR(255) DEFAULT 'Regional / State University',
    degree_level VARCHAR(64) DEFAULT 'B.Tech / B.S.',
    current_year VARCHAR(64) DEFAULT '3rd Year (Class of 2027)',
    cgpa NUMERIC(4, 2) DEFAULT 8.50,
    target_domains TEXT[] DEFAULT ARRAY['Artificial Intelligence & ML']::TEXT[],
    skills TEXT[] DEFAULT ARRAY['Python', 'PyTorch', 'Git']::TEXT[],
    rrs_score INTEGER DEFAULT 75,
    rrs_tier VARCHAR(64) DEFAULT 'Junior Researcher',
    credits_remaining INTEGER DEFAULT 5,
    daily_outreach_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_rrs_tier ON users (rrs_tier);

-- 2. Verified Faculty & Laboratories
CREATE TABLE IF NOT EXISTS faculty (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    university VARCHAR(255) NOT NULL,
    lab_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    domain VARCHAR(128) NOT NULL,
    scope VARCHAR(32) NOT NULL CHECK (scope IN ('national', 'global')),
    research_focus TEXT NOT NULL,
    recent_paper JSONB NOT NULL,
    metrics JSONB NOT NULL,
    active_grant JSONB,
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faculty_scope_domain ON faculty (scope, domain);
CREATE INDEX IF NOT EXISTS idx_faculty_university ON faculty (university);
CREATE INDEX IF NOT EXISTS idx_faculty_name ON faculty (name);

-- 3. Prestige Fellowship Programs
CREATE TABLE IF NOT EXISTS fellowships (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    host_institutions VARCHAR(255) NOT NULL,
    host_country VARCHAR(128) NOT NULL,
    stipend_display VARCHAR(255) NOT NULL,
    deadline_days_left INTEGER NOT NULL,
    requires_prior_acceptance BOOLEAN DEFAULT false,
    eligibility TEXT NOT NULL,
    official_url VARCHAR(512) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fellowships_deadline ON fellowships (deadline_days_left);
CREATE INDEX IF NOT EXISTS idx_fellowships_prior_outreach ON fellowships (requires_prior_acceptance);

-- 4. Student Outreach Pipeline & CRM
CREATE TABLE IF NOT EXISTS outreach_drafts (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professor_id VARCHAR(64) NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    professor_name VARCHAR(255) NOT NULL,
    professor_university VARCHAR(255) NOT NULL,
    paper_title VARCHAR(512) NOT NULL,
    subject_line VARCHAR(512) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'Drafted' CHECK (status IN ('Drafted', 'Queued', 'Sent', 'Opened', 'Replied', 'Interview Scheduled', 'Rejected', 'Follow-up Due')),
    days_since_sent INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drafts_student_status ON outreach_drafts (student_id, status);
CREATE INDEX IF NOT EXISTS idx_drafts_followup ON outreach_drafts (status, days_since_sent);

-- 5. Billing, Orders & GST Invoicing Ledger
CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(128) PRIMARY KEY,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id VARCHAR(64) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'INR',
    status VARCHAR(32) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
    gateway VARCHAR(32) NOT NULL CHECK (gateway IN ('razorpay', 'stripe')),
    payment_id VARCHAR(128),
    invoice_number VARCHAR(128),
    credits_allocated INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_student ON orders (student_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
