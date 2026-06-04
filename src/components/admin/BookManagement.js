import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { db, supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import BookUpload from './BookUpload';
import { useAuth } from '../../contexts/AuthContext';

const BookManagement = () => {
  const { speak } = useAccessibility();
  const { isAdmin, isLibrarian } = useAuth();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookFormats, setBookFormats] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  
  // Form data including files
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    reading_level: 'beginner',
    isbn: '',
    coverFile: null,
    epubFile: null,
    pdfFile: null
  });

  // Show snackbar notification
  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    speak(message);
    setTimeout(() => {
      setSnackbar({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const coverDropzone = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData(prev => ({ ...prev, coverFile: acceptedFiles[0] }));
      }
    }
  });

  const epubDropzone = useDropzone({
    accept: {
      'application/epub+zip': ['.epub']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData(prev => ({ ...prev, epubFile: acceptedFiles[0] }));
      }
    }
  });

  const pdfDropzone = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData(prev => ({ ...prev, pdfFile: acceptedFiles[0] }));
      }
    }
  });

  useEffect(() => {
    fetchBooks();
  }, [showArchived]);

  // Filter books when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchTerm, books]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = showArchived 
        ? await db.getArchivedBooks() 
        : await db.getBooks(false);
      setBooks(data);
      setFilteredBooks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load books');
      showSnackbar('Failed to load books', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBookFormats = async (bookId) => {
    try {
      const formats = await db.getBookFormats(bookId);
      setBookFormats(formats);
    } catch (err) {
      console.error('Error loading formats:', err);
      setBookFormats([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingBook) {
      if (!formData.coverFile) {
        showSnackbar('Please upload a cover image for the book', 'error');
        return;
      }
      
      if (!formData.epubFile && !formData.pdfFile) {
        showSnackbar('Please upload at least one book file (EPUB or PDF)', 'error');
        return;
      }
    }
    
    setUploading(true);

    try {
      if (!formData.title || !formData.author) {
        showSnackbar('Please fill in title and author', 'error');
        setUploading(false);
        return;
      }

      let isbnValue = formData.isbn;
      if (!isbnValue || isbnValue.trim() === '') {
        isbnValue = null;
      }

      let coverUrl = '';

      if (formData.coverFile) {
        const timestamp = Date.now();
        const safeFileName = formData.coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const coverPath = `${timestamp}_${safeFileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(coverPath, formData.coverFile, { upsert: true });
        
        if (uploadError) throw new Error(`Failed to upload cover: ${uploadError.message}`);
        
        const { data: { publicUrl } } = supabase.storage
          .from('book-covers')
          .getPublicUrl(coverPath);
        coverUrl = publicUrl;
      }

      let bookId;
      if (editingBook) {
        if (isbnValue) {
          const { data: existingBook } = await supabase
            .from('books')
            .select('id')
            .eq('isbn', isbnValue)
            .neq('id', editingBook.id)
            .maybeSingle();
          
          if (existingBook) {
            showSnackbar('This ISBN is already used by another book.', 'error');
            setUploading(false);
            return;
          }
        }
        
        const updateData = {
          title: formData.title,
          author: formData.author,
          description: formData.description,
          reading_level: formData.reading_level,
          isbn: isbnValue
        };
        
        if (coverUrl) updateData.cover_url = coverUrl;
        
        await db.updateBook(editingBook.id, updateData);
        bookId = editingBook.id;
        showSnackbar('Book updated successfully!', 'success');
      } else {
        if (isbnValue) {
          const { data: existingBook } = await supabase
            .from('books')
            .select('id')
            .eq('isbn', isbnValue)
            .maybeSingle();
          
          if (existingBook) {
            showSnackbar('A book with this ISBN already exists.', 'error');
            setUploading(false);
            return;
          }
        }
        
        const newBook = await db.createBook({
          title: formData.title,
          author: formData.author,
          description: formData.description,
          reading_level: formData.reading_level,
          isbn: isbnValue, 
          cover_url: coverUrl,
          status: 'available'
        });
        bookId = newBook.id;
        showSnackbar('Book created successfully!', 'success');
      }

      const timestamp = Date.now();
      
      if (formData.epubFile) {
        const safeFileName = formData.epubFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const epubPath = `${bookId}/epub/${timestamp}_${safeFileName}`;
        
        const { error: epubError } = await supabase.storage
          .from('book-files')
          .upload(epubPath, formData.epubFile);
        
        if (epubError) throw new Error(`Failed to upload EPUB: ${epubError.message}`);
        
        const { data: { publicUrl } } = supabase.storage
          .from('book-files')
          .getPublicUrl(epubPath);
        
        await db.addBookFormat({
          book_id: bookId,
          format_type: 'epub',
          file_url: publicUrl,
          file_size: formData.epubFile.size
        });
      }

      if (formData.pdfFile) {
        const safeFileName = formData.pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const pdfPath = `${bookId}/pdf/${timestamp}_${safeFileName}`;
        
        const { error: pdfError } = await supabase.storage
          .from('book-files')
          .upload(pdfPath, formData.pdfFile);
        
        if (pdfError) throw new Error(`Failed to upload PDF: ${pdfError.message}`);
        
        const { data: { publicUrl } } = supabase.storage
          .from('book-files')
          .getPublicUrl(pdfPath);
        
        await db.addBookFormat({
          book_id: bookId,
          format_type: 'pdf',
          file_url: publicUrl,
          file_size: formData.pdfFile.size
        });
      }

      setShowModal(false);
      setEditingBook(null);
      resetForm();
      await fetchBooks();
    } catch (err) {
      console.error('Error saving book:', err);
      showSnackbar(`Failed to save book: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description || '',
      reading_level: book.reading_level,
      isbn: book.isbn || '',
      coverFile: null,
      epubFile: null,
      pdfFile: null
    });
    loadBookFormats(book.id);
    setShowModal(true);
  };

  const handleArchive = async (id, bookTitle) => {
    if (!window.confirm(`Are you sure you want to archive "${bookTitle}"?\n\nIt will be hidden from users but can be restored later.`)) return;
    
    try {
      await db.archiveBook(id);
      showSnackbar(`"${bookTitle}" archived successfully`, 'success');
      await fetchBooks();
    } catch (err) {
      showSnackbar('Failed to archive book', 'error');
    }
  };

  const handleRestore = async (id, bookTitle) => {
    if (!window.confirm(`Restore "${bookTitle}" back to the active library?`)) return;
    
    try {
      await db.restoreBook(id);
      showSnackbar(`"${bookTitle}" restored successfully`, 'success');
      await fetchBooks();
    } catch (err) {
      showSnackbar('Failed to restore book', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      reading_level: 'beginner',
      isbn: '',
      coverFile: null,
      epubFile: null,
      pdfFile: null
    });
    setBookFormats([]);
  };

  const handleBulkUploadComplete = () => {
    setShowBulkUpload(false);
    fetchBooks(); 
    showSnackbar('Books uploaded successfully!', 'success');
  };

  const handleBulkUploadCancel = () => {
    setShowBulkUpload(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBooks} />;

  return (
    <div className="page-container">
      {/* Snackbar Notification */}
      {snackbar.show && (
        <div className="snackbar" style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: snackbar.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{snackbar.type === 'success' ? '✅' : '❌'}</span>
          <span>{snackbar.message}</span>
        </div>
      )}

      <div className="admin-header">
        <h1>Book Management</h1>
        <p>{showArchived ? 'Viewing archived books' : 'Manage library catalog'}</p>
      </div>

      {/* Search Bar & Archive Toggle */}
      <div className="search-container" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', maxWidth: '400px', flex: 1 }}>
            <input
              type="text"
              placeholder="🔍 Search by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Archive Toggle Button */}
          <button 
            onClick={() => {
              setShowArchived(!showArchived);
              setSearchTerm('');
            }}
            className="btn"
            style={{
              backgroundColor: showArchived ? '#f59e0b' : '#64748b',
              color: 'white',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
            aria-pressed={showArchived}
          >
            <span>{showArchived ? '📁' : '📦'}</span>
            {showArchived ? 'View Active Books' : 'View Archived Books'}
          </button>
        </div>
        <p style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
          {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} found
          {showArchived && ' (archived)'}
        </p>
      </div>

      <div className="admin-actions-bar">
        <div className="action-buttons">
          <button 
            onClick={() => { 
              resetForm(); 
              setEditingBook(null); 
              setShowModal(true); 
            }}
            className="btn btn-primary"
            disabled={showArchived}
          >
            + Add Single Book
          </button>
          <button 
            onClick={() => setShowBulkUpload(true)}
            className="btn btn-secondary"
            disabled={showArchived}
          >
            📚 Bulk Upload Books
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table" role="table" aria-label={showArchived ? 'Archived books list' : 'Active books list'}>
          <thead>
            <tr>
              <th scope="col">Cover</th>
              <th scope="col">Title</th>
              <th scope="col">Author</th>
              <th scope="col">Level</th>
              <th scope="col">Status</th>
              {showArchived && <th scope="col">Archived Date</th>}
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map(book => (
              <tr key={book.id} style={book.archived ? { opacity: '0.7', backgroundColor: '#fef3c7' } : {}}>
                <td>
                  <img 
                    src={book.cover_url} 
                    alt="" 
                    className="table-cover"
                    width="50"
                    height="70"
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                </td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>
                  <span className={`level-badge level-${book.reading_level}`}>
                    {book.reading_level}
                  </span>
                </td>
                <td>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: book.archived ? '#fef3c7' : '#d1fae5',
                    color: book.archived ? '#92400e' : '#065f46'
                  }}>
                    {book.archived ? '📦 Archived' : book.status || 'Available'}
                  </span>
                </td>
                {showArchived && (
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {book.archived_at ? new Date(book.archived_at).toLocaleDateString() : 'N/A'}
                  </td>
                )}
                <td>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {!book.archived && (
                      <button 
                        onClick={() => handleEdit(book)}
                        className="btn btn-secondary btn-sm"
                        title="Edit book"
                      >
                        ✏️ Edit
                      </button>
                    )}
                    
                    {book.archived ? (
                      <button 
                        onClick={() => handleRestore(book.id, book.title)}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none'
                        }}
                        title="Restore book"
                      >
                        ↩️ Restore
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleArchive(book.id, book.title)}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none'
                        }}
                        title="Archive book"
                      >
                        📦 Archive
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredBooks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            {showArchived 
              ? 'No archived books found' 
              : `No books found matching "${searchTerm}"`
            }
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2 id="modal-title">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="modal-close"
                disabled={uploading}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled={uploading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="author">Author *</label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    required
                    disabled={uploading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  disabled={uploading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reading_level">Reading Level *</label>
                  <select
                    id="reading_level"
                    name="reading_level"
                    value={formData.reading_level}
                    onChange={handleChange}
                    required
                    disabled={uploading}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="isbn">ISBN (Optional)</label>
                  <input
                    type="text"
                    id="isbn"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    disabled={uploading}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cover Image {!editingBook && <span style={{ color: '#ef4444' }}>* (Required)</span>}</label>
                <div
                  {...coverDropzone.getRootProps()}
                  className={`dropzone ${coverDropzone.isDragActive ? 'active' : ''}`}
                >
                  <input {...coverDropzone.getInputProps()} disabled={uploading} />
                  <div className="dropzone-content">
                    {formData.coverFile ? (
                      <div className="file-preview">
                        <span className="file-icon">🖼️</span>
                        <span className="file-name">{formData.coverFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData(prev => ({ ...prev, coverFile: null }));
                          }}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            marginLeft: '8px'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-placeholder">
                        <span className="drop-icon">📸</span>
                        <p>Drag & drop a cover image here, or click to select</p>
                        <small>Supports: JPG, PNG, GIF, WebP</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Book Files {!editingBook && <small style={{ color: '#ef4444'  }}>(At least one book file (EPUB or PDF) is required)</small>}</h3>
                
                <div className="form-group file-upload-group">
                  <label>EPUB File</label>
                  <div
                    {...epubDropzone.getRootProps()}
                    className={`dropzone ${epubDropzone.isDragActive ? 'active' : ''}`}
                  >
                    <input {...epubDropzone.getInputProps()} disabled={uploading} />
                    <div className="dropzone-content">
                      {formData.epubFile ? (
                        <div className="file-preview">
                          <span className="file-icon">📖</span>
                          <span className="file-name">{formData.epubFile.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, epubFile: null }));
                            }}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              marginLeft: '8px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="dropzone-placeholder">
                          <span className="drop-icon">📖</span>
                          <p>Drag & drop an EPUB file here, or click to select</p>
                          <small>Supports: .epub files</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group file-upload-group">
                  <label>PDF File</label>
                  <div
                    {...pdfDropzone.getRootProps()}
                    className={`dropzone ${pdfDropzone.isDragActive ? 'active' : ''}`}
                  >
                    <input {...pdfDropzone.getInputProps()} disabled={uploading} />
                    <div className="dropzone-content">
                      {formData.pdfFile ? (
                        <div className="file-preview">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{formData.pdfFile.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, pdfFile: null }));
                            }}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              marginLeft: '8px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="dropzone-placeholder">
                          <span className="drop-icon">📄</span>
                          <p>Drag & drop a PDF file here, or click to select</p>
                          <small>Supports: .pdf files</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {editingBook && bookFormats.length > 0 && (
                <div className="form-section">
                  <h3>Existing Files</h3>
                  <div className="existing-files">
                    {bookFormats.map(format => (
                      <div key={format.id} className="file-item">
                        <span className="file-type">{format.format_type.toUpperCase()}</span>
                        <a 
                          href={format.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={uploading || (!editingBook && (!formData.coverFile || (!formData.epubFile && !formData.pdfFile)))}
                >
                  {uploading ? 'Uploading...' : (editingBook ? 'Update Book' : 'Add Book')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="bulk-upload-title">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2 id="bulk-upload-title">Bulk Book Upload</h2>
              <button 
                onClick={handleBulkUploadCancel}
                className="modal-close"
                aria-label="Close bulk upload"
              >
                ×
              </button>
            </div>
            <BookUpload onUploadComplete={handleBulkUploadComplete} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagement;