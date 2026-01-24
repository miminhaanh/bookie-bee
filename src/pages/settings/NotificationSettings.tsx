import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Calendar, Zap, MessageCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const NotificationSettings = () => {
  const navigate = useNavigate();
  const [masterSwitch, setMasterSwitch] = useState(true);
  const [notifications, setNotifications] = useState({
    reminders: true,
    reactions: true,
    challenges: true,
    news: false,
  });

  const toggleAll = (val: boolean) => {
    setMasterSwitch(val);
    setNotifications({
      reminders: val,
      reactions: val,
      challenges: val,
      news: val,
    });
  };

  const toggleOne = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      // If any is off, master is off (or logic can be strict) - let's keep it simple
      return newState;
    });
  };

  const NotificationItem = ({ icon: Icon, color, title, desc, id }: any) => (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
      notifications[id as keyof typeof notifications] ? "bg-white shadow-sm border border-slate-100" : "opacity-60"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        color,
        notifications[id as keyof typeof notifications] ? "grayscale-0" : "grayscale"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <Switch
        checked={notifications[id as keyof typeof notifications]}
        onCheckedChange={() => toggleOne(id)}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-10 px-4 md:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 mt-4 md:mt-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
            className="rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-nunito font-bold text-slate-800">
              Thông báo
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Đừng bỏ lỡ những điều thú vị từ cộng đồng
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Master Switch */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-3xl text-white shadow-lg shadow-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Bật tất cả thông báo</h2>
              <p className="text-slate-300 text-sm">Nhận tin tức mới nhất từ Bookie Bee</p>
            </div>
            <Switch
              checked={masterSwitch}
              onCheckedChange={toggleAll}
              className="data-[state=checked]:bg-white data-[state=checked]:text-slate-800 border-2 border-transparent data-[state=unchecked]:bg-slate-600"
            />
          </div>

          {/* Notification Groups */}
          <div className="grid gap-2">
            <NotificationItem
              id="reminders"
              icon={Bell}
              color="bg-amber-100 text-amber-600"
              title="Nhắc nhở đọc sách"
              desc="Thông báo hàng ngày để duy trì streak"
            />
            <NotificationItem
              id="reactions"
              icon={MessageCircle}
              color="bg-pink-100 text-pink-600"
              title="Tương tác cộng đồng"
              desc="Khi có người like hoặc bình luận"
            />
            <NotificationItem
              id="challenges"
              icon={Zap}
              color="bg-purple-100 text-purple-600"
              title="Thử thách & Nhiệm vụ"
              desc="Cập nhật về các thử thách mới"
            />
            <NotificationItem
              id="news"
              icon={Mail}
              color="bg-blue-100 text-blue-600"
              title="Tin tức & Sự kiện"
              desc="Email về các tính năng mới"
            />
          </div>

          <div className="p-4 bg-blue-50/50 rounded-2xl flex items-center gap-3 text-sm text-blue-600 border border-blue-100/50">
            <Calendar className="w-4 h-4" />
            <span className="font-bold">Mẹo:</span> Bạn nên bật thông báo để không bị lỡ Streak!
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationSettings;