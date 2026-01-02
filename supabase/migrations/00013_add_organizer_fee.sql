-- Add organizer fee configuration to groups
-- This determines how much the organizer takes from each payout

-- Fee type: 'percentage' (e.g., 5%) or 'fixed' (e.g., ₱500)
CREATE TYPE fee_type AS ENUM ('percentage', 'fixed');

-- Add fee columns to groups table
ALTER TABLE public.groups
ADD COLUMN fee_type fee_type DEFAULT 'percentage',
ADD COLUMN fee_value NUMERIC(10, 2) DEFAULT 5.00;

-- fee_type = 'percentage': fee_value is percentage (e.g., 5.00 means 5%)
-- fee_type = 'fixed': fee_value is fixed amount in PHP (e.g., 500.00 means ₱500)

-- Add constraints
-- For percentage: must be between 0 and 10 (max 10% fee)
-- For fixed: must be positive
ALTER TABLE public.groups
ADD CONSTRAINT check_fee_value CHECK (
  (fee_type = 'percentage' AND fee_value >= 0 AND fee_value <= 10) OR
  (fee_type = 'fixed' AND fee_value >= 0)
);

-- Add comment for documentation
COMMENT ON COLUMN public.groups.fee_type IS 'Type of organizer fee: percentage or fixed amount';
COMMENT ON COLUMN public.groups.fee_value IS 'Fee value: percentage (0-10) or fixed PHP amount';

-- Create helper function to calculate net payout
CREATE OR REPLACE FUNCTION calculate_net_payout(
  p_contribution_amount NUMERIC,
  p_members_count INTEGER,
  p_fee_type fee_type,
  p_fee_value NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  v_gross_payout NUMERIC;
  v_fee_amount NUMERIC;
BEGIN
  -- Gross payout = contribution × members
  v_gross_payout := p_contribution_amount * p_members_count;

  -- Calculate fee based on type
  IF p_fee_type = 'percentage' THEN
    v_fee_amount := v_gross_payout * (p_fee_value / 100);
  ELSE
    v_fee_amount := p_fee_value;
  END IF;

  -- Return net payout (gross - fee)
  RETURN v_gross_payout - v_fee_amount;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing groups to have 5% fee (common default)
UPDATE public.groups SET fee_type = 'percentage', fee_value = 5.00;
