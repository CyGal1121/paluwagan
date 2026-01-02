-- ============================================
-- MIGRATION: Fix Groups RLS Policy v2
-- ============================================
-- More robust INSERT policy that handles all edge cases

-- Drop existing insert policies
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

-- Recreate with simpler, more robust conditions
-- The INSERT should succeed if:
-- 1. The user is authenticated
-- 2. The organizer_user_id in the new row matches the authenticated user
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND organizer_user_id = auth.uid()
  );

-- Note: Category validation is now handled at the application level
-- This avoids RLS complexity with optional foreign keys

-- Ensure organizers can always view their own groups
DROP POLICY IF EXISTS "Members and organizers can view groups" ON public.groups;

CREATE POLICY "Members and organizers can view groups"
  ON public.groups FOR SELECT
  USING (
    -- User is a member of the group
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = id
      AND gm.user_id = auth.uid()
      AND gm.status IN ('active', 'pending', 'frozen')
    )
    OR
    -- User is the organizer (for viewing during/after creation)
    organizer_user_id = auth.uid()
  );

-- Ensure organizers can update their groups
DROP POLICY IF EXISTS "Organizers can update their groups" ON public.groups;

CREATE POLICY "Organizers can update their groups"
  ON public.groups FOR UPDATE
  USING (organizer_user_id = auth.uid())
  WITH CHECK (organizer_user_id = auth.uid());
