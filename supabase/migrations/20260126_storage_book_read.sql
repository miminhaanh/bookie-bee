-- Allow authenticated users to read book files and covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'book_files_read_authenticated'
  ) THEN
    CREATE POLICY book_files_read_authenticated
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'book-files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'book_covers_read_authenticated'
  ) THEN
    CREATE POLICY book_covers_read_authenticated
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'book-covers');
  END IF;
END $$;
