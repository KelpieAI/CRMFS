import { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'chairman' | 'treasurer' | 'developer';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  profile_picture_url?: string;
  last_login_at?: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('📋 Fetching profile for:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching profile:', error);
        setProfile(null);
        return;
      }
      
      if (data) {
        console.log('✅ Profile loaded:', data.full_name);
        setProfile(data);
      } else {
        console.warn('⚠️ No profile found for user:', userId);
        setProfile(null);
      }
    } catch (error: any) {
      console.error('💥 Exception fetching profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        console.log('🔍 Checking existing session...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error('❌ Session error:', error);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Found existing session:', session.user.email);
          setUser(session.user);
          setLoading(false);
          // Fetch profile in background without blocking
          fetchProfile(session.user.id);
        } else {
          console.log('ℹ️ No existing session');
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('💥 Session check failed:', err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      console.log('🔔 Auth state changed:', _event, session?.user?.email);

      setUser(session?.user ?? null);
      setLoading(false); // Set loading false IMMEDIATELY
      
      // Fetch profile in background WITHOUT blocking
      if (session?.user) {
        fetchProfile(session.user.id); // Fire and forget - no await
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Sign out exception:', err);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
