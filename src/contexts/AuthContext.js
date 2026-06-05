import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('👤 Session found:', session.user.email);
          setUser(session.user);
          
          try {
            const profile = await db.getProfile(session.user.id);
            console.log('✅ Profile loaded:', profile?.full_name);
            setProfile(profile);
          } catch (profileErr) {
            console.error('❌ Profile fetch failed:', profileErr);
            setProfile(null);
          }
        } else {
          console.log('👤 No session found');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes (login, logout, password reset)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null);
          if (session?.user) {
            const profile = await db.getProfile(session.user.id);
            setProfile(profile);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Refresh profile function (used after profile updates)
  const refreshProfile = async () => {
    if (user) {
      try {
        const updatedProfile = await db.getProfile(user.id);
        setProfile(updatedProfile);
        return updatedProfile;
      } catch (error) {
        console.error('Failed to refresh profile:', error);
        return null;
      }
    }
    return null;
  };

  const value = {
    signUp: async (email, password, metadata) => {
      const data = await auth.signUp(email, password, metadata);
      return data;
    },
    
    signIn: async (email, password) => {
      const data = await auth.signIn(email, password);
      
      setUser(data.user);
      
      if (data?.user) {
        try {
          const profile = await db.getProfile(data.user.id);
          setProfile(profile);
        } catch (profileErr) {
          console.error('⚠️ Profile fetch failed:', profileErr);
          setProfile(null);
        }
      }
      
      return data;
    },
    
    signOut: async () => {
      await auth.signOut();
      setUser(null);
      setProfile(null);
    },
    
    user,
    profile,
    loading,
    setProfile,
    refreshProfile,
    
    isAdmin: () => profile?.role === 'admin',
    isLibrarian: () => profile?.role === 'librarian' || profile?.role === 'admin',
    hasRole: (role) => {
      if (role === 'admin') return profile?.role === 'admin';
      if (role === 'librarian') return profile?.role === 'librarian' || profile?.role === 'admin';
      return true;
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};