import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  BookOpen,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type AdminProfileRow = {
  user_id: string;
  display_name: string | null;
  created_at: string | null;
  is_admin: boolean | null;
  email?: string | null;
};

type PublicBookRow = {
  id: string;
  title: string;
  author: string | null;
  created_at: string | null;
  is_public: boolean | null;
};

type CommentRow = {
  id: string;
  content: string;
  user_id: string;
  book_id: string;
  created_at: string;
  is_reported: boolean | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN");
};

const BOOK_FILES_BUCKET = "book-files";
const COVERS_BUCKET = "book-covers";

// Thể loại sách - sync với AddBook.tsx
const BOOK_GENRES = [
  "Văn học", "Self-help", "Kinh doanh", "Khoa học",
  "Lịch sử", "Tâm lý", "Truyện ngắn", "Tiểu thuyết",
  "Giả tưởng", "Lãng mạn", "Kinh dị", "Trinh thám"
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading, isAdmin, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPublicBooks: 0,
    totalComments: 0,
  });
  const [users, setUsers] = useState<AdminProfileRow[]>([]);
  const [publicBooks, setPublicBooks] = useState<PublicBookRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Upload book state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    description: "",
  });
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // Bảo vệ trang - chỉ admin mới được truy cập
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        toast.error("Bạn không có quyền truy cập trang này!");
        navigate("/");
      }
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (!loading && isAdmin) {
      void loadAdminData();
    }
  }, [loading, isAdmin]);

  const loadAdminData = async () => {
    setLoadingData(true);

    try {
      // ✅ Sử dụng Edge Function để lấy tất cả users (bypass RLS)
      const { data: usersData, error: usersError } = await supabase.functions.invoke("admin-list-users");
      
      if (usersError) {
        console.error("Fetch users error:", usersError);
        toast.error("Lỗi khi tải danh sách người dùng");
      }

      const usersFromEdge = usersData?.users ?? [];
      const totalUsersCount = usersData?.totalCount ?? usersData?.authUsersCount ?? 0;

      // Lấy sách công khai
      const booksCountRes = await (supabase as any)
        .from("books")
        .select("id", { head: true, count: "exact" })
        .eq("is_public", true);

      const booksRes = await (supabase as any)
        .from("books")
        .select("id, title, author, created_at, is_public")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);

      // Hiện tại comments table có thể chưa tồn tại
      let commentsCount = 0;
      let commentsData: CommentRow[] = [];
      try {
        const { count } = await (supabase as any).from("comments").select("id", { head: true, count: "exact" });
        commentsCount = count ?? 0;
        
        const { data } = await (supabase as any)
          .from("comments")
          .select("id, content, user_id, book_id, created_at, is_reported")
          .order("created_at", { ascending: false })
          .limit(50);
        commentsData = data ?? [];
      } catch (e) {
        console.log("Comments table not available yet");
      }

      setStats({
        totalUsers: totalUsersCount,
        totalPublicBooks: booksCountRes.count ?? 0,
        totalComments: commentsCount,
      });

      if (booksRes.error) console.error("Fetch books error:", booksRes.error);

      // Sử dụng users từ Edge Function (đã có email)
      setUsers(usersFromEdge as AdminProfileRow[]);
      setPublicBooks((booksRes.data as unknown as PublicBookRow[]) ?? []);
      setComments(commentsData);

    } catch (err) {
      console.error("loadAdminData error:", err);
      toast.error("Có lỗi khi tải dữ liệu admin");
    }

    setLoadingData(false);
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa người dùng này? Hành động không thể hoàn tác.");
    if (!confirmed) return;

    const { error } = await supabase.functions.invoke("admin-delete-user", {
      body: { user_id: userId },
    });

    if (error) {
      toast.error("Xóa người dùng thất bại", { description: error.message });
      return;
    }

    toast.success("Đã xóa người dùng");
    void loadAdminData();
  };

  const handleDeleteBook = async (bookId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa sách này khỏi thư viện cộng đồng?");
    if (!confirmed) return;

    const { error } = await supabase.from("books").delete().eq("id", bookId);
    if (error) {
      toast.error("Xóa sách thất bại", { description: error.message });
      return;
    }

    toast.success("Đã xóa sách khỏi thư viện cộng đồng");
    void loadAdminData();
  };

  const handleDeleteComment = async (commentId: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xóa bình luận này?");
    if (!confirmed) return;

    try {
      const { error } = await (supabase as any).from("comments").delete().eq("id", commentId);
      if (error) {
        toast.error("Xóa bình luận thất bại", { description: error.message });
        return;
      }

      toast.success("Đã xóa bình luận");
      void loadAdminData();
    } catch (e: any) {
      toast.error("Không thể xóa bình luận", { description: e.message });
    }
  };

  // Upload sách công khai
  const handleUploadBook = async () => {
    if (!bookFile || !bookForm.title) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setUploading(true);
    try {
      // Upload file sách - sanitize tên file kỹ hơn
      const fileExt = bookFile.name.split(".").pop()?.toLowerCase();
      const sanitizedName = bookFile.name
        .replace(/\.(pdf|epub|txt)$/i, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")           // Gộp nhiều underscore thành 1
        .replace(/^_|_$/g, "")          // Bỏ underscore đầu/cuối
        .substring(0, 50) || "book";    // Fallback nếu rỗng
      const filePath = `${user?.id ?? "admin"}/${Date.now()}_${sanitizedName}.${fileExt}`;
      
      const { error: fileError } = await supabase.storage
        .from(BOOK_FILES_BUCKET)
        .upload(filePath, bookFile, {
          contentType: bookFile.type || "application/pdf",
          upsert: true,
        });
      
      if (fileError) throw fileError;

      // Upload cover nếu có
      let coverUrl: string | null = null;
      if (coverFile) {
        const coverExt = coverFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const coverPath = `${user?.id ?? "admin"}/${Date.now()}_cover.${coverExt}`;
        const { error: coverError } = await supabase.storage
          .from(COVERS_BUCKET)
          .upload(coverPath, coverFile, {
            contentType: coverFile.type || "image/jpeg",
            upsert: true,
          });
        
        if (coverError) throw coverError;
        
        const { data: coverData } = supabase.storage.from(COVERS_BUCKET).getPublicUrl(coverPath);
        coverUrl = coverData.publicUrl;
      }

      // Insert book record với is_public = true và genre
      const { error: insertError } = await (supabase as any).from("books").insert({
        title: bookForm.title,
        author: bookForm.author || null,
        description: bookForm.description || null,
        file_url: filePath,
        cover_url: coverUrl,
        format: fileExt === "pdf" ? "pdf" : fileExt === "epub" ? "epub" : "txt",
        genre: selectedGenres.length > 0 ? selectedGenres.join(", ") : null,
        user_id: user?.id ?? null,
        is_from_library: false,
        is_public: true,
        status: "to_read",
        progress: 0,
      });

      if (insertError) throw insertError;

      toast.success("Đã upload sách lên thư viện cộng đồng!");
      setUploadDialogOpen(false);
      setBookFile(null);
      setCoverFile(null);
      setBookForm({ title: "", author: "", description: "" });
      setSelectedGenres([]);
      void loadAdminData();
    } catch (error: any) {
      toast.error("Upload thất bại", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const isPageLoading = loading || loadingData;

  // Hiển thị loading khi đang kiểm tra auth
  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Nếu không phải admin, không render gì (useEffect sẽ redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Admin Header - Giao diện nghiêm túc, tách biệt hoàn toàn */}
      <header className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Portal</h1>
                <p className="text-sm text-slate-400">Bookie Bee Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-red-500 text-red-400 px-3 py-1">
                <ShieldCheck className="w-4 h-4 mr-1" />
                {user?.email}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards - Giao diện tối, nghiêm túc */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Tổng Người Dùng
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Toàn bộ người dùng hệ thống</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Sách Công Khai
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats.totalPublicBooks.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Hiển thị ở Thư viện Cộng đồng</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Tổng Bình Luận
              </CardTitle>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats.totalComments.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-1">Tổng bình luận trong hệ thống</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Upload Sách Công Khai
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 text-white">
              <DialogHeader>
                <DialogTitle>Upload Sách lên Thư viện Cộng đồng</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Sách này sẽ hiển thị cho tất cả người dùng trong phần Thư viện.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">File sách (PDF) *</Label>
                  <Input 
                    type="file" 
                    accept=".pdf,.epub,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBookFile(file);
                        if (!bookForm.title) {
                          setBookForm(prev => ({ 
                            ...prev, 
                            title: file.name.replace(/\.(pdf|epub|txt)$/i, "").replace(/_/g, " ")
                          }));
                        }
                      }
                    }}
                    className="bg-slate-700 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Ảnh bìa (tùy chọn)</Label>
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="bg-slate-700 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Tên sách *</Label>
                  <Input 
                    value={bookForm.title}
                    onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nhập tên sách..."
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Tác giả</Label>
                  <Input 
                    value={bookForm.author}
                    onChange={(e) => setBookForm(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Tên tác giả..."
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Mô tả</Label>
                  <Textarea 
                    value={bookForm.description}
                    onChange={(e) => setBookForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Giới thiệu nội dung sách..."
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Thể loại *</Label>
                  <div className="flex flex-wrap gap-2">
                    {BOOK_GENRES.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => {
                          setSelectedGenres(prev => 
                            prev.includes(genre) 
                              ? prev.filter(g => g !== genre) 
                              : [...prev, genre]
                          );
                        }}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          selectedGenres.includes(genre)
                            ? "border-red-500 bg-red-500/20 text-red-400"
                            : "border-slate-600 text-slate-400 hover:border-slate-500"
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                  {selectedGenres.length > 0 && (
                    <p className="text-xs text-slate-500">Đã chọn: {selectedGenres.join(", ")}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setUploadDialogOpen(false)} className="text-slate-400 hover:text-white">
                  Hủy
                </Button>
                <Button 
                  onClick={handleUploadBook} 
                  disabled={uploading || !bookFile || !bookForm.title}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? "Đang upload..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            onClick={() => loadAdminData()}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới dữ liệu
          </Button>
        </div>

        <Tabs defaultValue="books" className="space-y-4">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="books" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Sách công khai ({publicBooks.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Người dùng ({users.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Bình luận ({comments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quản lý người dùng</CardTitle>
                <CardDescription className="text-slate-400">Danh sách 50 người dùng mới nhất</CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">Chưa có người dùng.</div>
                ) : (
                  <div className="rounded-lg border border-slate-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-700/50 border-slate-600">
                          <TableHead className="text-slate-300">Người dùng</TableHead>
                          <TableHead className="text-slate-300">Email</TableHead>
                          <TableHead className="text-slate-300">Vai trò</TableHead>
                          <TableHead className="text-slate-300">Ngày tạo</TableHead>
                          <TableHead className="w-[100px] text-center text-slate-300">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => {
                          const isSelf = u.user_id === user?.id;
                          const isAdminUser = Boolean(u.is_admin);
                          const canDelete = !isSelf && !isAdminUser;

                          return (
                            <TableRow key={u.user_id} className="hover:bg-slate-700/50 border-slate-700">
                              <TableCell className="font-medium text-white">
                                {u.display_name || "(Chưa đặt tên)"}
                              </TableCell>
                              <TableCell className="text-sm text-slate-400">
                                {u.email || u.user_id.slice(0, 8) + "..."}
                              </TableCell>
                              <TableCell>
                                {isAdminUser ? (
                                  <Badge className="bg-red-600 text-white">Admin</Badge>
                                ) : (
                                  <Badge variant="outline" className="border-slate-500 text-slate-300">User</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-slate-400">
                                {formatDate(u.created_at)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={!canDelete}
                                  onClick={() => handleDeleteUser(u.user_id)}
                                  className="hover:bg-red-900/50 hover:text-red-400 disabled:opacity-40 text-slate-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Thư viện cộng đồng</CardTitle>
                <CardDescription className="text-slate-400">Danh sách sách đang công khai</CardDescription>
              </CardHeader>
              <CardContent>
                {publicBooks.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">Chưa có sách công khai.</div>
                ) : (
                  <div className="rounded-lg border border-slate-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-700/50 border-slate-600">
                          <TableHead className="text-slate-300">Tên sách</TableHead>
                          <TableHead className="text-slate-300">Tác giả</TableHead>
                          <TableHead className="text-slate-300">Ngày tạo</TableHead>
                          <TableHead className="w-[100px] text-center text-slate-300">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {publicBooks.map((book) => (
                          <TableRow key={book.id} className="hover:bg-slate-700/50 border-slate-700">
                            <TableCell className="font-medium text-white">
                              {book.title}
                            </TableCell>
                            <TableCell className="text-sm text-slate-400">
                              {book.author || "(Không rõ)"}
                            </TableCell>
                            <TableCell className="text-sm text-slate-400">
                              {formatDate(book.created_at)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteBook(book.id)}
                                className="hover:bg-red-900/50 hover:text-red-400 text-slate-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  <CardTitle className="text-white">Bình luận</CardTitle>
                </div>
                <CardDescription className="text-slate-400">Danh sách bình luận gần đây</CardDescription>
              </CardHeader>
              <CardContent>
                {comments.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">Chưa có bình luận.</div>
                ) : (
                  <div className="rounded-lg border border-slate-700 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-700/50 border-slate-600">
                          <TableHead className="text-slate-300">Nội dung</TableHead>
                          <TableHead className="text-slate-300">Người dùng</TableHead>
                          <TableHead className="text-slate-300">Sách</TableHead>
                          <TableHead className="text-slate-300">Trạng thái</TableHead>
                          <TableHead className="text-slate-300">Ngày</TableHead>
                          <TableHead className="w-[100px] text-center text-slate-300">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comments.map((comment) => (
                          <TableRow key={comment.id} className="hover:bg-slate-700/50 border-slate-700">
                            <TableCell className="text-sm text-slate-200 max-w-[360px] truncate">
                              {comment.content}
                            </TableCell>
                            <TableCell className="text-xs text-slate-400 font-mono">
                              {comment.user_id.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="text-xs text-slate-400 font-mono">
                              {comment.book_id.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                              {comment.is_reported ? (
                                <Badge className="bg-red-600 text-white">Bị báo cáo</Badge>
                              ) : (
                                <Badge variant="outline" className="border-slate-500 text-slate-300">Bình thường</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-slate-400">
                              {formatDate(comment.created_at)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="hover:bg-red-900/50 hover:text-red-400 text-slate-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
