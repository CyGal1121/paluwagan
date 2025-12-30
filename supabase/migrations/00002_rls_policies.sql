-- Pinoy Paluwagan RLS Policies
-- Row Level Security to enforce authorization on all tables

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Check if user is a group member
-- ============================================
CREATE OR REPLACE FUNCTION is_group_member(group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = $1
    AND group_members.user_id = auth.uid()
    AND group_members.status IN ('active', 'pending')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user is group organizer
-- ============================================
CREATE OR REPLACE FUNCTION is_group_organizer(group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = $1
    AND group_members.user_id = auth.uid()
    AND group_members.role = 'organizer'
    AND group_members.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can read profiles of people in their groups
CREATE POLICY "Users can view group members profiles"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = users.id
      AND gm1.status IN ('active', 'pending')
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- GROUPS POLICIES
-- ============================================

-- Only members can view groups
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  USING (is_group_member(id));

-- Any authenticated user can create a group
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = organizer_user_id);

-- Only organizer can update group
CREATE POLICY "Organizer can update group"
  ON public.groups FOR UPDATE
  USING (is_group_organizer(id))
  WITH CHECK (is_group_organizer(id));

-- ============================================
-- GROUP MEMBERS POLICIES
-- ============================================

-- Members can view other members in their groups
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (is_group_member(group_id));

-- Users can join groups (insert themselves as pending)
CREATE POLICY "Users can request to join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Organizer can update member status
CREATE POLICY "Organizer can update members"
  ON public.group_members FOR UPDATE
  USING (is_group_organizer(group_id))
  WITH CHECK (is_group_organizer(group_id));

-- Organizer can remove members
CREATE POLICY "Organizer can remove members"
  ON public.group_members FOR DELETE
  USING (is_group_organizer(group_id));

-- ============================================
-- INVITES POLICIES
-- ============================================

-- Anyone can view valid invite by token (for preview)
CREATE POLICY "Anyone can view invite by token"
  ON public.invites FOR SELECT
  USING (expires_at > NOW());

-- Organizer can create invites
CREATE POLICY "Organizer can create invites"
  ON public.invites FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND is_group_organizer(group_id)
  );

-- Organizer can update invites (increment use count)
CREATE POLICY "Organizer can update invites"
  ON public.invites FOR UPDATE
  USING (is_group_organizer(group_id));

-- System can update invite use count (for joining)
CREATE POLICY "Users can increment invite use count"
  ON public.invites FOR UPDATE
  USING (expires_at > NOW() AND (max_uses IS NULL OR use_count < max_uses));

-- ============================================
-- CYCLES POLICIES
-- ============================================

-- Members can view cycles
CREATE POLICY "Members can view cycles"
  ON public.cycles FOR SELECT
  USING (is_group_member(group_id));

-- Organizer can create cycles
CREATE POLICY "Organizer can create cycles"
  ON public.cycles FOR INSERT
  WITH CHECK (is_group_organizer(group_id));

-- Organizer can update cycles
CREATE POLICY "Organizer can update cycles"
  ON public.cycles FOR UPDATE
  USING (is_group_organizer(group_id))
  WITH CHECK (is_group_organizer(group_id));

-- ============================================
-- CONTRIBUTIONS POLICIES
-- ============================================

-- Members can view contributions in their groups
CREATE POLICY "Members can view contributions"
  ON public.contributions FOR SELECT
  USING (is_group_member(group_id));

-- Members can create their own contributions
CREATE POLICY "Members can create own contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND is_group_member(group_id)
  );

-- Members can update their own contributions (submit proof)
CREATE POLICY "Members can update own contributions"
  ON public.contributions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Organizer can update any contribution (confirm/dispute)
CREATE POLICY "Organizer can update contributions"
  ON public.contributions FOR UPDATE
  USING (is_group_organizer(group_id))
  WITH CHECK (is_group_organizer(group_id));

-- ============================================
-- PAYOUTS POLICIES
-- ============================================

-- Members can view payouts
CREATE POLICY "Members can view payouts"
  ON public.payouts FOR SELECT
  USING (is_group_member(group_id));

-- Organizer can create payouts
CREATE POLICY "Organizer can create payouts"
  ON public.payouts FOR INSERT
  WITH CHECK (is_group_organizer(group_id));

-- Organizer can update payouts (mark sent)
CREATE POLICY "Organizer can update payouts"
  ON public.payouts FOR UPDATE
  USING (is_group_organizer(group_id))
  WITH CHECK (is_group_organizer(group_id));

-- Recipient can update payout (confirm received)
CREATE POLICY "Recipient can confirm payout"
  ON public.payouts FOR UPDATE
  USING (auth.uid() = recipient_user_id)
  WITH CHECK (auth.uid() = recipient_user_id);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Members can view audit logs
CREATE POLICY "Members can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (is_group_member(group_id));

-- Members can create audit logs
CREATE POLICY "Members can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (
    auth.uid() = actor_user_id
    AND is_group_member(group_id)
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark read)
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can create notifications for any user
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (TRUE);
