import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().email("Email không hợp lệ");
const passwordSchema = z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự");

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [beeFlying, setBeeFlying] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user && !beeFlying) {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate, beeFlying]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Đăng nhập thất bại",
              description: "Email hoặc mật khẩu không đúng",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Đăng nhập thất bại",
              description: error.message,
              variant: "destructive",
            });
          }
          setIsSubmitting(false);
        } else {
          // Success - trigger bee flying animation
          setBeeFlying(true);
          toast({
            title: "Chào mừng trở lại! 🐝",
            description: "Đăng nhập thành công",
          });
          // Wait for animation then navigate
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1500);
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Email đã tồn tại",
              description: "Email này đã được đăng ký. Hãy thử đăng nhập.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Đăng ký thất bại",
              description: error.message,
              variant: "destructive",
            });
          }
          setIsSubmitting(false);
        } else {
          // Success - trigger bee flying animation
          setBeeFlying(true);
          toast({
            title: "Chào mừng đến Bookie Bee! 🐝",
            description: "Tài khoản đã được tạo thành công",
          });
          // Wait for animation then navigate
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1500);
        }
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-soft-pink via-cream to-peach">
        <Loader2 className="h-8 w-8 animate-spin text-warm-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-soft-pink via-cream to-peach overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 text-6xl opacity-20 animate-float">📚</div>
        <div className="absolute top-40 right-20 text-5xl opacity-20 animate-float" style={{ animationDelay: '1s' }}>🌸</div>
        <div className="absolute bottom-20 left-1/4 text-4xl opacity-20 animate-float" style={{ animationDelay: '2s' }}>📖</div>
        <div className="absolute bottom-40 right-1/3 text-5xl opacity-20 animate-float" style={{ animationDelay: '0.5s' }}>✨</div>
        <div className="absolute top-1/3 left-1/3 text-3xl opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>🍯</div>
      </div>

      {/* Bee Flying Animation Overlay */}
      {beeFlying && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-soft-pink via-cream to-peach flex items-center justify-center">
          <div className="relative">
            {/* Flying bee */}
            <div className="text-6xl animate-bee-fly">
              🐝
            </div>
            {/* Trail effect */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 flex gap-2">
              <span className="text-2xl opacity-60 animate-fade-trail" style={{ animationDelay: '0.1s' }}>✨</span>
              <span className="text-xl opacity-40 animate-fade-trail" style={{ animationDelay: '0.2s' }}>✨</span>
              <span className="text-lg opacity-20 animate-fade-trail" style={{ animationDelay: '0.3s' }}>✨</span>
            </div>
          </div>
          <p className="absolute bottom-1/3 text-lg font-medium text-warm-brown animate-pulse">
            Đang bay đến thư viện...
          </p>
        </div>
      )}

      <div className={`w-full max-w-md relative z-10 transition-all duration-500 ${beeFlying ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br from-warm-pink to-coral flex items-center justify-center shadow-float mx-auto mb-4 transition-transform duration-500 ${beeFlying ? 'scale-0' : 'scale-100 hover:scale-105'}`}>
            <span className="text-5xl">🐝</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground font-nunito">
            Bookie<span className="text-warm-pink"> Bee</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-nunito">
            {isLogin ? "Chào mừng trở lại! 🍯" : "Tạo tài khoản mới 🌸"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card rounded-3xl p-8 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium font-nunito">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className="pl-11 h-12 rounded-xl bg-muted/50 border-border/50 font-nunito"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive font-nunito">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium font-nunito">
                Mật khẩu
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className="pl-11 pr-11 h-12 rounded-xl bg-muted/50 border-border/50 font-nunito"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive font-nunito">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-warm-pink to-coral hover:opacity-90 font-nunito"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  {isLogin ? "Đăng nhập" : "Đăng ký"}
                  <span className="ml-2">🐝</span>
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground font-nunito">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="ml-2 text-warm-pink font-semibold hover:underline"
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "📚", label: "Thư viện riêng" },
            { icon: "🍯", label: "Cộng đồng" },
            { icon: "📊", label: "Theo dõi tiến độ" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-muted-foreground font-medium font-nunito">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CSS for bee animation */}
      <style>{`
        @keyframes bee-fly {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(100px, -50px) rotate(15deg);
          }
          50% {
            transform: translate(200px, -20px) rotate(-10deg);
          }
          75% {
            transform: translate(400px, -80px) rotate(20deg);
          }
          100% {
            transform: translate(800px, -200px) rotate(0deg) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes fade-trail {
          0% {
            opacity: 0.6;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(-50px);
          }
        }
        
        .animate-bee-fly {
          animation: bee-fly 1.5s ease-in-out forwards;
        }
        
        .animate-fade-trail {
          animation: fade-trail 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Auth;