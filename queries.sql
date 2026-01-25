-- Xem tất cả sách và chủ sở hữu của nó
SELECT 
  b.id,
  b.title,
  b.author,
  b.format,
  b.status,
  b.created_at,
  p.id AS user_id,
  p.display_name AS owner_name,
  p.email AS owner_email
FROM public.books b
LEFT JOIN public.profiles p ON b.user_id = p.id
ORDER BY b.created_at DESC;

-- ===== Hoặc nếu muốn xem chi tiết hơn =====

-- Xem số lượng sách theo user
SELECT 
  p.id,
  p.display_name,
  p.email,
  COUNT(b.id) AS total_books,
  COUNT(CASE WHEN b.status = 'reading' THEN 1 END) AS reading_count,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) AS completed_count,
  COUNT(CASE WHEN b.status = 'to_read' THEN 1 END) AS to_read_count
FROM public.profiles p
LEFT JOIN public.books b ON p.id = b.user_id
GROUP BY p.id, p.display_name, p.email
ORDER BY total_books DESC;

-- ===== Kiểm tra sách và file path =====

-- Xem tất cả sách với file path
SELECT 
  b.id,
  b.title,
  b.author,
  b.file_url,
  b.status,
  p.display_name AS owner,
  b.created_at
FROM public.books b
LEFT JOIN public.profiles p ON b.user_id = p.id
ORDER BY b.created_at DESC;

-- ===== Kiểm tra RLS status =====

SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'books';
