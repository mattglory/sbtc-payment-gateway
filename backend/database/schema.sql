-- sBTC Payment Gateway Database Schema
-- Production-ready PostgreSQL schema for payments and merchants

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create merchants table
CREATE TABLE merchants (
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(255) UNIQUE NOT NULL,
    merchant_id VARCHAR(255) NOT NULL REFERENCES merchants(merchant_id) ON DELETE RESTRICT,
    amount_in_sats BIGINT NOT NULL CHECK (amount_in_sats > 0),
    fee_amount BIGINT DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'SATS',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired', 'cancelled')),
    description TEXT,
    customer_address VARCHAR(255),
    stacks_tx_id VARCHAR(255),
    blockchain_status VARCHAR(50) DEFAULT 'none',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Create payment_events table for audit trail
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id VARCHAR(255) NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_merchants_merchant_id ON merchants(merchant_id);
CREATE INDEX idx_merchants_api_key ON merchants(api_key);
CREATE INDEX idx_merchants_is_active ON merchants(is_active);

CREATE INDEX idx_payments_payment_id ON payments(payment_id);
CREATE INDEX idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_expires_at ON payments(expires_at);
CREATE INDEX idx_payments_stacks_tx_id ON payments(stacks_tx_id);

CREATE INDEX idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX idx_payment_events_created_at ON payment_events(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW active_merchants AS
SELECT * FROM merchants WHERE is_active = true;

CREATE VIEW pending_payments AS
SELECT p.*, m.business_name, m.email as merchant_email
FROM payments p
JOIN merchants m ON p.merchant_id = m.merchant_id
WHERE p.status = 'pending' AND p.expires_at > CURRENT_TIMESTAMP;

CREATE VIEW payment_stats AS
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

-- Insert default admin merchant for testing
INSERT INTO merchants (merchant_id, business_name, email, api_key, is_active)
VALUES ('default-merchant', 'Default Merchant', 'admin@sbtcgateway.com', 'dev-api-key-12345', true)
ON CONFLICT (merchant_id) DO NOTHING;

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sbtc_gateway_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sbtc_gateway_user;