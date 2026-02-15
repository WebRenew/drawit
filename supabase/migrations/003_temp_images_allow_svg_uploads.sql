-- Allow sanitized SVG uploads in temp image storage bucket.
-- This migration updates existing environments where 002 has already run.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml'
]
WHERE id = 'temp-images';
