-- Pinoy Paluwagan MVP Schema
-- This migration creates all core tables for the paluwagan app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (profile data, linked to auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  name TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_phone ON public.users(phone);

-- ============================================
-- GROUPS TABLE
-- ============================================
CREATE TYPE group_frequency AS ENUM ('weekly', 'biweekly', 'monthly');
CREATE TYPE payout_order_method AS ENUM ('fixed', 'lottery', 'organizer_assigned');
CREATE TYPE group_status AS ENUM ('forming', 'active', 'completed', 'cancelled');

CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  contribution_amount NUMERIC(12, 2) NOT NULL CHECK (contribution_amount > 0),
  frequency group_frequency NOT NULL,
  start_date DATE NOT NULL,
  members_limit INTEGER NOT NULL CHECK (members_limit >= 2 AND members_limit <= 50),
  payout_order_method payout_order_method NOT NULL DEFAULT 'organizer_assigned',
  rules_json JSONB DEFAULT '{}',
  status group_status NOT NULL DEFAULT 'forming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_organizer ON public.groups(organizer_user_id);
CREATE INDEX idx_groups_status ON public.groups(status);

-- ============================================
-- GROUP MEMBERS TABLE
-- ============================================
CREATE TYPE member_role AS ENUM ('organizer', 'member');
CREATE TYPE member_status AS ENUM ('pending', 'active', 'frozen', 'removed');

CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  status member_status NOT NULL DEFAULT 'pending',
  payout_position INTEGER,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_status ON public.group_members(status);

-- ============================================
-- INVITES TABLE
-- ============================================
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_group ON public.invites(group_id);

-- ============================================
-- CYCLES TABLE
-- ============================================
CREATE TYPE cycle_status AS ENUM ('upcoming', 'open', 'closing', 'closed');

CREATE TABLE public.cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL CHECK (cycle_number > 0),
  start_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payout_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status cycle_status NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, cycle_number)
);

CREATE INDEX idx_cycles_group ON public.cycles(group_id);
CREATE INDEX idx_cycles_status ON public.cycles(status);
CREATE INDEX idx_cycles_due_date ON public.cycles(due_date);

-- ============================================
-- CONTRIBUTIONS TABLE
-- ============================================
CREATE TYPE contribution_status AS ENUM ('unpaid', 'pending_proof', 'paid_confirmed', 'disputed');

CREATE TABLE public.contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  status contribution_status NOT NULL DEFAULT 'unpaid',
  proof_url TEXT,
  note TEXT,
  confirmed_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_late BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cycle_id, user_id)
);

CREATE INDEX idx_contributions_cycle ON public.contributions(cycle_id);
CREATE INDEX idx_contributions_user ON public.contributions(user_id);
CREATE INDEX idx_contributions_status ON public.contributions(status);
CREATE INDEX idx_contributions_group ON public.contributions(group_id);

-- ============================================
-- PAYOUTS TABLE
-- ============================================
CREATE TYPE payout_status AS ENUM ('scheduled', 'sent_by_organizer', 'confirmed_by_recipient', 'disputed');

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID NOT NULL REFERENCES public.cycles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  status payout_status NOT NULL DEFAULT 'scheduled',
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cycle_id)
);

CREATE INDEX idx_payouts_cycle ON public.payouts(cycle_id);
CREATE INDEX idx_payouts_recipient ON public.payouts(recipient_user_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_group ON public.payouts(group_id);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TYPE entity_type AS ENUM ('contribution', 'payout', 'member', 'group', 'cycle', 'invite');

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_group ON public.audit_logs(group_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data_json JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cycles_updated_at BEFORE UPDATE ON public.cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Create user profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
