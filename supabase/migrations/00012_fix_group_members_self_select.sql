-- Fix group_members RLS policy to allow users to see their own memberships
-- The current policy is_group_member(group_id) creates circular dependency
-- when a user tries to list their own memberships

-- Add policy to allow users to view their own membership records
CREATE POLICY "Users can view own memberships"
  ON public.group_members FOR SELECT
  USING (auth.uid() = user_id);
