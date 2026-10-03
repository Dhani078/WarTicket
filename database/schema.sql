CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    total_stock INT NOT NULL CHECK (total_stock >= 0),
    reserved_stock INT NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    sold_stock INT NOT NULL DEFAULT 0 CHECK (sold_stock >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_stock_integrity CHECK (reserved_stock + sold_stock <= total_stock)
);

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    tier_id UUID NOT NULL REFERENCES ticket_tiers(id),
    quantity INT NOT NULL CHECK (quantity > 0 AND quantity <= 2),
    total_amount DECIMAL(12, 2) NOT NULL,
    status order_status NOT NULL DEFAULT 'PENDING',
    reservation_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_idempotency (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id),
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_active ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_pending_expiry ON orders(status, expires_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_tiers_event_lookup ON ticket_tiers(event_id);
