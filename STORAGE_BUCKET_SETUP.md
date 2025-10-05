# Supabase Storage Bucket Setup

## Error Fix: "Bucket not found"

The logo upload feature requires a Supabase Storage bucket. Follow these steps:

---

## Quick Fix: Create Bucket Manually

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Click **"Storage"** in the left sidebar

### Step 2: Create New Bucket
1. Click **"New Bucket"** button
2. Fill in the details:

```
Bucket Name: public
Public bucket: ✅ YES (checked)
File size limit: 2 MB
Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp
```

3. Click **"Create bucket"**

### Step 3: Set Bucket Policies (Optional)

If you want more control, add these policies:

**Policy 1: Allow authenticated users to upload**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');
```

**Policy 2: Allow public read access**
```sql
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public');
```

**Policy 3: Allow users to update their org logo**
```sql
CREATE POLICY "Allow org logo updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public' AND (storage.foldername(name))[1] = 'organization-logos');
```

---

## Alternative: Use Different Bucket Name

If you prefer a different bucket name (e.g., `avatars`, `uploads`), update the backend code:

### In `backend/routes/organizationRoutes.js`:

**Find** (line 186):
```javascript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('public')  // ← Change this
  .upload(filePath, logoFile.data, {
```

**Replace with:**
```javascript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('avatars')  // ← Your bucket name
  .upload(filePath, logoFile.data, {
```

**And** (line 196):
```javascript
const { data: publicUrlData } = supabase.storage
  .from('public')  // ← Change this too
  .getPublicUrl(filePath);
```

---

## Verify Setup

After creating the bucket, test the upload:

1. Restart backend: `cd backend && npm start`
2. Go to Account Settings → Organization tab
3. Click "Upload Logo"
4. Select an image (JPG/PNG/WEBP, under 2MB)
5. Should see: "Logo uploaded successfully" ✅

---

## Troubleshooting

### Error: "Bucket not found"
**Solution:** Create the `public` bucket in Supabase Dashboard → Storage

### Error: "Not allowed to upload"
**Solution:** Check bucket is marked as "Public" or add storage policies

### Error: "File too large"
**Solution:** Ensure file is under 2MB

### Error: "Invalid file type"
**Solution:** Only JPG, PNG, WEBP are allowed

---

## Storage Structure

After upload, files will be organized as:
```
public/
└── organization-logos/
    ├── <org-id-1>-<timestamp>.jpg
    ├── <org-id-2>-<timestamp>.png
    └── ...
```

Each organization's logo is uniquely named with:
- Organization ID
- Timestamp (to prevent caching issues)
- Original file extension

---

## Clean Up Old Logos (Optional)

If you want to delete old logos when uploading new ones, add this to the upload endpoint:

```javascript
// Before uploading new logo, delete old ones
const { data: oldFiles } = await supabase.storage
  .from('public')
  .list('organization-logos', {
    search: req.organizationId
  });

if (oldFiles && oldFiles.length > 0) {
  const filesToDelete = oldFiles.map(file => `organization-logos/${file.name}`);
  await supabase.storage
    .from('public')
    .remove(filesToDelete);
}
```

---

**Status:** ⚠️ Bucket needs to be created manually in Supabase Dashboard
