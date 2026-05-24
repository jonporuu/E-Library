import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/supabaseClient';

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
    console.log('🔍 AuthProvider mounted, checking session...');
    const initializeAuth = async () => {
      try {
        const { data: { user } } = await auth.getUser();
        console.log('👤 Initial user check:', user?.email || 'No user');
        
        setUser(user);
        
        if (user) {
          console.log('📡 Fetching profile for:', user.id);
          try {
            const profile = await db.getProfile(user.id);
            console.log('✅ Profile loaded:', profile);
            setProfile(profile);
          } catch (profileErr) {
            console.error('❌ Profile fetch failed:', profileErr);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        console.log('🏁 Auth init complete, setting loading false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    signUp: async (email, password, metadata) => {
      console.log('📝 Signup attempt:', email);
      const data = await auth.signUp(email, password, metadata);
      console.log('📝 Signup result:', data);
      return data;
    },
    
    signIn: async (email, password) => {
      console.log('🔐 SignIn START:', email);
      try {
        const data = await auth.signIn(email, password);
        console.log('✅ SignIn SUCCESS:', data?.user?.email);
        console.log('👤 Setting user state:', data?.user?.id);
        
        setUser(data.user);
        
        if (data?.user) {
          console.log('📡 Fetching profile for:', data.user.id);
          try {
            const profile = await db.getProfile(data.user.id);
            console.log('✅ Profile fetched:', profile);
            setProfile(profile);
          } catch (profileErr) {
            console.error('⚠️ Profile fetch failed (continuing):', profileErr);
            setProfile(null);
          }
        }
        
        console.log('🏁 SignIn complete, returning data');
        return data;
      } catch (err) {
        console.error('❌ SignIn FAILED:', err);
        throw err;
      }
    },
    
    signOut: async () => {
      console.log('🚪 Signing out...');
      await auth.signOut();
      setUser(null);
      setProfile(null);
      console.log('🚪 Signout complete');
    },
    
    user,
    profile,
    loading,
    isAdmin: () => {
      const isAdmin = profile?.role === 'admin';
      console.log('🔍 isAdmin check:', profile?.role, '→', isAdmin);
      return isAdmin;
    },
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