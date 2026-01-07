-- Create enum for book status
CREATE TYPE public.book_status AS ENUM ('reading', 'completed', 'to_read');

-- Create enum for book format
CREATE TYPE public.book_format AS ENUM ('pdf', 'epub', 'txt');

-- Create enum for highlight color
CREATE TYPE public.highlight_color AS ENUM ('yellow', 'blue', 'red');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_read_date DATE,
  default_reader_theme TEXT DEFAULT 'light',
  default_font_family TEXT DEFAULT 'sans-serif',
  default_font_size INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  description TEXT,
  cover_url TEXT,
  genre TEXT,
  format public.book_format,
  file_url TEXT,
  status public.book_status DEFAULT 'to_read',
  progress DECIMAL(5,2) DEFAULT 0,
  current_position TEXT,
  total_pages INTEGER,
  current_page INTEGER DEFAULT 0,
  estimated_time_remaining INTEGER,
  is_from_library BOOLEAN DEFAULT false,
  open_library_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create reading_sessions table (for tracking reading time)
CREATE TABLE public.reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  pages_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create daily_reading table (aggregated daily stats)
CREATE TABLE public.daily_reading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_seconds INTEGER DEFAULT 0,
  books_count INTEGER DEFAULT 0,
  pages_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create highlights table
CREATE TABLE public.highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note TEXT,
  color public.highlight_color DEFAULT 'yellow',
  position TEXT,
  chapter TEXT,
  page_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reading ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON public.books
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Books policies
CREATE POLICY "Users can view own books" ON public.books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON public.books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON public.books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON public.books
  FOR DELETE USING (auth.uid() = user_id);

-- Reading sessions policies
CREATE POLICY "Users can view own sessions" ON public.reading_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.reading_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.reading_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Daily reading policies
CREATE POLICY "Users can view own daily reading" ON public.daily_reading
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily reading" ON public.daily_reading
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily reading" ON public.daily_reading
  FOR UPDATE USING (auth.uid() = user_id);

-- Highlights policies
CREATE POLICY "Users can view own highlights" ON public.highlights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own highlights" ON public.highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own highlights" ON public.highlights
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own highlights" ON public.highlights
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_highlights_updated_at
  BEFORE UPDATE ON public.highlights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('book-files', 'book-files', false, 104857600, ARRAY['application/pdf', 'application/epub+zip', 'text/plain']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('book-covers', 'book-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage policies for book-files (private)
CREATE POLICY "Users can upload own book files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'book-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own book files" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own book files" ON storage.objects
  FOR DELETE USING (bucket_id = 'book-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars (public read, authenticated write)
CREATE POLICY "Avatars are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for book-covers (public read, authenticated write)
CREATE POLICY "Book covers are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'book-covers');

CREATE POLICY "Users can upload own book covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'book-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own book covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'book-covers' AND auth.uid()::text = (storage.foldername(name))[1]);