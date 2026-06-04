import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;


const DEBUG = false;


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

// Mock data 
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
      archived: false,
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
      archived: false,
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
      archived: false,
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
      archived: false,
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
      archived: false,
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
  
  accessibility_settings: {},
  reading_progress: [],
  bookmarks: []
};

let mockUser = null;

// Database operations with error handling and mock fallback
export const db = {
  // Books
  getBooks: async (includeArchived = false) => {
    try {
      let query = supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!includeArchived) {
        query = query.or('archived.is.null,archived.eq.false');
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const processedData = (data || []).map(book => ({
        ...book,
        archived: book.archived === true
      }));
      
      if (!includeArchived) {
        return processedData.filter(b => !b.archived);
      }
      return processedData;
    } catch (e) {
      return mockData.books.filter(b => includeArchived ? true : !b.archived);
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
      return mockData.books.find(b => b.id === id);
    }
  },
  
  createBook: async (book) => {
    try {
      const bookData = { 
        ...book, 
        archived: false, 
        archived_at: null 
      };
      if (!bookData.isbn || bookData.isbn.trim() === '') {
        bookData.isbn = null;
      }

      const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (e) {
      const bookData = { ...book };
      if (!bookData.isbn || bookData.isbn.trim() === '') {
        bookData.isbn = `MOCK-${Date.now()}`;
      }
      
      const newBook = { 
        ...bookData, 
        id: generateMockId(), 
        created_at: new Date().toISOString(), 
        archived: false 
      };
      mockData.books.push(newBook);
      return newBook;
    }
  },
  
  updateBook: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data?.[0];
    } catch (e) {
      throw e;
    }
  },
  
  archiveBook: async (id) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .update({ 
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data?.[0];
    } catch (e) {
      const book = mockData.books.find(b => b.id === id);
      if (book) {
        book.archived = true;
        book.archived_at = new Date().toISOString();
      }
      return book;
    }
  },

  restoreBook: async (id) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .update({ 
          archived: false,
          archived_at: null
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data?.[0];
    } catch (e) {
      const book = mockData.books.find(b => b.id === id);
      if (book) {
        book.archived = false;
        book.archived_at = null;
      }
      return book;
    }
  },

  getArchivedBooks: async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('archived', true)
        .order('archived_at', { ascending: false });
      
      if (error) throw error;
      
      const archivedBooks = (data || []).map(book => ({
        ...book,
        archived: true
      }));
      
      return archivedBooks;
    } catch (e) {
      return mockData.books.filter(b => b.archived === true);
    }
  },
  
  // Book Formats
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
      return null;
    }
  },
  
  // Profiles
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data || mockData.profiles.find(p => p.id === userId);
    } catch (e) {
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
      return null;
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
      return data || [];
    } catch (e) {
      return [];
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
      return null;
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
      return data || [];
    } catch (e) {
      return [];
    }
  },
  
  updateReadingProgress: async (userId, bookId, progress) => {
    try {
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
          { onConflict: ['user_id', 'book_id'] }
        )
        .select();
      
      if (error) throw error;
      return data?.[0];
    } catch (e) {
      return null;
    }
  },
  
  // Accessibility Settings
  getAccessibilitySettings: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('accessibility_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (e) {
      return null;
    }
  },
  
  updateAccessibilitySettings: async (userId, settings) => {
    try {
      const updateData = {
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });
      
      const { data, error } = await supabase
        .from('accessibility_settings')
        .upsert(updateData, { onConflict: 'user_id' })
        .select();
      
      if (error) throw error;
      return data?.[0];
    } catch (e) {
      return null;
    }
  }
};

// Auth operations
export const auth = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  
  signUp: async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password, 
      options: { data: metadata } 
    });
    if (error) throw error;
    return data;
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
  
  onAuthStateChange: (callback) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }
};

// Storage operations
export const storage = {
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