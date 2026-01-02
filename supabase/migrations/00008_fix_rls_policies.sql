-- ============================================
-- MIGRATION: Fix RLS Policies for Group Creation
-- ============================================
-- The issue is that during group creation, the branch_fees and audit_logs
-- inserts fail because they require is_branch_organizer() or is_group_member()
-- which check the group_members table. But the member record is inserted
-- AFTER these checks in the same transaction.
--
-- Also, the audit_logs entity_type enum doesn't include 'verification'.
-- Fix all issues here.

-- ============================================
-- FIX 1: Update entity_type enum for audit_logs
-- ============================================
-- Add 'verification' to entity_type enum if not exists
DO $$ BEGIN
  ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'verification';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- FIX 2: Allow organizer to insert fees during group creation
-- ============================================
-- Drop the old policy
DROP POLICY IF EXISTS "Organizers can create branch fees" ON public.branch_fees;

-- Create a new policy that allows the authenticated user to create fees
-- if they are the organizer of the branch
CREATE POLICY "Organizers can create branch fees"
  ON public.branch_fees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = branch_id
      AND g.organizer_user_id = auth.uid()
    )
  );

-- ============================================
-- FIX 3: Allow audit log creation during group creation
-- ============================================
-- Drop the old audit_logs insert policy
DROP POLICY IF EXISTS "Members can create audit logs" ON public.audit_logs;

-- Create a more permissive policy that allows:
-- 1. Group members to create audit logs for their groups
-- 2. Users to create audit logs for groups they organize (during creation)
CREATE POLICY "Members and organizers can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() = actor_user_id
    AND (
      -- User is a member of the group
      is_group_member(group_id)
      OR
      -- User is the organizer of the group (for initial creation)
      EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_id
        AND g.organizer_user_id = auth.uid()
      )
    )
  );

-- ============================================
-- FIX 4: Update groups INSERT policy to be clearer
-- ============================================
-- The current policy is fine, but let's make sure category_id is allowed
-- (it should be, since the policy only checks organizer_user_id)
-- This is just a sanity check - the policy should work as-is.

-- Verify that authenticated users can reference categories
-- by checking they have SELECT access to categories table
-- (already handled by the "Anyone can view active categories" policy)
