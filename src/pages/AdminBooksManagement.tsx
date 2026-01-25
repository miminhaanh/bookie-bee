import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, Loader2, Trash2, Eye, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  status: string | null;
  progress: number | null;
  total_pages: number | null;
  current_page: number | null;
  format: string | null;
  file_url: string | null;
  created_at: string;
  is_from_library: boolean;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  email: string;
}

const AdminBooksManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("adminToken");
    const email = localStorage.getItem("adminEmail");

    if (!token || !email) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setAdminEmail(email);
    fetchAllBooks();
  }, [navigate]);

  const fetchAllBooks = async () => {
    setLoading(true);
    try {
      // Fetch all books from all users
      console.log("🔄 Fetching all books from database...");
      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📊 Books fetch result:");
      console.log("   Error:", booksError);
      console.log("   Data count:", booksData?.length || 0);
      console.log("   Data sample:", booksData?.[0]);

      if (booksError) throw booksError;

      setBooks(booksData || []);
      setFilteredBooks(booksData || []);
      
      console.log("✅ Books loaded successfully:", booksData?.length);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sách",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfiles = async (userIds: string[]) => {
    try {
      if (!userIds || userIds.length === 0) {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", userIds);

      if (error) {
        console.error("Error fetching profiles:", error);
        return;
      }

      const profileMap = new Map();
      (data || []).forEach((profile: any) => {
        profileMap.set(profile.id, {
          user_id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
        });
      });

      setUserProfiles(profileMap);
    } catch (error) {
      console.error("Error fetching user profiles:", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const q = query.toLowerCase();
    const filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(q) ||
        (book.author?.toLowerCase() ?? "").includes(q)
    );
    setFilteredBooks(filtered);
  };

  const handleDeleteBook = async (bookId: string, bookTitle: string) => {
    if (!confirm(`Bạn chắc chắn muốn xóa sách "${bookTitle}"?`)) return;

    try {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId);

      if (error) throw error;

      setBooks(books.filter((b) => b.id !== bookId));
      setFilteredBooks(filteredBooks.filter((b) => b.id !== bookId));

      toast({
        title: "Thành công",
        description: "Sách đã được xóa",
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa sách",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    toast({
      title: "Đã đăng xuất",
      description: "Bạn đã đăng xuất khỏi tài khoản admin",
    });
    navigate("/admin/login", { replace: true });
  };

  const getUserInfo = (userId: string) => {
    return userProfiles.get(userId) || { display_name: userId, email: "N/A" };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "reading":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "to_read":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "reading":
        return "Đang đọc";
      case "completed":
        return "Hoàn thành";
      case "to_read":
        return "Sẽ đọc";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/dashboard")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Quản lý sách</h1>
              <p className="text-sm text-gray-400">Xem và quản lý tất cả sách được upload</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{adminEmail}</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm font-medium">Tổng sách</p>
            <p className="text-3xl font-bold text-white mt-2">
              {books.length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm font-medium">Sách đang đọc</p>
            <p className="text-3xl font-bold text-white mt-2">
              {books.filter((b) => b.status === "reading").length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm font-medium">Sách hoàn thành</p>
            <p className="text-3xl font-bold text-white mt-2">
              {books.filter((b) => b.status === "completed").length}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Tìm kiếm theo tên sách, tác giả hoặc chủ sở hữu..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Books table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
            <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {books.length === 0 ? "Chưa có sách nào" : "Không tìm thấy sách phù hợp"}
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Sách
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Chủ sở hữu
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Tác giả
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Định dạng
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Ngày thêm
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book, index) => {
                    const userInfo = getUserInfo(book.user_id);
                    const createdDate = new Date(book.created_at).toLocaleDateString(
                      "vi-VN"
                    );

                    return (
                      <tr
                        key={book.id}
                        className={`border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                          index % 2 === 0 ? "bg-gray-800" : "bg-gray-750"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {book.cover_url ? (
                              <img
                                src={book.cover_url}
                                alt={book.title}
                                className="w-10 h-14 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <span className="font-medium text-white max-w-xs truncate">
                              {book.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-300">
                            <p className="font-medium">
                              {userInfo.display_name || "Unknown"}
                            </p>
                            <p className="text-gray-500 text-xs">{userInfo.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {book.author || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          <span className="px-2 py-1 bg-gray-700 rounded text-xs font-medium uppercase">
                            {book.format || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(
                              book.status || ""
                            )}`}
                          >
                            {getStatusLabel(book.status || "")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {createdDate}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 text-blue-400 hover:bg-blue-900 hover:text-blue-300"
                              onClick={() => setSelectedBook(book)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Chi tiết
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-600 text-red-400 hover:bg-red-900 hover:text-red-300"
                              onClick={() =>
                                handleDeleteBook(book.id, book.title)
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Book Details Modal */}
        {selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Chi tiết sách</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedBook(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                {selectedBook.cover_url && (
                  <img
                    src={selectedBook.cover_url}
                    alt={selectedBook.title}
                    className="w-32 h-48 object-cover rounded"
                  />
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    Tên sách
                  </h3>
                  <p className="text-white">{selectedBook.title}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    Tác giả
                  </h3>
                  <p className="text-white">{selectedBook.author || "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    Chủ sở hữu
                  </h3>
                  <div className="text-white">
                    <p className="font-medium">
                      {getUserInfo(selectedBook.user_id).display_name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {getUserInfo(selectedBook.user_id).email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">
                      Định dạng
                    </h3>
                    <p className="text-white uppercase">
                      {selectedBook.format || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">
                      Trạng thái
                    </h3>
                    <p className="text-white">
                      {getStatusLabel(selectedBook.status || "")}
                    </p>
                  </div>
                </div>

                {selectedBook.total_pages && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-1">
                      Số trang
                    </h3>
                    <p className="text-white">{selectedBook.total_pages}</p>
                  </div>
                )}

                {selectedBook.progress !== null && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">
                      Tiến độ đọc
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(selectedBook.progress ?? 0) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-medium">
                        {Math.round((selectedBook.progress ?? 0) * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-1">
                    Ngày thêm
                  </h3>
                  <p className="text-white">
                    {new Date(selectedBook.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>

                <div className="flex gap-4 pt-6 border-t border-gray-700">
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      handleDeleteBook(selectedBook.id, selectedBook.title);
                      setSelectedBook(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa sách
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-600"
                    onClick={() => setSelectedBook(null)}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminBooksManagement;
