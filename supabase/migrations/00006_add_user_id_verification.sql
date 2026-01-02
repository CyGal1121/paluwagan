-- ============================================
-- MIGRATION: Add User ID Verification Fields
-- ============================================
-- Both photo and ID are required before creating/joining branches
-- Gradual enforcement: users can access app but blocked from branch operations

-- ID verification status enum
DO $$ BEGIN
  CREATE TYPE id_verification_status AS ENUM ('none', 'pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add verification fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS id_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS id_verification_status id_verification_status DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS id_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS id_verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS id_rejection_reason TEXT;

-- Index for filtering by verification status
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON public.users(id_verification_status);

-- ============================================
-- HELPER FUNCTION
-- ============================================
-- Check if user is verified (has both photo and verified ID)
CREATE OR REPLACE FUNCTION is_user_verified(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT photo_url, id_photo_url, id_verification_status
  INTO v_user
  FROM public.users
  WHERE id = p_user_id;

  -- User must have:
  -- 1. Profile photo (photo_url is not null)
  -- 2. ID photo uploaded (id_photo_url is not null)
  -- 3. ID verified (id_verification_status = 'verified')
  RETURN (
    v_user.photo_url IS NOT NULL
    AND v_user.id_photo_url IS NOT NULL
    AND v_user.id_verification_status = 'verified'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has submitted for verification (photo + ID uploaded, pending or verified)
CREATE OR REPLACE FUNCTION has_user_submitted_verification(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT photo_url, id_photo_url, id_verification_status
  INTO v_user
  FROM public.users
  WHERE id = p_user_id;

  RETURN (
    v_user.photo_url IS NOT NULL
    AND v_user.id_photo_url IS NOT NULL
    AND v_user.id_verification_status IN ('pending', 'verified')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE AUDIT LOG ENTITY TYPE
-- ============================================
-- Add 'verification' to entity_type if not exists
DO $$ BEGIN
  ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'verification';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- RLS POLICY UPDATES
-- ============================================
-- Users can update their own verification fields
-- Note: The existing "Users can update own profile" policy should cover this
-- But we'll add explicit columns to be clear

COMMENT ON COLUMN public.users.id_photo_url IS 'URL to user''s ID photo (government ID, etc.)';
COMMENT ON COLUMN public.users.id_verification_status IS 'none=not submitted, pending=awaiting review, verified=approved, rejected=denied';
COMMENT ON COLUMN public.users.id_verified_by IS 'User ID of organizer/admin who verified this user';
