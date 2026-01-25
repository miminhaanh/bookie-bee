-- Migration: Add reply support to comments table
-- Run this in Supabase SQL Editor

-- 1) Add parent_id column for nested replies
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2) Add index for faster parent lookups
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- 3) Add index for faster book_id lookups
CREATE INDEX IF NOT EXISTS idx_comments_book_id ON public.comments(book_id);

-- 4) Add likes count column for future feature
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- 5) Create a function to get nested comments for a book
CREATE OR REPLACE FUNCTION get_book_comments_tree(target_book_id uuid)
RETURNS TABLE (
  id uuid,
  book_id uuid,
  user_id uuid,
  parent_id uuid,
  content text,
  created_at timestamptz,
  is_reported boolean,
  likes_count integer,
  display_name text,
  avatar_url text,
  depth integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- Base case: top-level comments (no parent)
    SELECT 
      c.id,
      c.book_id,
      c.user_id,
      c.parent_id,
      c.content,
      c.created_at,
      c.is_reported,
      c.likes_count,
      p.display_name,
      p.avatar_url,
      0 AS depth
    FROM comments c
    LEFT JOIN profiles p ON c.user_id = p.user_id
    WHERE c.book_id = target_book_id AND c.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: replies
    SELECT 
      c.id,
      c.book_id,
      c.user_id,
      c.parent_id,
      c.content,
      c.created_at,
      c.is_reported,
      c.likes_count,
      p.display_name,
      p.avatar_url,
      ct.depth + 1 AS depth
    FROM comments c
    LEFT JOIN profiles p ON c.user_id = p.user_id
    INNER JOIN comment_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM comment_tree
  ORDER BY 
    -- Order by root comment created_at first, then by depth and created_at
    (SELECT created_at FROM comments WHERE id = COALESCE(comment_tree.parent_id, comment_tree.id)) DESC,
    comment_tree.depth ASC,
    comment_tree.created_at ASC;
END;
$$;

-- 6) Grant execute permission
GRANT EXECUTE ON FUNCTION get_book_comments_tree(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_book_comments_tree(uuid) TO anon;
