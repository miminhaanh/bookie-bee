import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, BarChart3, Users, Book, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState("");
  const [stats, setStats] = useState({
    users: 0,
    books: 0,
    activeReaders: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("adminToken");
    const email = localStorage.getItem("adminEmail");

    if (!token || !email) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setAdminEmail(email);
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // 1. Tổng người dùng - từ profiles table
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // 2. Tổng sách - từ books table
      const { count: booksCount } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true });

      // 3. Độc giả hoạt động - người dùng có ít nhất 1 cuốn sách
      const { data: activeReaders } = await supabase
        .from("books")
        .select("user_id", { count: "exact" })
        .then(({ count }) => ({ count }));

      // Đếm số user duy nhất có sách
      const { data: uniqueReaders } = await supabase
        .from("books")
        .select("user_id")
        .then(({ data }) => {
          const unique = new Set(data?.map((b: any) => b.user_id) || []);
          return { data: Array.from(unique).length };
        });

      // 4. Tổng đánh giá - từ book ratings/reviews (nếu có table)
      // Tạm thời lấy từ progress/status của books
      const { count: reviewsCount } = await supabase
        .from("books")
        .select("*", { count: "exact", head: true })
        .not("status", "is", null);

      setStats({
        users: usersCount || 0,
        books: booksCount || 0,
        activeReaders: uniqueReaders || 0,
        totalReviews: reviewsCount || 0,
      });

      console.log("📊 Admin stats fetched:", {
        users: usersCount,
        books: booksCount,
        activeReaders: uniqueReaders,
        reviews: reviewsCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải thống kê",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const handleNavigateToBooks = () => {
    navigate("/admin/books");
  };

  const handleNavigateToUsers = () => {
    navigate("/admin/users");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Bookie Bee Admin</h1>
            <p className="text-sm text-gray-400">Bảng điều khiển quản trị</p>
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
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Chào mừng, Admin! 👋
          </h2>
          <p className="text-gray-400">
            Đây là bảng điều khiển quản trị hệ thống Bookie Bee
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Users card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Tổng người dùng</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats.users.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="bg-blue-900 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Books card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Tổng sách</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats.books.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="bg-purple-900 p-3 rounded-lg">
                <Book className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Active readers card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-green-500 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Độc giả hoạt động</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats.activeReaders.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="bg-green-900 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          {/* Reviews card */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-orange-500 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Tổng đánh giá</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {stats.totalReviews.toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="bg-orange-900 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Features section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* User Management */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer" onClick={handleNavigateToUsers}>
            <div className="flex items-center mb-4">
              <div className="bg-blue-900 p-3 rounded-lg mr-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Quản lý người dùng</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Xem danh sách người dùng và ban/gỡ ban tài khoản
            </p>
            <Button variant="outline" size="sm" onClick={handleNavigateToUsers} className="text-blue-400 border-blue-400 hover:bg-blue-900">
              Truy cập
            </Button>
          </div>

          {/* Book Management */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-purple-500 transition-colors cursor-pointer" onClick={handleNavigateToBooks}>
            <div className="flex items-center mb-4">
              <div className="bg-purple-900 p-3 rounded-lg mr-4">
                <Book className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Quản lý sách</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Xem và quản lý tất cả sách được người dùng upload
            </p>
            <Button variant="outline" size="sm" onClick={handleNavigateToBooks} className="text-purple-400 border-purple-400 hover:bg-purple-900">
              Truy cập
            </Button>
          </div>

          {/* Settings */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-orange-500 transition-colors cursor-pointer">
            <div className="flex items-center mb-4">
              <div className="bg-orange-900 p-3 rounded-lg mr-4">
                <Settings className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Cài đặt hệ thống</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Cấu hình và quản lý cài đặt chung
            </p>
            <Button variant="outline" size="sm" className="text-orange-400 border-orange-400 hover:bg-orange-900">
              Truy cập
            </Button>
          </div>
        </div>

        {/* Info section */}
        <div className="mt-8 bg-blue-900 border border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-2">📋 Thông tin</h3>
          <p className="text-blue-100 text-sm">
            Đây là bảng điều khiển admin phiên bản beta. Hệ thống này cung cấp công cụ quản lý toàn diện cho nền tảng Bookie Bee.
            Vui lòng liên hệ với nhóm phát triển nếu bạn gặp bất kỳ vấn đề nào.
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
