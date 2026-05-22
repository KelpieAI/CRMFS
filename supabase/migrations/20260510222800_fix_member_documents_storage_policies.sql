/*
  # Fix member-documents storage RLS policies

  ## Problem
  The `member-documents` bucket was missing an UPDATE policy, which means
  `upsert: true` uploads would fail for authenticated users trying to replace
  an existing file. The bucket already had INSERT and DELETE policies but not UPDATE.

  ## Changes
  - Add UPDATE policy so authenticated users can replace (upsert) existing files
    in the member-documents bucket.

  ## Notes
  - The bucket already exists and is public
  - INSERT ("Authenticated users can upload") and DELETE ("Authenticated users can delete")
    policies already exist and are not changed
  - SELECT ("Public Access") policy already exists and is not changed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can update'
  ) THEN
    CREATE POLICY "Authenticated users can update"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'member-documents')
      WITH CHECK (bucket_id = 'member-documents');
  END IF;
END $$;
