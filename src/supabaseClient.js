import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY 
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
 
  getReadingProgress: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*, books(id, title, author, cover_url)')
        .eq('user_id', userId)
        .order('last_read', { ascending: false });
      
      if (error) throw error;
      if (DEBUG) console.log('📊 Progress fetched:', data?.length);
      return data || [];
    } catch (e) {
      console.error('❌ Error fetching progress:', e);
      return [];
    }
  },

  updateReadingProgress: async (userId, bookId, progress) => {
    try {
      if (DEBUG) console.log('📚 Saving progress:', { userId, bookId, progress });
      
      // Use upsert with the unique constraint
      const { data, error } = await supabase
        .from('reading_progress')
        .upsert(
          { 
            user_id: userId, 
            book_id: bookId, 
            last_position: progress.last_position,
            percentage: progress.percentage,
            last_read: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            onConflict: 'user_id,book_id',
            ignoreDuplicates: false 
          }
        )
        .select();
      
      if (error) {
        console.error('❌ Upsert error:', error);
        throw error;
      }
      
      if (DEBUG) console.log('✅ Progress saved:', data);
      return data?.[0];
    } catch (e) {
      console.error('❌ Progress save error:', e);
      // Fallback to mock for development
      if (DEBUG) console.log('⚠️ Using mock progress save');
      const existing = mockData.reading_progress.find(p => p.user_id === userId && p.book_id === bookId);
      if (existing) {
        Object.assign(existing, progress, { last_read: new Date().toISOString() });
        return existing;
      } else {
        const newProgress = { 
          id: Date.now().toString(), 
          user_id: userId, 
          book_id: bookId, 
          ...progress, 
          last_read: new Date().toISOString(),
          books: mockData.books.find(b => b.id === bookId)
        };
        mockData.reading_progress.push(newProgress);
        return newProgress;
      }
    }
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
  supabase, 
  
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