import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://lkcaqjdznezijmutmsyo.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrY2FxamR6bmV6aWptdXRtc3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzE5NDIsImV4cCI6MjA4NzEwNzk0Mn0.5m_hfLa1s2URrniymoR0BIFN_JesF0e1473P4iyfj_k'

// Create client with lock options disabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Disable the lock mechanism that causes the error
    lock: false,
    storageKey: 'sb-library-auth-token' // Custom storage key
  }
})

// Helper functions para sa database
export const db = {
  // Users/Profiles
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
    return { data, error }
  },

  // Accessibility Settings
  async getAccessibilitySettings(userId) {
    const { data, error } = await supabase
      .from('accessibility_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    return { data, error }
  },

  async saveAccessibilitySettings(userId, settings) {
    const { data, error } = await supabase
      .from('accessibility_settings')
      .upsert({ user_id: userId, ...settings })
    return { data, error }
  },

  // Books
  async getBooks() {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        book_formats (*)
      `)
    return { data, error }
  },

  async getBookById(bookId) {
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        book_formats (*)
      `)
      .eq('id', bookId)
      .single()
    return { data, error }
  },

  // Reading Progress
  async getReadingProgress(userId, bookId) {
    const { data, error } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .single()
    return { data, error }
  },

  async updateReadingProgress(userId, bookId, progress) {
    const { data, error } = await supabase
      .from('reading_progress')
      .upsert({ 
        user_id: userId, 
        book_id: bookId,
        ...progress,
        last_read: new Date()
      })
    return { data, error }
  },

  // Bookmarks
  async getBookmarks(userId) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        *,
        books (*)
      `)
      .eq('user_id', userId)
    return { data, error }
  },

  async addBookmark(userId, bookId, location, note = '') {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ 
        user_id: userId, 
        book_id: bookId, 
        location, 
        note 
      })
    return { data, error }
  }
}

// Add this export
export const storage = {
  supabase, // Export the client for storage operations
  
  uploadBookFile: async (file, bookId, format) => {
    const filePath = `${format}/${bookId}/${file.name}`;
    const { data, error } = await supabase.storage
      .from('book-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('book-files')
      .getPublicUrl(filePath);
    
    return { path: filePath, url: publicUrl };
  },
  
  uploadCoverImage: async (file, bookId) => {
    const filePath = `covers/${bookId}/${file.name}`;
    const { data, error } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('book-covers')
      .getPublicUrl(filePath);
    
    return { path: filePath, url: publicUrl };
  },
  
  deleteFile: async (bucket, path) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
    return true;
  }
};