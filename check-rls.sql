-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'books';

-- Check all policies on books table
SELECT * FROM pg_policies WHERE tablename = 'books';

-- Check if there are any RLS policies blocking INSERT
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'books' AND cmd = 'INSERT';
