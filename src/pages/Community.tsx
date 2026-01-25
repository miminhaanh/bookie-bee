import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Loader2,
  Heart,
  MessageCircle,
  Clock,
  TrendingUp,
  Flame,
  BookOpen,
  ArrowLeft,
  Send,
  Trash2,
  Reply,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ModernBookCover, BookTitle, BookDescription } from "@/components/books/ModernBookCover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

// Genres - sync với AdminDashboard.tsx
const genres = [
  { id: "all", label: "Tất cả", icon: Sparkles },
  { id: "Văn học", label: "Văn học", icon: BookOpen },
  { id: "Self-help", label: "Phát triển bản thân", icon: TrendingUp },
  { id: "Kinh doanh", label: "Kinh doanh", icon: TrendingUp },
  { id: "Khoa học", label: "Khoa học", icon: Sparkles },
  { id: "Lịch sử", label: "Lịch sử", icon: Clock },
  { id: "Tâm lý", label: "Tâm lý học", icon: Heart },
  { id: "Truyện ngắn", label: "Truyện ngắn", icon: BookOpen },
  { id: "Tiểu thuyết", label: "Tiểu thuyết", icon: BookOpen },
  { id: "Giả tưởng", label: "Giả tưởng", icon: Sparkles },
  { id: "Lãng mạn", label: "Lãng mạn", icon: Heart },
  { id: "Kinh dị", label: "Kinh dị", icon: Flame },
  { id: "Trinh thám", label: "Trinh thám", icon: Search },
];

const sortOptions = [
  { id: "newest", label: "Mới nhất", icon: Clock },
  { id: "popular", label: "Phổ biến", icon: Heart },
  { id: "trending", label: "Thịnh hành", icon: Flame },
];

type PublicBook = {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  cover_url: string | null;
  file_url: string | null;
  format: string | null;
  genre: string | null;
  created_at: string;
  total_pages: number | null;
  likes_count?: number;
  comments_count?: number;
};

type CommentWithProfile = {
  id: string;
  book_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  is_reported: boolean;
  likes_count: number;
  display_name: string | null;
  avatar_url: string | null;
  depth: number;
};

// ==================== BOOK DETAIL MODAL ====================
const BookDetailModal = ({
  book,
  onClose,
  onStartReading,
}: {
  book: PublicBook;
  onClose: () => void;
  onStartReading: () => void;
}) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<CommentWithProfile | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchComments();
  }, [book.id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data: rawComments, error } = await (supabase as any)
        .from("comments")
        .select("id, book_id, user_id, parent_id, content, created_at, is_reported, likes_count")
        .eq("book_id", book.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const commentRows = rawComments || [];
      const userIds = Array.from(new Set(commentRows.map((c: any) => c.user_id)));

      let profileMap = new Map<string, { display_name: string | null; avatar_url: string | null }>();
      if (userIds.length > 0) {
        const { data: profileRows, error: profileError } = await (supabase as any)
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        if (!profileError && profileRows) {
          profileMap = new Map(
            profileRows.map((p: any) => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
          );
        }
      }

      const transformed = commentRows.map((c: any) => ({
        ...c,
        display_name: profileMap.get(c.user_id)?.display_name ?? null,
        avatar_url: profileMap.get(c.user_id)?.avatar_url ?? null,
        depth: c.parent_id ? 1 : 0,
      }));

      setComments(transformed);
    } catch (err) {
      console.error("Error fetching comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("comments").insert({
        book_id: book.id,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: replyTo?.id || null,
      });

      if (error) throw error;

      toast({ title: "Đã gửi bình luận!" });
      setNewComment("");
      setReplyTo(null);
      await fetchComments();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      const { error } = await (supabase as any)
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      toast({ title: "Đã xóa bình luận" });
      await fetchComments();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message, variant: "destructive" });
    }
  };

  const handleReply = (comment: CommentWithProfile) => {
    setReplyTo(comment);
    commentInputRef.current?.focus();
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Group comments: parents and their replies
  const parentComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start gap-6">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-6 flex-1">
            {/* Book Cover */}
            <div className="w-32 h-48 flex-shrink-0 rounded-xl overflow-hidden shadow-lg">
              <ModernBookCover
                coverImage={book.cover_url}
                className="w-full h-full object-cover"
                color="rose"
              >
                {!book.cover_url && (
                  <div className="w-full h-full p-3 flex flex-col justify-end">
                    <BookTitle className="text-white text-xs">{book.title}</BookTitle>
                  </div>
                )}
              </ModernBookCover>
            </div>

            {/* Book Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{book.title}</h2>
              <p className="text-gray-600 mb-3">{book.author || "Không rõ tác giả"}</p>

              {book.genre && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.genre.split(", ").map((g) => (
                    <Badge
                      key={g}
                      variant="outline"
                      className="bg-rose-50 text-rose-600 border-rose-200"
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              )}

              <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                {book.description || "Chưa có mô tả"}
              </p>

              <Button
                onClick={onStartReading}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full px-6"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Bắt đầu đọc
              </Button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-rose-500" />
            Bình luận ({comments.length})
          </h3>

          {/* Comment Input */}
          {user && (
            <div className="mb-6 bg-gray-50 rounded-2xl p-4">
              {replyTo && (
                <div className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                  <Reply className="w-4 h-4" />
                  <span>Đang trả lời</span>
                  <span className="font-medium">{replyTo.display_name || "Người dùng"}</span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="ml-auto text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <Textarea
                  ref={commentInputRef}
                  placeholder={replyTo ? "Viết câu trả lời..." : "Viết bình luận của bạn..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 min-h-[80px] resize-none rounded-xl border-gray-200"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="self-end bg-rose-500 hover:bg-rose-600 rounded-xl"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {parentComments.map((comment) => {
                const replies = getReplies(comment.id);
                const isExpanded = expandedReplies.has(comment.id);
                const canDelete = user?.id === comment.user_id || isAdmin;

                return (
                  <div key={comment.id} className="group">
                    {/* Parent Comment */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={comment.avatar_url || undefined} />
                          <AvatarFallback className="bg-rose-100 text-rose-600">
                            {(comment.display_name || "U")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {comment.display_name || "Người dùng"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>

                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => handleReply(comment)}
                              className="text-sm text-gray-500 hover:text-rose-500 flex items-center gap-1"
                            >
                              <Reply className="w-4 h-4" />
                              Trả lời
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-4 h-4" />
                                Xóa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Replies */}
                    {replies.length > 0 && (
                      <div className="ml-12 mt-2">
                        <button
                          onClick={() => toggleReplies(comment.id)}
                          className="text-sm text-rose-500 hover:text-rose-600 flex items-center gap-1 mb-2"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          {replies.length} câu trả lời
                        </button>

                        {isExpanded && (
                          <div className="space-y-2">
                            {replies.map((reply) => {
                              const canDeleteReply =
                                user?.id === reply.user_id || isAdmin;

                              return (
                                <div
                                  key={reply.id}
                                  className="group bg-gray-50 rounded-xl p-3 border-l-2 border-rose-200"
                                >
                                  <div className="flex items-start gap-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={reply.avatar_url || undefined} />
                                      <AvatarFallback className="bg-rose-100 text-rose-600 text-xs">
                                        {(reply.display_name || "U")[0].toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-900 text-sm">
                                          {reply.display_name || "Người dùng"}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          {formatDistanceToNow(new Date(reply.created_at), {
                                            addSuffix: true,
                                            locale: vi,
                                          })}
                                        </span>
                                      </div>
                                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                        {reply.content}
                                      </p>

                                      <div className="flex items-center gap-3 mt-1">
                                        <button
                                          onClick={() => handleReply(comment)}
                                          className="text-xs text-gray-500 hover:text-rose-500 flex items-center gap-1"
                                        >
                                          <Reply className="w-3 h-3" />
                                          Trả lời
                                        </button>
                                        {canDeleteReply && (
                                          <button
                                            onClick={() => handleDeleteComment(reply.id)}
                                            className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                            Xóa
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMMUNITY PAGE ====================
const Community = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [publicBooks, setPublicBooks] = useState<PublicBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedBook, setSelectedBook] = useState<PublicBook | null>(null);
  const isFiltering = search.trim().length > 0 || selectedGenre !== "all" || sortBy !== "newest";

  useEffect(() => {
    fetchPublicBooks();
  }, []);

  const fetchPublicBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("books")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch comment counts for each book
      const booksWithCounts = await Promise.all(
        (data || []).map(async (book: any) => {
          const { count } = await (supabase as any)
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("book_id", book.id);

          return {
            ...book,
            comments_count: count || 0,
            likes_count: Math.floor(Math.random() * 300) + 50, // Placeholder
          };
        })
      );

      setPublicBooks(booksWithCounts);
    } catch (err) {
      console.error("Error fetching public books:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReading = async (book: PublicBook) => {
    if (!user) {
      navigate("/auth?returnUrl=/community");
      return;
    }

    try {
      // Check if user already has this book
      const { data: existingBook } = await supabase
        .from("books")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", book.title)
        .eq("is_from_library", true)
        .maybeSingle();

      if (existingBook) {
        // Already have it, update status to reading and go to reader
        await supabase
          .from("books")
          .update({ status: "reading" })
          .eq("id", existingBook.id);

        toast({
          title: "Đang mở sách...",
          description: `"${book.title}" đã có trong thư viện của bạn.`,
        });

        navigate(`/read/${existingBook.id}`);
        return;
      }

      // Create a copy for the user
      const { data: newBook, error } = await (supabase as any)
        .from("books")
        .insert({
          title: book.title,
          author: book.author,
          description: book.description,
          cover_url: book.cover_url,
          file_url: book.file_url,
          format: book.format as "pdf" | "epub" | "txt" | null,
          genre: book.genre,
          user_id: user.id,
          total_pages: book.total_pages,
          is_public: false,
          status: "reading",
          progress: 0,
          is_from_library: true,
        })
        .select("id")
        .single();

      if (error) throw error;

      toast({
        title: "Đã thêm vào Đang đọc!",
        description: `"${book.title}" đã được thêm vào thư viện của bạn.`,
      });

      setSelectedBook(null);
      navigate(`/read/${newBook.id}`);
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // Redirect if not logged in
  if (!authLoading && !user) {
    const returnUrl = encodeURIComponent("/community");
    navigate(`/auth?returnUrl=${returnUrl}`, { replace: true });
    return null;
  }

  // Filter and sort books
  const filteredBooks = publicBooks
    .filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author?.toLowerCase().includes(search.toLowerCase());
      const matchesGenre =
        selectedGenre === "all" || b.genre?.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "popular") {
        return (b.likes_count || 0) - (a.likes_count || 0);
      }
      if (sortBy === "trending") {
        return (b.comments_count || 0) - (a.comments_count || 0);
      }
      return 0;
    });

  return (
    <DashboardLayout mobileTitle="Thư viện">
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white safe-area-top">
        {/* Search & Filters Block */}
        <div className="container mx-auto px-4 pt-6 pb-4">
          <div className="rounded-3xl border border-rose-100/70 bg-white/70 backdrop-blur px-4 py-5 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm text-rose-500">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">Thư viện cộng đồng</span>
                <Sparkles className="w-4 h-4" />
              </div>

              {!isFiltering && (
                <p className="text-xs text-gray-500 md:text-sm">
                  Gợi ý: thử tìm theo tên tác giả hoặc từ khóa trong tiêu đề.
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-4">
              <div className="relative w-full md:max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Tìm sách hoặc tác giả..."
                  className="pl-11 h-11 rounded-2xl border-gray-200 bg-white shadow-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {sortOptions.map((opt) => (
                  <Button
                    key={opt.id}
                    variant={sortBy === opt.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(opt.id)}
                    className={cn(
                      "rounded-xl gap-2",
                      sortBy === opt.id
                        ? "bg-rose-500 hover:bg-rose-600 text-white"
                        : "border-gray-200 hover:border-rose-300 hover:text-rose-600"
                    )}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Button
                    key={genre.id}
                    variant={selectedGenre === genre.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedGenre(genre.id)}
                    className={cn(
                      "rounded-full gap-2 transition-all",
                      selectedGenre === genre.id
                        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                        : "border-gray-200 bg-white hover:border-rose-300 hover:text-rose-600"
                    )}
                  >
                    <genre.icon className="w-4 h-4" />
                    {genre.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <div className="container mx-auto px-4 pb-12">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-rose-200 bg-white/70 p-8 text-left">
              <p className="text-lg font-semibold text-gray-800">Chưa thấy cuốn nào phù hợp.</p>
              <p className="mt-1 text-sm text-gray-500">
                Hãy thử đổi thể loại hoặc gõ tên tác giả cụ thể hơn nhé.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedBook(book)}
                >
                  {/* Book Card */}
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                    <ModernBookCover
                      coverImage={book.cover_url}
                      className="w-full h-full object-cover"
                      color="rose"
                    >
                      {!book.cover_url && (
                        <div className="w-full h-full p-4 flex flex-col justify-end">
                          <BookTitle className="text-white text-sm">
                            {book.title}
                          </BookTitle>
                          <BookDescription className="text-white/80 text-xs">
                            {book.author}
                          </BookDescription>
                        </div>
                      )}
                    </ModernBookCover>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-4">
                      <Button
                        size="sm"
                        className="w-full bg-white text-rose-600 hover:bg-rose-50 rounded-full mb-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartReading(book);
                        }}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Đọc ngay
                      </Button>
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="mt-3">
                    <h3
                      className="font-semibold text-gray-900 line-clamp-1 group-hover:text-rose-600 transition-colors"
                      title={book.title}
                    >
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {book.author || "Không rõ tác giả"}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        {book.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                        {book.comments_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Book Detail Modal */}
        {selectedBook && (
          <BookDetailModal
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
            onStartReading={() => handleStartReading(selectedBook)}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Community;