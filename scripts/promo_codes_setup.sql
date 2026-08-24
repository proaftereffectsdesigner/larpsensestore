-- Table for storing promo codes
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_pct INTEGER NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    min_spent NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure code is always uppercase for consistency
CREATE OR REPLACE FUNCTION uppercase_promo_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.code = UPPER(NEW.code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER promo_code_uppercase
BEFORE INSERT OR UPDATE ON promo_codes
FOR EACH ROW EXECUTE FUNCTION uppercase_promo_code();

-- Table for tracking usage by user to prevent multiple uses of the same code
CREATE TABLE promo_code_usages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, promo_code_id)
);

-- RLS policies
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usages ENABLE ROW LEVEL SECURITY;

-- Admins can do everything on promo_codes
CREATE POLICY "Admins can manage promo codes" ON promo_codes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Everyone can read active promo codes (useful for validation endpoint if done on client, but we will do it on server via service role anyway, but just in case)
CREATE POLICY "Anyone can read promo codes" ON promo_codes
    FOR SELECT
    USING (true);

-- Admins can view all usages
CREATE POLICY "Admins can view usages" ON promo_code_usages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );
