-- Bitcoin Address Monitoring Schema
-- Extends existing sBTC Payment Gateway schema with Bitcoin functionality

-- Create bitcoin_addresses table
CREATE TABLE IF NOT EXISTS bitcoin_addresses (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    payment_id TEXT UNIQUE NOT NULL,
    address TEXT NOT NULL,
    address_type TEXT DEFAULT 'p2wpkh', -- p2wpkh, p2sh, p2pkh, etc.
    seed TEXT NOT NULL, -- For address derivation
    network TEXT DEFAULT 'testnet', -- mainnet or testnet
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

-- Create indexes for Bitcoin tables
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_payment_id ON bitcoin_addresses(payment_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_address ON bitcoin_addresses(address);
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_is_monitored ON bitcoin_addresses(is_monitored);
CREATE INDEX IF NOT EXISTS idx_bitcoin_addresses_network ON bitcoin_addresses(network);

CREATE INDEX IF NOT EXISTS idx_bitcoin_transactions_payment_id ON bitcoin_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_transactions_bitcoin_address ON bitcoin_transactions(bitcoin_address);
CREATE INDEX IF NOT EXISTS idx_bitcoin_transactions_txid ON bitcoin_transactions(txid);
CREATE INDEX IF NOT EXISTS idx_bitcoin_transactions_is_confirmed ON bitcoin_transactions(is_confirmed);
CREATE INDEX IF NOT EXISTS idx_bitcoin_transactions_confirmations ON bitcoin_transactions(confirmations);

-- Add new payment statuses for Bitcoin → sBTC flow
-- Note: We already have the basic statuses, but we'll document the new ones here
-- 'pending' -> 'awaiting_deposit' -> 'deposit_detected' -> 'deposit_confirmed' -> 'processing' -> 'completed'

-- Update payments table to include Bitcoin-specific fields
-- (These are optional additions to the existing payments table)
ALTER TABLE payments ADD COLUMN bitcoin_address TEXT;
ALTER TABLE payments ADD COLUMN bitcoin_txid TEXT;
ALTER TABLE payments ADD COLUMN bitcoin_confirmations INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN deposit_detected_at DATETIME;
ALTER TABLE payments ADD COLUMN deposit_confirmed_at DATETIME;

-- Create view for Bitcoin payment monitoring
CREATE VIEW IF NOT EXISTS bitcoin_payment_status AS
SELECT 
    p.payment_id,
    p.merchant_id,
    p.amount_in_sats,
    p.status,
    p.bitcoin_address,
    p.bitcoin_confirmations,
    p.deposit_detected_at,
    p.deposit_confirmed_at,
    ba.address as deposit_address,
    ba.network as bitcoin_network,
    ba.is_monitored,
    COALESCE(SUM(bt.value_satoshis), 0) as total_received_satoshis,
    COUNT(bt.id) as transaction_count,
    MAX(bt.confirmations) as max_confirmations,
    p.created_at,
    p.expires_at
FROM payments p
LEFT JOIN bitcoin_addresses ba ON p.payment_id = ba.payment_id
LEFT JOIN bitcoin_transactions bt ON p.payment_id = bt.payment_id AND bt.is_confirmed = 1
WHERE ba.payment_id IS NOT NULL
GROUP BY p.payment_id, p.merchant_id, p.amount_in_sats, p.status, p.bitcoin_address, 
         p.bitcoin_confirmations, p.deposit_detected_at, p.deposit_confirmed_at,
         ba.address, ba.network, ba.is_monitored, p.created_at, p.expires_at;

-- Create monitoring stats view
CREATE VIEW IF NOT EXISTS bitcoin_monitoring_stats AS
SELECT 
    COUNT(*) as total_addresses,
    COUNT(CASE WHEN is_monitored = 1 THEN 1 END) as monitored_addresses,
    COUNT(CASE WHEN network = 'testnet' THEN 1 END) as testnet_addresses,
    COUNT(CASE WHEN network = 'mainnet' THEN 1 END) as mainnet_addresses,
    COUNT(CASE WHEN created_at > datetime('now', '-1 day') THEN 1 END) as addresses_created_today
FROM bitcoin_addresses;