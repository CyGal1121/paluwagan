-- ============================================
-- MIGRATION: Add Email and SMS Invites Support
-- ============================================
-- Track email and SMS invitations sent to potential members

-- Add tracking columns to invites table
ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS invite_method TEXT DEFAULT 'link' CHECK (invite_method IN ('link', 'email', 'sms')),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'accepted', 'expired', 'cancelled')),
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Indexes for lookups
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_phone ON public.invites(phone);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);
CREATE INDEX IF NOT EXISTS idx_invites_method ON public.invites(invite_method);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN public.invites.email IS 'Email address the invite was sent to (null for link-only or SMS invites)';
COMMENT ON COLUMN public.invites.phone IS 'Phone number the invite was sent to (null for link-only or email invites)';
COMMENT ON COLUMN public.invites.invite_method IS 'How the invite was sent: link (shareable), email, or sms';
COMMENT ON COLUMN public.invites.status IS 'Status of the invite: pending (created), sent (delivered), accepted (joined), expired, cancelled';
COMMENT ON COLUMN public.invites.sent_at IS 'Timestamp when the invite was sent';
COMMENT ON COLUMN public.invites.accepted_at IS 'Timestamp when the invite was accepted';
