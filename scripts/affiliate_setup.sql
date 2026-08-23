-- Run this script in the Supabase SQL Editor

-- 1. Create affiliate_codes table
CREATE TABLE public.affiliate_codes (
    code TEXT PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    discount_pct INTEGER NOT NULL DEFAULT 10,
    commission_pct INTEGER NOT NULL DEFAULT 10,
    total_uses INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on Row Level Security
ALTER TABLE public.affiliate_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read codes (so the frontend can validate them)
CREATE POLICY "Public codes are viewable by everyone."
ON public.affiliate_codes FOR SELECT
USING (true);

-- 2. Modify profiles table
ALTER TABLE public.profiles
ADD COLUMN referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN used_first_discount BOOLEAN NOT NULL DEFAULT false;

-- Create index for faster lookups on who referred who
CREATE INDEX idx_profiles_referred_by ON public.profiles(referred_by);

-- Create index for codes
CREATE INDEX idx_affiliate_codes_owner ON public.affiliate_codes(owner_id);
