import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  signUp: (email: string, password: string, metadata?: SignupMetadata) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

interface SignupMetadata {
  fullName: string;
  phone: string;
  city: string;
  username: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const checkUserStatus = async (userId: string) => {
    try {
      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      // Check approval status - default to true for regular customers
      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_approved')
        .eq('user_id', userId)
        .maybeSingle();
      
      // If no profile exists yet (trigger may not have run), default to approved for customers
      // Only admins should require explicit approval workflow
      const isAdminUser = !!roleData;
      const isApprovedUser = profileData ? (profileData.is_approved ?? true) : true;
      
      return {
        isAdmin: isAdminUser,
        isApproved: isApprovedUser
      };
    } catch (error) {
      console.error('Error checking user status:', error);
      return { isAdmin: false, isApproved: true }; // Default to approved for error cases
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(true);

        if (session?.user) {
          setTimeout(() => {
            checkUserStatus(session.user.id)
              .then(({ isAdmin, isApproved }) => {
                setIsAdmin(isAdmin);
                setIsApproved(isApproved);
              })
              .finally(() => setIsLoading(false));
          }, 0);
        } else {
          setIsAdmin(false);
          setIsApproved(false);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(true);

      if (session?.user) {
        checkUserStatus(session.user.id)
          .then(({ isAdmin, isApproved }) => {
            setIsAdmin(isAdmin);
            setIsApproved(isApproved);
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsAdmin(false);
        setIsApproved(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: SignupMetadata) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: metadata?.fullName,
          phone: metadata?.phone,
          city: metadata?.city,
          username: metadata?.username
        }
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsApproved(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isAdmin,
      isApproved,
      signUp,
      signIn,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
