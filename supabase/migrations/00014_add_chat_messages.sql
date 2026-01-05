-- Chat Messages Table for Group Chat
-- Each group/branch has its own chat room

-- ============================================
-- CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  reply_to_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  is_system_message BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_chat_messages_group ON public.chat_messages(group_id);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(group_id, created_at DESC);
CREATE INDEX idx_chat_messages_reply ON public.chat_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Updated at trigger
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CHAT READ RECEIPTS TABLE
-- Tracks last read message per user per group
-- ============================================
CREATE TABLE public.chat_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_chat_read_receipts_group ON public.chat_read_receipts(group_id);
CREATE INDEX idx_chat_read_receipts_user ON public.chat_read_receipts(user_id);

-- ============================================
-- RLS POLICIES FOR CHAT
-- ============================================

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- Chat Messages Policies
-- Members can view messages in groups they belong to
CREATE POLICY "Members can view group messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = chat_messages.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'active'
    )
  );

-- Members can send messages to groups they belong to
CREATE POLICY "Members can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = chat_messages.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'active'
    )
  );

-- Users can only update their own messages (for editing)
CREATE POLICY "Users can update own messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages, organizers can delete any
CREATE POLICY "Users can delete own messages or organizers can delete any"
  ON public.chat_messages FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = chat_messages.group_id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'organizer'
      AND group_members.status = 'active'
    )
  );

-- Chat Read Receipts Policies
-- Users can view their own read receipts
CREATE POLICY "Users can view own read receipts"
  ON public.chat_read_receipts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own read receipts
CREATE POLICY "Users can manage own read receipts"
  ON public.chat_read_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read receipts"
  ON public.chat_read_receipts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime for chat messages
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
