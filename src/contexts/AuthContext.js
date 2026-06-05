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
        // Get session from Supabase (persists across refresh)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          try {
            const profileData = await db.getProfile(session.user.id);
            setProfile(profileData);
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
      try {
        const data = await auth.signIn(email, password);
        
        setUser(data.user);
        
        if (data?.user) {
          try {
            const profileData = await db.getProfile(data.user.id);
            setProfile(profileData);
          } catch (profileErr) {
            console.error('⚠️ Profile fetch failed:', profileErr);
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
    setProfile,        // ← ADDED: needed for Profile component
    refreshProfile,    // ← Already there
    
    isAdmin: () => {
      return profile?.role === 'admin';
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