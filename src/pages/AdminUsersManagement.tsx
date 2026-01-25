import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, Loader2, Ban, CheckCircle, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserData {
  id: string;
  email: string;
  display_name: string | null;
  banned_at: string | null;
  created_at: string;
}

const AdminUsersManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getAllUsers, banUser, unbanUser } = useAuth();
  const [adminEmail, setAdminEmail] = useState("");
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem("adminToken");
    const email = localStorage.getItem("adminEmail");

    if (!token || !email) {
      navigate("/admin/login", { replace: true });
      return;
    }

    setAdminEmail(email);
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Query chỉ những cột có sẵn
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message);
      }

      console.log("Fetched users:", data);
      
      // Thêm các field mặc định
      const usersWithDefaults = (data || []).map((user: any) => ({
        ...user,
        email: "N/A",
        banned_at: null,
      }));

      setUsers(usersWithDefaults as UserData[] || []);
      setFilteredUsers(usersWithDefaults as UserData[] || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Lỗi",
        description: `Không thể tải danh sách người dùng: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const q = query.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(q) ||
        (user.display_name?.toLowerCase() ?? "").includes(q)
    );
    setFilteredUsers(filtered);
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm("Bạn chắc chắn muốn ban người dùng này?")) return;

    setActionLoading(true);
    try {
      const { error } = await banUser(userId);
      if (error) throw error;

      // Cập nhật UI
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, banned_at: new Date().toISOString() } : u
      );
      setUsers(updatedUsers);
      setFilteredUsers(
        updatedUsers.filter((u) =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.display_name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
        )
      );

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, banned_at: new Date().toISOString() });
      }

      toast({
        title: "Thành công",
        description: "Người dùng đã bị ban",
      });
    } catch (error) {
      console.error("Error banning user:", error);
      toast({
        title: "Lỗi",
        description: "Không thể ban người dùng",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm("Bạn chắc chắn muốn gỡ ban cho người dùng này?")) return;

    setActionLoading(true);
    try {
      const { error } = await unbanUser(userId);
      if (error) throw error;

      // Cập nhật UI
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, banned_at: null } : u
      );
      setUsers(updatedUsers);
      setFilteredUsers(
        updatedUsers.filter((u) =>
          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.display_name?.toLowerCase() ?? "").includes(searchQuery.toLowerCase())
        )
      );

      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, banned_at: null });
      }

      toast({
        title: "Thành công",
        description: "Người dùng đã được gỡ ban",
      });
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gỡ ban người dùng",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
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

  const getStatusColor = (isBanned: boolean) => {
    return isBanned ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700";
  };

  const getStatusLabel = (isBanned: boolean) => {
    return isBanned ? "Bị ban" : "Hoạt động";
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
              <h1 className="text-2xl font-bold text-white">Quản lý người dùng</h1>
              <p className="text-sm text-gray-400">Xem và quản lý tài khoản người dùng</p>
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
            <p className="text-gray-400 text-sm font-medium">Tổng người dùng</p>
            <p className="text-3xl font-bold text-white mt-2">
              {users.length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm font-medium">Người dùng hoạt động</p>
            <p className="text-3xl font-bold text-white mt-2">
              {users.filter((u) => !u.banned_at).length}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm font-medium">Người dùng bị ban</p>
            <p className="text-3xl font-bold text-white mt-2">
              {users.filter((u) => u.banned_at).length}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Tìm kiếm theo email hoặc tên hiển thị..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Users table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
            <Shield className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              {users.length === 0 ? "Chưa có người dùng nào" : "Không tìm thấy người dùng phù hợp"}
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Tên hiển thị
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Ngày đăng ký
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => {
                    const createdDate = new Date(user.created_at).toLocaleDateString(
                      "vi-VN"
                    );
                    const isBanned = !!user.banned_at;

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                          index % 2 === 0 ? "bg-gray-800" : "bg-gray-750"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <span className="font-medium text-white">{user.email}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {user.display_name || "Chưa đặt"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {createdDate}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(
                              isBanned
                            )}`}
                          >
                            {getStatusLabel(isBanned)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 text-blue-400 hover:bg-blue-900 hover:text-blue-300"
                              onClick={() => setSelectedUser(user)}
                            >
                              Chi tiết
                            </Button>
                            {isBanned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-green-600 text-green-400 hover:bg-green-900 hover:text-green-300"
                                onClick={() => handleUnbanUser(user.id)}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-600 text-red-400 hover:bg-red-900 hover:text-red-300"
                                onClick={() => handleBanUser(user.id)}
                                disabled={actionLoading}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
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

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">Chi tiết người dùng</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    Email
                  </h3>
                  <p className="text-white">{selectedUser.email}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    Tên hiển thị
                  </h3>
                  <p className="text-white">{selectedUser.display_name || "Chưa đặt"}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    ID người dùng
                  </h3>
                  <p className="text-white text-sm font-mono break-all">{selectedUser.id}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    Ngày đăng ký
                  </h3>
                  <p className="text-white">
                    {new Date(selectedUser.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    Trạng thái
                  </h3>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded ${getStatusColor(
                      !!selectedUser.banned_at
                    )}`}
                  >
                    {getStatusLabel(!!selectedUser.banned_at)}
                  </span>
                </div>

                {selectedUser.banned_at && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">
                      Ngày bị ban
                    </h3>
                    <p className="text-white">
                      {new Date(selectedUser.banned_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-6 border-t border-gray-700">
                  {selectedUser.banned_at ? (
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleUnbanUser(selectedUser.id);
                        setSelectedUser(null);
                      }}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Gỡ ban
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        handleBanUser(selectedUser.id);
                        setSelectedUser(null);
                      }}
                      disabled={actionLoading}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Ban người dùng
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 border-gray-600"
                    onClick={() => setSelectedUser(null)}
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

export default AdminUsersManagement;
