-- ============================================
-- DEBUG: Kiểm tra vấn đề không up được sách
-- ============================================

-- 1️⃣ KIỂM TRA RLS STATUS
-- Tác dụng: Xem table books có enable RLS không
-- Kết quả:
--   rowsecurity = true → RLS ĐANG BẬT (có thể chặn INSERT)
--   rowsecurity = false → RLS TẮT (không chặn)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'books';


-- 2️⃣ KIỂM TRA TẤT CẢ POLICIES TRÊN BOOKS TABLE
-- Tác dụng: Xem tất cả RLS policies đang hoạt động
-- Kết quả: Nếu có policy với cmd='INSERT', nó có thể chặn upload
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'books'
ORDER BY cmd, policyname;


-- 3️⃣ ĐẾM TỔNG SỐ SÁCH TRONG DB
-- Tác dụng: Xem có bao nhiêu sách tất cả
-- Kết quả: Số integer - nếu 1 thì chỉ có seed data
SELECT COUNT(*) as total_books FROM public.books;


-- 4️⃣ KIỂM TRA CÓ TRIGGER NÀO KHÔNG
-- Tác dụng: Xem có trigger nào trên books table (có thể prevent insert)
-- Kết quả: List của các trigger (nếu có)
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'books' AND trigger_schema = 'public';


-- 5️⃣ KIỂM TRA SCHEMA CỦA BOOKS TABLE
-- Tác dụng: Xem cấu trúc của books table, có constraint gì không
-- Kết quả: Tất cả columns và properties của chúng
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'books'
ORDER BY ordinal_position;


-- 6️⃣ KIỂM TRA CÓ CONSTRAINT NÀO KHÔNG
-- Tác dụng: Xem constraints (có thể prevent insert)
-- Kết quả: List of constraints
SELECT 
  constraint_name,
  constraint_type,
  table_name
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'books';


-- 7️⃣ KIỂM TRA FOREIGN KEY CONSTRAINTS
-- Tác dụng: Xem books có depend trên table khác không
-- Kết quả: Nếu có foreign key tới profiles mà user_id invalid, insert fail
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table_name,
  ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public' 
  AND tc.table_name = 'books';


-- 8️⃣ KIỂM TRA TỔNG SỐ SÁCH CỦA MỖI USER
-- Tác dụng: Xem distribution của sách - ai có bao nhiêu
-- Kết quả: user_id → số sách của user đó
SELECT 
  user_id,
  COUNT(*) as book_count
FROM public.books
GROUP BY user_id
ORDER BY book_count DESC;


-- 9️⃣ KIỂM TRA STORAGE BUCKET
-- Tác dụng: Xem file có được upload lên storage không
-- Kết quả: Xem có file nào trong book-files bucket
SELECT * FROM storage.objects 
WHERE bucket_id = 'book-files'
ORDER BY created_at DESC
LIMIT 20;


-- 🔟 DISABLE RLS CẮT NHANH (nếu RLS là vấn đề)
-- ⚠️ CHỈ CHẠY NẾU CONFIRM RLS LÀ NGUYÊN NHÂN
-- Tác dụng: Tắt RLS trên books table
-- Cảnh báo: Điều này để tất cả users có thể INSERT/UPDATE/DELETE
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;


-- 1️⃣1️⃣ DROP TẤT CẢ POLICIES TRÊN BOOKS (nếu cần)
-- ⚠️ DÙNG NẾU MUỐN REMOVE TẤT CẢ POLICIES
-- DROP POLICY IF EXISTS "policy_name" ON public.books;
-- (Chạy từng policy name một)
