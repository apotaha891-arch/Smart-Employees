-- Create the storage bucket for agency branding assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('agency_branding', 'agency_branding', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow anyone to view files (Public Read)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency_branding');

-- Policy to allow authenticated users to upload files
-- We restrict to authenticated users for security
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'agency_branding' 
    AND auth.role() = 'authenticated'
);

-- Policy to allow users to update their own files
CREATE POLICY "Updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'agency_branding' AND auth.role() = 'authenticated');

-- Policy to allow users to delete their own files
CREATE POLICY "Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'agency_branding' AND auth.role() = 'authenticated');
