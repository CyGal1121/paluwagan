-- ============================================
-- MIGRATION: Add Branch Fees Table
-- ============================================
-- Track setup fee (99 PHP one-time) and monthly fee (100 PHP) per branch
-- Fees are tracked only, not collected through the app

-- Fee type enum
DO $$ BEGIN
  CREATE TYPE fee_type AS ENUM ('setup', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Fee status enum
DO $$ BEGIN
  CREATE TYPE fee_status AS ENUM ('unpaid', 'paid', 'waived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Branch fees table
CREATE TABLE public.branch_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  fee_type fee_type NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  due_date DATE, -- null for setup fee, set for monthly fees
  period_start DATE, -- for monthly fees: the month this covers
  period_end DATE,
  status fee_status NOT NULL DEFAULT 'unpaid',
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Prevent duplicate fees for same period
  UNIQUE(branch_id, fee_type, period_start)
);

-- Indexes
CREATE INDEX idx_branch_fees_branch ON public.branch_fees(branch_id);
CREATE INDEX idx_branch_fees_status ON public.branch_fees(status);
CREATE INDEX idx_branch_fees_due_date ON public.branch_fees(due_date);
CREATE INDEX idx_branch_fees_type ON public.branch_fees(fee_type);

-- Updated at trigger
CREATE TRIGGER update_branch_fees_updated_at BEFORE UPDATE ON public.branch_fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTION
-- ============================================
-- Check if user is branch organizer
CREATE OR REPLACE FUNCTION is_branch_organizer(p_branch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = p_branch_id
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'organizer'
    AND group_members.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.branch_fees ENABLE ROW LEVEL SECURITY;

-- Organizers can view their branch fees
CREATE POLICY "Organizers can view branch fees"
  ON public.branch_fees FOR SELECT
  USING (is_branch_organizer(branch_id));

-- Organizers can create fees for their branches
CREATE POLICY "Organizers can create branch fees"
  ON public.branch_fees FOR INSERT
  WITH CHECK (is_branch_organizer(branch_id));

-- Organizers can update their branch fees (mark as paid)
CREATE POLICY "Organizers can update branch fees"
  ON public.branch_fees FOR UPDATE
  USING (is_branch_organizer(branch_id))
  WITH CHECK (is_branch_organizer(branch_id));

-- Organizers can delete fees (if needed)
CREATE POLICY "Organizers can delete branch fees"
  ON public.branch_fees FOR DELETE
  USING (is_branch_organizer(branch_id));

-- ============================================
-- CONSTANTS (for reference in app code)
-- ============================================
-- Setup fee: 99 PHP (one-time)
-- Monthly fee: 100 PHP (per branch, per month)
COMMENT ON TABLE public.branch_fees IS 'Setup fee: 99 PHP, Monthly fee: 100 PHP per branch';
