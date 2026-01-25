import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, Mail, Phone, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_EMAIL = "bookieebee@gmail.com";

const Feedback = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        content: "",
        type: "general"
    });

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth?returnUrl=/help", { replace: true });
        }
    }, [loading, user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.content.trim()) return;

        setIsSubmitting(true);
        try {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                toast({ title: "Bạn cần đăng nhập", description: "Vui lòng đăng nhập để gửi phản hồi.", variant: "destructive" });
                navigate("/auth?returnUrl=/help", { replace: true });
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-feedback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: formData.content,
                    email: user?.email ?? null,
                    type: formData.type,
                }),
            });

            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                throw new Error(errText || "Gửi phản hồi thất bại");
            }

            toast({ title: "Đã gửi phản hồi! 🎉", description: "Cảm ơn đóng góp của bạn." });
            setFormData({ content: "", type: "general" });
        } catch (error: any) {
            toast({ title: "Lỗi gửi phản hồi", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout mobileTitle="Trợ giúp & Phản hồi">
            <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Trợ giúp & Phản hồi</h1>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Feedback Form */}
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader>
                            <CardTitle>Gửi đánh giá & Phản hồi</CardTitle>
                            <CardDescription>Hãy cho chúng tôi biết trải nghiệm của bạn hoặc báo lỗi.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Loại phản hồi</label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn loại phản hồi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="general">Góp ý chung</SelectItem>
                                            <SelectItem value="book_issue">Báo lỗi sách</SelectItem>
                                            <SelectItem value="feature_request">Yêu cầu tính năng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nội dung</label>
                                    <Textarea
                                        placeholder="Mô tả chi tiết..."
                                        rows={5}
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="resize-none"
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Gửi phản hồi
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card className="shadow-sm bg-muted/30">
                        <CardHeader>
                            <CardTitle>Thông tin liên hệ</CardTitle>
                            <CardDescription>Liên hệ trực tiếp với đội ngũ hỗ trợ.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Email hỗ trợ</p>
                                    <p className="text-sm text-muted-foreground">{ADMIN_EMAIL}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Hotline</p>
                                    <p className="text-sm text-muted-foreground">1900 123 456</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Địa chỉ</p>
                                    <p className="text-sm text-muted-foreground">KTX Khu B, DHQG TP.HCM</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Feedback;
