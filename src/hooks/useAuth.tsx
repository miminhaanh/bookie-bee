import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const ADMIN_USER_ID = "0ed8a1d5-1dc9-436a-9f71-90968a1e7fab";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  getAllUsers: () => Promise<any[]>;
  banUser: (userId: string) => Promise<{ error: Error | null }>;
  unbanUser: (userId: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName || email.split("@")[0],
        },
      },
    });
    
    if (error) {
      return { error: error as Error };
    }

    // Create profile for new user
    if (data?.user) {
      try {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          email: email,
          display_name: displayName || email.split("@")[0],
          banned_at: null,
          current_streak: 0,
        });
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      } catch (err) {
        console.error("Error creating profile:", err);
      }
    }
    
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null, user: data?.user ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Force state update to ensure UI reacts immediately
    setUser(null);
    setSession(null);
  };

  const isAdmin = user?.id === ADMIN_USER_ID;

  const getAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, banned_at, created_at")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  };

  const banUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ banned_at: new Date().toISOString() })
        .eq("id", userId);
      
      if (error) {
        console.error("Ban user error:", error);
        throw error;
      }
      return { error: null };
    } catch (err: any) {
      console.error("Ban user error:", err);
      return { error: err as Error };
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ banned_at: null })
        .eq("id", userId);
      
      if (error) {
        console.error("Unban user error:", error);
        throw error;
      }
      return { error: null };
    } catch (err: any) {
      console.error("Unban user error:", err);
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut, getAllUsers, banUser, unbanUser }}>
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