-- Supabase Orders Table Schema
-- Run this in your Supabase SQL editor to create the orders table

CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer information
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    
    -- Shipping address (stored as JSONB for flexibility)
    shipping_address JSONB NOT NULL,
    
    -- Product details
    product_name VARCHAR(255) NOT NULL DEFAULT 'Go Offline - 256GB',
    base_price DECIMAL(10,2) NOT NULL DEFAULT 199.00,
    
    -- Shipping information
    shipping_method VARCHAR(50) NOT NULL DEFAULT 'standard',
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 7.00,
    
    -- Discount information
    discount_code VARCHAR(50),
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_type VARCHAR(20), -- 'percentage', 'fixed', or 'fixed_price'
    
    -- Payment information
    payment_method VARCHAR(50) NOT NULL DEFAULT 'stripe',
    stripe_session_id VARCHAR(255),
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Order status and tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    tracking_number VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for better security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading orders (you may want to restrict this further)
CREATE POLICY "Allow reading orders" ON orders
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Create policy to allow inserting orders
CREATE POLICY "Allow inserting orders" ON orders
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create policy to allow updating orders (you may want to restrict this)
CREATE POLICY "Allow updating orders" ON orders
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Optional: Create a view for order summaries
CREATE OR REPLACE VIEW order_summaries AS
SELECT 
    order_number,
    customer_email,
    customer_name,
    product_name,
    total_amount,
    status,
    shipping_method,
    discount_code,
    created_at,
    updated_at
FROM orders
ORDER BY created_at DESC; 