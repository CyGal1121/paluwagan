-- ============================================
-- MIGRATION: Add Categories Table
-- ============================================
-- Categories are top-level containers for branches (paluwagan types)
-- Predefined: Cash, Food, Gold, Appliances, Gadgets
-- Users can also create custom categories

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- lucide icon name: 'banknote', 'utensils', 'gem', 'tv', 'smartphone'
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_active ON public.categories(is_active);
CREATE INDEX idx_categories_sort ON public.categories(sort_order);

-- Seed predefined categories
INSERT INTO public.categories (name, slug, description, icon, is_custom, sort_order) VALUES
  ('Cash', 'cash', 'Traditional cash paluwagan', 'banknote', FALSE, 1),
  ('Food', 'food', 'Food items and groceries paluwagan', 'utensils', FALSE, 2),
  ('Gold', 'gold', 'Gold and jewelry paluwagan', 'gem', FALSE, 3),
  ('Appliances', 'appliances', 'Home appliances paluwagan', 'tv', FALSE, 4),
  ('Gadgets', 'gadgets', 'Electronics and gadgets paluwagan', 'smartphone', FALSE, 5);

-- Updated at trigger
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = TRUE);

-- Authenticated users can create custom categories
CREATE POLICY "Authenticated users can create custom categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
    AND is_custom = TRUE
  );

-- Only creator can update their custom categories
CREATE POLICY "Creators can update their custom categories"
  ON public.categories FOR UPDATE
  USING (
    is_custom = TRUE
    AND created_by = auth.uid()
  )
  WITH CHECK (
    is_custom = TRUE
    AND created_by = auth.uid()
  );

-- Only creator can delete their custom categories (soft delete via is_active)
CREATE POLICY "Creators can soft delete their custom categories"
  ON public.categories FOR DELETE
  USING (
    is_custom = TRUE
    AND created_by = auth.uid()
  );
