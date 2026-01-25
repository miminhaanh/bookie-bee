import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Email admin được hardcode - chỉ email này mới có quyền admin
const ADMIN_EMAIL = "bookieebee@gmail.com";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra admin bằng hardcode email - đơn giản và nhanh
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    void checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Đánh dấu admin - chỉ chạy một lần khi admin login
  useEffect(() => {
    if (!user?.id || user.email !== ADMIN_EMAIL) return;

    const markAdmin = async () => {
      try {
        // Sử dụng upsert để tránh lỗi nếu profile chưa tồn tại
        const { error } = await supabase
          .from("profiles")
          .upsert(
            { user_id: user.id, is_admin: true },
            { onConflict: "user_id", ignoreDuplicates: false }
          );

        if (error) {
          // Ignore RLS errors - admin vẫn hoạt động dựa trên email check
          console.log("Admin profile update skipped (RLS):", error.code);
        }
      } catch (e) {
        // Ignore network errors
      }
    };

    void markAdmin();
  }, [user?.id, user?.email]);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split("@")[0],
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};