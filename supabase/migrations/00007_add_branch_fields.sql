-- ============================================
-- MIGRATION: Add Branch Fields (Category Reference)
-- ============================================
-- Link groups (branches) to categories
-- Each branch belongs to a category (Cash, Food, Gold, etc.)

-- Add category reference to groups table
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Index for category lookup
CREATE INDEX IF NOT EXISTS idx_groups_category ON public.groups(category_id);
CREATE INDEX IF NOT EXISTS idx_groups_display_order ON public.groups(display_order);

-- ============================================
-- DATA MIGRATION: Assign existing groups to 'Cash' category
-- ============================================
-- All existing groups without a category will be assigned to 'Cash'
UPDATE public.groups
SET category_id = (SELECT id FROM public.categories WHERE slug = 'cash' LIMIT 1)
WHERE category_id IS NULL;

-- ============================================
-- CONSTRAINT: Fixed 10 slots per branch
-- ============================================
-- Note: We enforce 10 slots in application code rather than database constraint
-- This allows flexibility for existing groups and future adjustments
-- The default is already set to 10 in most cases

-- Update any groups with members_limit != 10 to 10
-- Comment out if you want to keep existing limits
-- UPDATE public.groups SET members_limit = 10 WHERE members_limit != 10;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN public.groups.category_id IS 'Category this branch belongs to (Cash, Food, Gold, etc.)';
COMMENT ON COLUMN public.groups.display_order IS 'Order for displaying branches within a category';

-- ============================================
-- VIEW: Branches with category info
-- ============================================
CREATE OR REPLACE VIEW public.branches_with_categories AS
SELECT
  g.*,
  c.name AS category_name,
  c.slug AS category_slug,
  c.icon AS category_icon
FROM public.groups g
LEFT JOIN public.categories c ON g.category_id = c.id;

-- Grant access to the view
GRANT SELECT ON public.branches_with_categories TO authenticated;
