import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Users, 
  MessageSquare, 
  Trash2, 
  AlertTriangle,
  ShieldCheck,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

// Dữ liệu giả cho thống kê
const mockStats = {
  totalViews: 15847,
  totalUsers: 342,
  totalComments: 1256,
};

// Dữ liệu giả cho bình luận vi phạm
const initialViolatingComments = [
  {
    id: "1",
    user: "user123@gmail.com",
    content: "Sách này quá tệ, không đáng đọc!!! 💩💩💩",
    bookTitle: "Đắc Nhân Tâm",
    reportReason: "Ngôn ngữ không phù hợp",
    reportedAt: "2026-01-24",
  },
  {
    id: "2",
    user: "troll_reader@email.com",
    content: "Mọi người đừng đọc sách này, toàn nói xạo!!!",
    bookTitle: "Nhà Giả Kim",
    reportReason: "Spam / Gây hiểu lầm",
    reportedAt: "2026-01-23",
  },
  {
    id: "3",
    user: "angry_bee@bookie.com",
    content: "Tác giả viết quá dở, không biết viết sách thì nghỉ đi!!!",
    bookTitle: "Tuổi Trẻ Đáng Giá Bao Nhiêu",
    reportReason: "Công kích cá nhân",
    reportedAt: "2026-01-22",
  },
  {
    id: "4",
    user: "hater2026@test.com",
    content: "Link download free: http://spam-link.com/free-books",
    bookTitle: "Atomic Habits",
    reportReason: "Link spam / Quảng cáo",
    reportedAt: "2026-01-21",
  },
  {
    id: "5",
    user: "toxic_user@mail.com",
    content: "Ai thích sách này là không có não!",
    bookTitle: "Sapiens",
    reportReason: "Xúc phạm người dùng khác",
    reportedAt: "2026-01-20",
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [comments, setComments] = useState(initialViolatingComments);

  // Bảo vệ trang - chỉ admin mới được truy cập
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Chưa đăng nhập -> về trang auth
        navigate("/auth");
      } else if (!isAdmin) {
        // Đã đăng nhập nhưng không phải admin -> về trang chủ
        toast.error("Bạn không có quyền truy cập trang này!");
        navigate("/");
      }
    }
  }, [user, loading, isAdmin, navigate]);

  // Xử lý xóa bình luận
  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    toast.success("Đã xóa bình luận vi phạm!");
  };

  // Hiển thị loading khi đang kiểm tra auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-white to-peach/20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warm-pink"></div>
      </div>
    );
  }

  // Nếu không phải admin, không render gì (useEffect sẽ redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-white to-peach/20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-warm-pink/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="hover:bg-warm-pink/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Trang Quản Trị</h1>
                  <p className="text-sm text-muted-foreground">Xin chào, {user?.email}</p>
                </div>
              </div>
            </div>
            <Badge variant="destructive" className="px-3 py-1">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/60 backdrop-blur-sm border-warm-pink/10 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng Lượt Xem
              </CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {mockStats.totalViews.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1">+12% so với tuần trước</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-warm-pink/10 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng Người Dùng
              </CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {mockStats.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1">+8 người dùng mới hôm nay</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-warm-pink/10 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng Bình Luận
              </CardTitle>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {mockStats.totalComments.toLocaleString()}
              </div>
              <p className="text-xs text-green-600 mt-1">+45 bình luận hôm nay</p>
            </CardContent>
          </Card>
        </div>

        {/* Violating Comments Table */}
        <Card className="bg-white/60 backdrop-blur-sm border-warm-pink/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <CardTitle>Bình Luận Vi Phạm</CardTitle>
            </div>
            <CardDescription>
              Danh sách các bình luận bị báo cáo cần xem xét và xử lý
            </CardDescription>
          </CardHeader>
          <CardContent>
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">Không có vi phạm!</h3>
                <p className="text-muted-foreground">Tất cả bình luận đều tuân thủ quy định.</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="w-[200px]">Người dùng</TableHead>
                      <TableHead className="w-[300px]">Nội dung</TableHead>
                      <TableHead>Sách</TableHead>
                      <TableHead>Lý do báo cáo</TableHead>
                      <TableHead className="w-[100px]">Ngày</TableHead>
                      <TableHead className="w-[80px] text-center">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comments.map((comment) => (
                      <TableRow key={comment.id} className="hover:bg-red-50/30">
                        <TableCell className="font-medium text-sm">
                          {comment.user}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[300px] truncate">
                          {comment.content}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline">{comment.bookTitle}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">
                            {comment.reportReason}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {comment.reportedAt}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="hover:bg-red-100 hover:text-red-600"
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
      </main>
    </div>
  );
}
