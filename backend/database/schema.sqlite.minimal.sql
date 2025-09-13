-- sBTC Payment Gateway SQLite Schema (Minimal)
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
    metadata TEXT,
    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id) ON DELETE RESTRICT
);

-- Create payment_events table for audit trail
CREATE TABLE IF NOT EXISTS payment_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    payment_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data TEXT,
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

-- Create bitcoin_addresses table for Bitcoin → sBTC flow
CREATE TABLE IF NOT EXISTS bitcoin_addresses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    payment_id TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    address_type TEXT DEFAULT 'p2wpkh',
    seed TEXT NOT NULL,
    network TEXT DEFAULT 'testnet',
    is_monitored INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE
);

-- Create bitcoin_transactions table for tracking deposits
CREATE TABLE IF NOT EXISTS bitcoin_transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    payment_id TEXT NOT NULL,
    bitcoin_address TEXT NOT NULL,
    txid TEXT NOT NULL,
    vout INTEGER NOT NULL,
    value_satoshis INTEGER NOT NULL,
    confirmations INTEGER DEFAULT 0,
    block_height INTEGER,
    block_hash TEXT,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    is_confirmed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id) ON DELETE CASCADE,
    UNIQUE(txid, vout)
);

-- Bitcoin-related indexes
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_payment_id ON bitcoin_addresses(payment_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_address ON bitcoin_addresses(address);
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_is_monitored ON bitcoin_addresses(is_monitored);
CREATE INDEX IF NOT EXISTS idx_bitcoin_transactions_payment_id ON bitcoin_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_transactions_txid ON bitcoin_transactions(txid);
CREATE INDEX IF NOT EXISTS idx_bitcoin_transactions_is_confirmed ON bitcoin_transactions(is_confirmed);

-- Insert default admin merchant for testing (SQLite compatible)
INSERT OR IGNORE INTO merchants (merchant_id, business_name, email, api_key, is_active)
VALUES ('default-merchant', 'Default Merchant', 'admin@sbtcgateway.com', 'dev-api-key-12345', 1);