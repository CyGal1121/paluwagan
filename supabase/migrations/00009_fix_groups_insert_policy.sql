-- ============================================
-- MIGRATION: Fix Groups INSERT RLS Policy
-- ============================================
-- The groups INSERT is failing with RLS violation.
-- This fixes the policy to be more explicit.

-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;

-- Recreate with explicit conditions
-- The INSERT should succeed if:
-- 1. The user is authenticated (auth.uid() is not null)
-- 2. The organizer_user_id matches the current user
-- 3. The category_id is either NULL or references an active category
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = organizer_user_id
    AND (
      category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.categories c
        WHERE c.id = category_id
        AND c.is_active = TRUE
      )
    )
  );

-- Also ensure the groups SELECT policy allows organizers to see their own groups
-- even before they've added themselves as members
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;

CREATE POLICY "Members and organizers can view groups"
  ON public.groups FOR SELECT
  USING (
    -- User is a member of the group
    is_group_member(id)
    OR
    -- User is the organizer (for viewing during creation)
    organizer_user_id = auth.uid()
  );
