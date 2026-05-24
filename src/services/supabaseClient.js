import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Debug mode - set to false in production
<<<<<<< HEAD
const DEBUG = false;
=======
const DEBUG = true;
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95

// Generate a simple UUID-like string for mock data
const generateMockId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Mock data for development fallback
const mockData = {
  books: [
    {
      id: '1',
      title: "The Old Man and the Sea",
      author: "Ernest Hemingway",
      description: "A story of an old fisherman's epic struggle with a giant marlin.",
      reading_level: "intermediate",
      status: "available",
      cover_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400",
      isbn: "978-0684801223",
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: "Noli Me Tangere",
      author: "Jose Rizal",
      description: "A foundational novel in Philippine literature exposing Spanish colonial injustices.",
      reading_level: "advanced",
      status: "available",
      cover_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",
      isbn: "978-0143039693",
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      title: "Stories of Lola Basyang",
      author: "Severino Reyes",
      description: "Classic Filipino children's stories full of magic and moral lessons.",
      reading_level: "beginner",
      status: "available",
      cover_url: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=400",
      isbn: "978-9715083993",
      created_at: new Date().toISOString()
    },
    {
      id: '4',
      title: "The Little Prince",
      author: "Antoine de Saint-Exupéry",
      description: "A poetic tale about a young prince who travels the universe.",
      reading_level: "beginner",
      status: "available",
      cover_url: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400",
      isbn: "978-0156012195",
      created_at: new Date().toISOString()
    },
    {
      id: '5',
      title: "A Brief History of Time",
      author: "Stephen Hawking",
      description: "An exploration of cosmology and the nature of time and space.",
      reading_level: "advanced",
      status: "available",
      cover_url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400",
      isbn: "978-0553380163",
      created_at: new Date().toISOString()
    }
  ],
  
  profiles: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      full_name: "Admin User",
      role: "admin",
      email: "admin@elibrary.com",
      disability_type: null,
      input_preference: "standard",
      created_at: new Date().toISOString()
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      full_name: "John Librarian",
      role: "librarian",
      email: "librarian@elibrary.com",
      disability_type: null,
      input_preference: "standard",
      created_at: new Date().toISOString()
    },
    {
      id: '321242e2-9a87-4ede-bdea-be4bd153f2b0',
      full_name: "Test User",
      role: "user",
      email: "test@user.com",
      disability_type: "visual",
      input_preference: "voice",
      created_at: new Date().toISOString()
    }
  ],
  
  accessibility_settings: {
    '11111111-1111-1111-1111-111111111111': {
      user_id: '11111111-1111-1111-1111-111111111111',
      font_size: 16,
      font_family: "'Open Sans', sans-serif",
      line_spacing: '1.6',
      high_contrast: false,
      text_to_speech: false,
      reading_guide: false,
      reduce_motion: false
    }
  },
  
  reading_progress: [],
  bookmarks: []
};

// Mock authentication state
let mockUser = null;

// Database operations with error handling and mock fallback
export const db = {
  // Books
  getBooks: async () => {
    try {
      if (DEBUG) console.log('📚 Fetching books...');
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (DEBUG) console.log('✅ Books fetched:', data?.length);
      return data || mockData.books;
    } catch (e) {
      if (DEBUG) console.log('⚠️ Using mock books:', e.message);
      return mockData.books;
    }
  },
  
  getBookById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*, book_formats(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data || mockData.books.find(b => b.id === id);
    } catch (e) {
      if (DEBUG) console.log('⚠️ Using mock book:', id);
      return mockData.books.find(b => b.id === id);
    }
  },
  
  createBook: async (book) => {
    try {
      // Handle ISBN - make it optional or generate unique one
      const bookData = { ...book };
      if (!bookData.isbn || bookData.isbn.trim() === '') {
        bookData.isbn = null; // Allow null ISBNs
      }

      const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (e) {
      if (DEBUG) console.log('⚠️ Mock create book:', e.message);
      
      // For mock data, handle ISBN duplicates
      const bookData = { ...book };
      if (!bookData.isbn || bookData.isbn.trim() === '') {
        bookData.isbn = `MOCK-${Date.now()}`; // Generate unique mock ISBN
      }
      
      const newBook = { ...bookData, id: generateMockId(), created_at: new Date().toISOString() };
      mockData.books.push(newBook);
      return newBook;
    }
  },
  
  updateBook: async (id, updates) => {
<<<<<<< HEAD
  try {
    console.log('Updating book:', id, updates);
    const { data, error } = await supabase
      .from('books')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Update error:', error);
      throw error;
    }
    
    console.log('Update successful:', data);
    return data?.[0];
  } catch (e) {
    console.error('Error in updateBook:', e);
    throw e;
  }
},
=======
    try {
      const { data, error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (e) {
      if (DEBUG) console.log('⚠️ Mock update book:', id);
      const index = mockData.books.findIndex(b => b.id === id);
      if (index !== -1) {
        mockData.books[index] = { ...mockData.books[index], ...updates };
        return mockData.books[index];
      }
    }
  },
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
  
  deleteBook: async (id) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (e) {
      mockData.books = mockData.books.filter(b => b.id !== id);
      return true;
    }
  },
  
  // Book Formats (for file storage)
  getBookFormats: async (bookId) => {
    try {
      const { data, error } = await supabase
        .from('book_formats')
        .select('*')
        .eq('book_id', bookId);
      
      if (error) throw error;
      return data || [];
    } catch (e) {
      return [];
    }
  },
  
  addBookFormat: async (format) => {
    try {
      const { data, error } = await supabase
        .from('book_formats')
        .insert([format])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (e) {
      console.error('Error adding book format:', e);
      return null;
    }
  },
  
  // Profiles
  getProfile: async (userId) => {
    try {
      if (DEBUG) console.log('🔍 Fetching profile:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (DEBUG) console.log('✅ Profile fetched:', data?.email);
      return data || mockData.profiles.find(p => p.id === userId);
    } catch (e) {
      if (DEBUG) console.log('⚠️ Using mock profile:', userId);
      return mockData.profiles.find(p => p.id === userId);
    }
  },
  
  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (e) {
      const index = mockData.profiles.findIndex(p => p.id === userId);
      if (index !== -1) {
        mockData.profiles[index] = { ...mockData.profiles[index], ...updates };
        return mockData.profiles[index];
      }
    }
  },
  
  getAllProfiles: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || mockData.profiles;
    } catch (e) {
      return mockData.profiles;
    }
  },
  
  // Bookmarks
  getBookmarks: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*, books(id, title, author, cover_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || mockData.bookmarks.filter(b => b.user_id === userId);
    } catch (e) {
      return mockData.bookmarks.filter(b => b.user_id === userId);
    }
  },
  
  createBookmark: async (bookmark) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert([bookmark])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (e) {
      const newBookmark = { 
        ...bookmark, 
        id: Date.now().toString(), 
        created_at: new Date().toISOString(),
        books: mockData.books.find(b => b.id === bookmark.book_id)
      };
      mockData.bookmarks.push(newBookmark);
      return newBookmark;
    }
  },
  
  deleteBookmark: async (id) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (e) {
      mockData.bookmarks = mockData.bookmarks.filter(b => b.id !== id);
      return true;
    }
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
      return data || mockData.reading_progress.filter(p => p.user_id === userId);
    } catch (e) {
      return mockData.reading_progress.filter(p => p.user_id === userId);
    }
  },
  
  updateReadingProgress: async (userId, bookId, progress) => {
    try {
      if (DEBUG) console.log('📚 Saving progress:', { userId, bookId, progress });
      
      const { data, error } = await supabase
        .from('reading_progress')
        .upsert(
          { 
            user_id: userId, 
            book_id: bookId, 
            ...progress, 
            last_read: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            onConflict: ['user_id', 'book_id'],
            ignoreDuplicates: false
          }
        )
        .select();
      
      if (error) {
        console.error('❌ Progress save error:', error);
        throw error;
      }
      
      if (DEBUG) console.log('✅ Progress saved:', data);
      return data?.[0];
    } catch (e) {
      if (DEBUG) console.log('⚠️ Mock progress save:', e.message);
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
  
  // Accessibility Settings 
  getAccessibilitySettings: async (userId) => {
    try {
      if (DEBUG) console.log('🔍 Getting settings for:', userId);
      
      const { data, error } = await supabase
        .from('accessibility_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Settings fetch error:', error);
        throw error;
      }
      
      if (DEBUG) console.log('✅ Settings fetched:', data ? 'found' : 'not found');
      return data || mockData.accessibility_settings[userId] || null;
    } catch (e) {
      if (DEBUG) console.log('⚠️ Mock settings fallback:', e.message);
      return mockData.accessibility_settings[userId] || null;
    }
  },
  
  updateAccessibilitySettings: async (userId, settings) => {
    try {
      if (DEBUG) console.log('💾 Saving settings for:', userId, settings);
      
      const updateData = {
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });
      
      const { data, error } = await supabase
        .from('accessibility_settings')
        .upsert(updateData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select();
      
      if (error) {
        console.error('❌ Settings save error:', error);
        throw error;
      }
      
      if (DEBUG) console.log('✅ Settings saved:', data);
      return data?.[0];
    } catch (e) {
      if (DEBUG) console.log('⚠️ Mock settings save:', e.message);
      const existing = mockData.accessibility_settings[userId] || {};
      mockData.accessibility_settings[userId] = { 
        ...existing, 
        ...settings, 
        user_id: userId 
      };
      return mockData.accessibility_settings[userId];
    }
  }
};

// Auth operations with error handling
export const auth = {
  signIn: async (email, password) => {
    if (DEBUG) console.log('🔐 Login attempt:', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        if (DEBUG) console.error('❌ Supabase auth error:', error.message);
        throw error;
      }
      
      if (DEBUG) console.log('✅ Login successful:', data.user?.email);
      mockUser = data.user;
      return data;
    } catch (e) {
      if (DEBUG) console.log('⚠️ Trying mock fallback...');
      
      // Check mock users
      const profile = mockData.profiles.find(p => p.email === email);
      if (profile && (password === 'password' || password === 'admin123')) {
        mockUser = { 
          id: profile.id, 
          email: profile.email,
          user_metadata: { 
            full_name: profile.full_name,
            role: profile.role 
          }
        };
        if (DEBUG) console.log('✅ Mock login successful:', profile.email);
        return { user: mockUser, session: { user: mockUser } };
      }
      
      throw new Error(e.message || 'Invalid credentials');
    }
  },
  
  signUp: async (email, password, metadata) => {
    if (DEBUG) console.log('📝 Signup attempt:', email);
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
        options: { data: metadata } 
      });
      
      if (error) {
        if (DEBUG) console.error('❌ Signup error:', error);
        throw error;
      }
      
      if (DEBUG) console.log('✅ Signup successful:', data.user?.email);
      return data;
    } catch (e) {
      if (DEBUG) console.log('⚠️ Mock signup fallback');
      
      // Create mock user
      const newUser = { 
        id: Date.now().toString(), 
        email,
        ...metadata
      };
      
      mockData.profiles.push({
        id: newUser.id,
        full_name: metadata.full_name,
        role: 'user',
        email: email,
        disability_type: metadata.disability_type,
        input_preference: metadata.input_preference,
        created_at: new Date().toISOString()
      });
      
      mockUser = newUser;
      return { user: newUser, session: { user: newUser } };
    }
  },
  
  signOut: async () => {
    if (DEBUG) console.log('🚪 Signing out...');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (e) {
      if (DEBUG) console.log('⚠️ Mock signout');
    }
    
    mockUser = null;
    if (DEBUG) console.log('✅ Signout complete');
  },
  
  getUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (e) {
      return mockUser;
    }
  },
  
  onAuthStateChange: (callback) => {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
      return subscription;
    } catch (e) {
      return { unsubscribe: () => {} };
    }
  }
};

// Storage operations for file uploads
export const storage = {
  uploadBookFile: async (file, bookId, format) => {
    try {
      const filePath = `${format}/${bookId}/${file.name}`;
      const { data, error } = await supabase.storage
        .from('book-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('book-files')
        .getPublicUrl(filePath);
      
      return { path: filePath, url: publicUrl };
    } catch (e) {
      console.error('Upload error:', e);
      throw e;
    }
  },
  
  uploadCoverImage: async (file, bookId) => {
    try {
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
    } catch (e) {
      console.error('Cover upload error:', e);
      throw e;
    }
  },
  
  deleteFile: async (bucket, path) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('Delete error:', e);
      return false;
    }
  }
};