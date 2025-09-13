-- sBTC Payment Gateway SQLite Schema
-- SQLite-compatible schema for payments and merchants

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    merchant_id TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    email TEXT NOT NULL,
    stacks_address TEXT,
    is_active INTEGER DEFAULT 1,
    api_key TEXT UNIQUE,
    webhook_url TEXT,
    total_processed REAL DEFAULT 0,
    fee_collected REAL DEFAULT 0,
    payments_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    payment_id TEXT UNIQUE NOT NULL,
    merchant_id TEXT NOT NULL,
    amount_in_sats INTEGER NOT NULL CHECK (amount_in_sats > 0),
    fee_amount INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'SATS',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled')),
    description TEXT,
    customer_address TEXT,
    stacks_tx_id TEXT,
    blockchain_status TEXT DEFAULT 'none',
    expires_at DATETIME NOT NULL,
    confirmed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT, -- JSON stored as text in SQLite
    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id) ON DELETE RESTRICT
);

-- Create payment_events table for audit trail
CREATE TABLE IF NOT EXISTS payment_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    payment_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT, -- JSON stored as text in SQLite
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_merchants_merchant_id ON merchants(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchants_api_key ON merchants(api_key);
CREATE INDEX IF NOT EXISTS idx_merchants_is_active ON merchants(is_active);

CREATE INDEX IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments(expires_at);
CREATE INDEX IF NOT EXISTS idx_payments_stacks_tx_id ON payments(stacks_tx_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at);

-- Create triggers to automatically update updated_at (SQLite version)
CREATE TRIGGER IF NOT EXISTS update_merchants_updated_at
    AFTER UPDATE ON merchants
    FOR EACH ROW
BEGIN
    UPDATE merchants SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_payments_updated_at
    AFTER UPDATE ON payments
    FOR EACH ROW
BEGIN
    UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Create views for common queries (SQLite compatible)
CREATE VIEW IF NOT EXISTS active_merchants AS
SELECT * FROM merchants WHERE is_active = 1;

CREATE VIEW IF NOT EXISTS pending_payments AS
SELECT p.*, m.business_name, m.email as merchant_email
FROM payments p
JOIN merchants m ON p.merchant_id = m.merchant_id
WHERE p.status = 'pending' AND p.expires_at > datetime('now');

CREATE VIEW IF NOT EXISTS payment_stats AS
SELECT 
    m.merchant_id,
    m.business_name,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount_in_sats ELSE 0 END) as total_completed_sats,
    SUM(CASE WHEN p.status = 'completed' THEN p.fee_amount ELSE 0 END) as total_fees,
    AVG(CASE WHEN p.status = 'completed' THEN p.amount_in_sats ELSE NULL END) as avg_payment_amount
FROM merchants m
LEFT JOIN payments p ON m.merchant_id = p.merchant_id
GROUP BY m.merchant_id, m.business_name;

-- Insert default admin merchant for testing (SQLite compatible)
INSERT OR IGNORE INTO merchants (merchant_id, business_name, email, api_key, is_active)
VALUES ('default-merchant', 'Default Merchant', 'admin@sbtcgateway.com', 'dev-api-key-12345', 1);