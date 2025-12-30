-- Pinoy Paluwagan Storage Policies
-- Storage bucket for proof images with RLS

-- Create storage bucket for proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proofs',
  'proofs',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES FOR PROOFS BUCKET
-- ============================================

-- Members can upload proofs to their group folders
CREATE POLICY "Members can upload proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'proofs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = (storage.foldername(name))[1]::UUID
      AND group_members.user_id = auth.uid()
      AND group_members.status = 'active'
    )
  );

-- Members can view proofs in their groups
CREATE POLICY "Members can view proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'proofs'
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_members.group_id = (storage.foldername(name))[1]::UUID
      AND group_members.user_id = auth.uid()
      AND group_members.status IN ('active', 'pending')
    )
  );

-- Users can update their own uploads
CREATE POLICY "Users can update own proofs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'proofs'
    AND auth.uid()::TEXT = (storage.foldername(name))[2]
  )
  WITH CHECK (
    bucket_id = 'proofs'
    AND auth.uid()::TEXT = (storage.foldername(name))[2]
  );

-- Users can delete their own uploads
CREATE POLICY "Users can delete own proofs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'proofs'
    AND auth.uid()::TEXT = (storage.foldername(name))[2]
  );
