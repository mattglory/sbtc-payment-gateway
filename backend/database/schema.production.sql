-- sBTC Payment Gateway Production PostgreSQL Schema
-- Optimized for Railway PostgreSQL deployment with production features

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- For query performance monitoring

-- Create merchants table with production optimizations
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    stacks_address VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    api_key VARCHAR(255) UNIQUE,
    webhook_url VARCHAR(1024),
    total_processed DECIMAL(20, 8) DEFAULT 0,
    fee_collected DECIMAL(20, 8) DEFAULT 0,
    payments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Production constraints
    CONSTRAINT merchants_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT merchants_total_processed_check CHECK (total_processed >= 0),
    CONSTRAINT merchants_fee_collected_check CHECK (fee_collected >= 0),
    CONSTRAINT merchants_payments_count_check CHECK (payments_count >= 0)
);

-- Create payments table with production features
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    merchant_id VARCHAR(255) NOT NULL REFERENCES merchants(merchant_id) ON DELETE RESTRICT,
    amount_in_sats BIGINT NOT NULL CHECK (amount_in_sats > 0),
    fee_amount BIGINT DEFAULT 0 CHECK (fee_amount >= 0),
    currency VARCHAR(10) DEFAULT 'SATS',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled', 'deposit_detected', 'deposit_confirmed')),
    description TEXT,
    customer_address VARCHAR(255),
    stacks_tx_id VARCHAR(255),
    blockchain_status VARCHAR(50) DEFAULT 'none',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    
    -- Production constraints
    CONSTRAINT payments_expires_at_future CHECK (expires_at > created_at),
    CONSTRAINT payments_confirmed_at_check CHECK (confirmed_at IS NULL OR confirmed_at >= created_at)
);

-- Create payment_events table for audit trail
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(255) NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Production indexes on this table
    INDEX idx_payment_events_created_at (created_at)
);

-- Bitcoin addresses table for Bitcoin → sBTC flow
CREATE TABLE IF NOT EXISTS bitcoin_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(255) UNIQUE NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    address VARCHAR(255) NOT NULL,
    address_type VARCHAR(20) DEFAULT 'p2wpkh',
    seed VARCHAR(255) NOT NULL,
    network VARCHAR(20) DEFAULT 'testnet' CHECK (network IN ('mainnet', 'testnet')),
    is_monitored BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Production constraints
    CONSTRAINT bitcoin_addresses_address_format CHECK (
        (network = 'mainnet' AND (address LIKE 'bc1%' OR address LIKE '3%' OR address LIKE '1%')) OR
        (network = 'testnet' AND (address LIKE 'tb1%' OR address LIKE '2%' OR address LIKE 'm%' OR address LIKE 'n%'))
    )
);

-- Bitcoin transactions table for tracking deposits
CREATE TABLE IF NOT EXISTS bitcoin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(255) NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    bitcoin_address VARCHAR(255) NOT NULL,
    txid VARCHAR(64) NOT NULL,
    vout INTEGER NOT NULL CHECK (vout >= 0),
    value_satoshis BIGINT NOT NULL CHECK (value_satoshis > 0),
    confirmations INTEGER DEFAULT 0 CHECK (confirmations >= 0),
    block_height INTEGER,
    block_hash VARCHAR(64),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    is_confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure unique transaction outputs
    UNIQUE(txid, vout),
    
    -- Production constraints
    CONSTRAINT bitcoin_tx_txid_format CHECK (LENGTH(txid) = 64 AND txid ~ '^[a-fA-F0-9]+$'),
    CONSTRAINT bitcoin_tx_block_hash_format CHECK (block_hash IS NULL OR (LENGTH(block_hash) = 64 AND block_hash ~ '^[a-fA-F0-9]+$')),
    CONSTRAINT bitcoin_tx_confirmed_consistency CHECK (
        (is_confirmed = false) OR 
        (is_confirmed = true AND confirmed_at IS NOT NULL AND confirmations > 0)
    )
);

-- Production-optimized indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_merchant_id ON merchants(merchant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_api_key ON merchants(api_key) WHERE api_key IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_is_active ON merchants(is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_merchants_created_at ON merchants(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_payment_id ON payments(payment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_expires_at ON payments(expires_at) WHERE expires_at > CURRENT_TIMESTAMP;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_stacks_tx_id ON payments(stacks_tx_id) WHERE stacks_tx_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_expires ON payments(status, expires_at) WHERE status IN ('pending', 'deposit_detected', 'processing');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_addresses_payment_id ON bitcoin_addresses(payment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_addresses_address ON bitcoin_addresses(address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_addresses_monitored ON bitcoin_addresses(is_monitored) WHERE is_monitored = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_addresses_network ON bitcoin_addresses(network);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_tx_payment_id ON bitcoin_transactions(payment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_tx_address ON bitcoin_transactions(bitcoin_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_tx_txid ON bitcoin_transactions(txid);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_tx_confirmed ON bitcoin_transactions(is_confirmed) WHERE is_confirmed = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_tx_confirmations ON bitcoin_transactions(confirmations) WHERE confirmations < 6;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bitcoin_tx_detected_at ON bitcoin_transactions(detected_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_merchants_updated_at ON merchants;
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bitcoin_addresses_updated_at ON bitcoin_addresses;
CREATE TRIGGER update_bitcoin_addresses_updated_at BEFORE UPDATE ON bitcoin_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bitcoin_tx_updated_at ON bitcoin_transactions;
CREATE TRIGGER update_bitcoin_tx_updated_at BEFORE UPDATE ON bitcoin_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Production views for monitoring and reporting
CREATE OR REPLACE VIEW active_merchants AS
SELECT 
    merchant_id,
    business_name,
    email,
    stacks_address,
    total_processed,
    fee_collected,
    payments_count,
    created_at,
    updated_at
FROM merchants 
WHERE is_active = true;

CREATE OR REPLACE VIEW pending_payments AS
SELECT 
    p.payment_id,
    p.merchant_id,
    p.amount_in_sats,
    p.status,
    p.description,
    p.expires_at,
    p.created_at,
    m.business_name,
    m.email as merchant_email,
    ba.address as bitcoin_address,
    ba.network as bitcoin_network
FROM payments p
JOIN merchants m ON p.merchant_id = m.merchant_id
LEFT JOIN bitcoin_addresses ba ON p.payment_id = ba.payment_id
WHERE p.status IN ('pending', 'deposit_detected', 'processing') 
AND p.expires_at > CURRENT_TIMESTAMP;

CREATE OR REPLACE VIEW bitcoin_payment_status AS
SELECT 
    p.payment_id,
    p.merchant_id,
    p.amount_in_sats,
    p.status,
    p.created_at,
    p.expires_at,
    ba.address as bitcoin_address,
    ba.network,
    ba.is_monitored,
    COALESCE(SUM(bt.value_satoshis), 0) as total_received_satoshis,
    COUNT(bt.id) as transaction_count,
    MAX(bt.confirmations) as max_confirmations,
    MAX(bt.detected_at) as last_deposit_at
FROM payments p
LEFT JOIN bitcoin_addresses ba ON p.payment_id = ba.payment_id
LEFT JOIN bitcoin_transactions bt ON p.payment_id = bt.payment_id AND bt.is_confirmed = true
WHERE ba.payment_id IS NOT NULL
GROUP BY p.payment_id, p.merchant_id, p.amount_in_sats, p.status, p.created_at, p.expires_at,
         ba.address, ba.network, ba.is_monitored;

-- Performance monitoring view
CREATE OR REPLACE VIEW payment_performance_stats AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_payments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
    AVG(EXTRACT(EPOCH FROM (COALESCE(confirmed_at, updated_at) - created_at))) as avg_processing_time_seconds,
    SUM(CASE WHEN status = 'completed' THEN amount_in_sats ELSE 0 END) as total_volume_sats
FROM payments
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Insert default production merchant (update with real values)
INSERT INTO merchants (merchant_id, business_name, email, api_key, is_active)
VALUES ('production-merchant', 'Production Merchant', 'admin@sbtcgateway.com', 'prod-api-key-change-me', true)
ON CONFLICT (merchant_id) DO UPDATE SET
    updated_at = CURRENT_TIMESTAMP,
    is_active = EXCLUDED.is_active;

-- Production security: Create database user and permissions
-- These commands should be run by a database administrator
-- DO NOT include actual passwords in this file

-- Example user creation (run manually with secure password):
-- CREATE USER sbtc_gateway_prod WITH PASSWORD 'secure_random_password_123!';
-- GRANT CONNECT ON DATABASE your_production_db TO sbtc_gateway_prod;
-- GRANT USAGE ON SCHEMA public TO sbtc_gateway_prod;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sbtc_gateway_prod;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sbtc_gateway_prod;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO sbtc_gateway_prod;

-- Production maintenance procedures
CREATE OR REPLACE FUNCTION cleanup_expired_payments()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Mark expired payments older than 7 days
    UPDATE payments 
    SET status = 'expired', updated_at = CURRENT_TIMESTAMP
    WHERE status IN ('pending', 'deposit_detected')
    AND expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO payment_events (payment_id, event_type, event_data)
    SELECT payment_id, 'system_cleanup', 
           jsonb_build_object('cleaned_at', CURRENT_TIMESTAMP, 'reason', 'expired_cleanup')
    FROM payments 
    WHERE status = 'expired' 
    AND updated_at = CURRENT_TIMESTAMP;
    
    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup schedule (requires pg_cron extension - install separately)
-- SELECT cron.schedule('cleanup-expired-payments', '0 2 * * *', 'SELECT cleanup_expired_payments();');

ANALYZE; -- Update table statistics for optimal query performance