-- =============================================
-- Storage RLS Policies for Organization Isolation
-- Ensures each organization can only access their own files
-- =============================================

-- Note: The 'crmimage' bucket should already exist
-- This migration only adds RLS policies for organization-based folders
-- RLS is already enabled by default on storage.objects in Supabase

-- 1. Drop existing policies if they exist (for clean slate)
DROP POLICY IF EXISTS "Users can upload to their org folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their org files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their org files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their org files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for crmimage" ON storage.objects;

-- 2. Policy: Allow authenticated users to upload files to their organization folder
-- Path format: {organizationId}/contact-avatars/{file}
--              {organizationId}/company-logos/{file}
--              {organizationId}/company-documents/{file}
--              {organizationId}/organization-logo.ext
CREATE POLICY "Users can upload to their org folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'crmimage' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'organizationId')::text
);

-- 3. Policy: Allow authenticated users to read files from their organization folder
CREATE POLICY "Users can read their org files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'crmimage' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'organizationId')::text
);

-- 4. Policy: Allow authenticated users to update files in their organization folder
CREATE POLICY "Users can update their org files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'crmimage' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'organizationId')::text
)
WITH CHECK (
  bucket_id = 'crmimage' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'organizationId')::text
);

-- 5. Policy: Allow authenticated users to delete files from their organization folder
CREATE POLICY "Users can delete their org files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'crmimage' AND
  (storage.foldername(name))[1] = (auth.jwt()->>'organizationId')::text
);

-- 6. Policy: Allow public read access for the crmimage bucket
-- This allows public URLs to work for avatars/logos displayed on frontend
CREATE POLICY "Public read access for crmimage"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'crmimage'
);

-- 7. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crmimage',
  'crmimage',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- 8. Add helpful comments
COMMENT ON POLICY "Users can upload to their org folder" ON storage.objects IS
'Allows authenticated users to upload files only to folders matching their organizationId from JWT';

COMMENT ON POLICY "Public read access for crmimage" ON storage.objects IS
'Allows public read access for displaying avatars, logos, and documents via public URLs';
