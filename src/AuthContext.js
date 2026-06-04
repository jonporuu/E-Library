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
    const initializeAuth = async () => {
      try {
        const { data: { user } } = await auth.getUser();
        
        setUser(user);
        
        if (user) {
          try {
            const profile = await db.getProfile(user.id);
            setProfile(profile);
          } catch (profileErr) {
            console.error('❌ Profile fetch failed:', profileErr);
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    signUp: async (email, password, metadata) => {
      const data = await auth.signUp(email, password, metadata);
      return data;
    },
    
    signIn: async (email, password) => {
      try {
        const data = await auth.signIn(email, password);

        
        setUser(data.user);
        
        if (data?.user) {
          try {
            const profile = await db.getProfile(data.user.id);
            setProfile(profile);
          } catch (profileErr) {
            console.error('⚠️ Profile fetch failed (continuing):', profileErr);
            setProfile(null);
          }
        }
        
        return data;
      } catch (err) {
        console.error('❌ SignIn FAILED:', err);
        throw err;
      }
    },
    
    signOut: async () => {
      await auth.signOut();
      setUser(null);
      setProfile(null);

    },
    
    user,
    profile,
    loading,
    isAdmin: () => {
      const isAdmin = profile?.role === 'admin';
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