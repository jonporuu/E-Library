import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../services/supabaseClient';

const AccessibilityContext = createContext({});

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [fontSize, setFontSize] = useState(16);

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        try {
          const { data } = await db.getAccessibilitySettings(user.id);
          if (data) {
            setFontSize(data.font_size || 16);
          }
        } catch (error) {
          console.log('No settings found');
        }
      }
    };
    loadSettings();
  }, [user]);

  // Save settings when changed
  const updateFontSize = async (size) => {
    setFontSize(size);
    if (user) {
      try {
        await db.updateAccessibilitySettings(user.id, { font_size: size });
      } catch (error) {
        console.log('Failed to save settings');
      }
    }
  };

  // Apply font size to document
  useEffect(() => {
    document.documentElement.style.setProperty('--user-font-size', `${fontSize}px`);
  }, [fontSize]);

  const value = {
    fontSize,
    updateFontSize,
    speak: (text) => {
      console.log('TTS (disabled):', text);
    },
    stopSpeaking: () => {
    }
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};