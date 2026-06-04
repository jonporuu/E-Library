import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db, supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useDropzone } from 'react-dropzone';

const LibrarianDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalBookmarks: 0
  });
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  // Dropzone hooks
  const coverDropzone = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData(prev => ({ ...prev, coverFile: acceptedFiles[0] }));
      }
    }
  });

  const epubDropzone = useDropzone({
    accept: { 'application/epub+zip': ['.epub'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData(prev => ({ ...prev, epubFile: acceptedFiles[0] }));
      }
    }
  });

  const pdfDropzone = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFormData(prev => ({ ...prev, pdfFile: acceptedFiles[0] }));
      }
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const books = await db.getBooks();
      const users = await db.getAllProfiles();
      const bookmarks = await db.getBookmarks(profile?.id);
      
      setStats({
        totalBooks: books?.length || 0,
        totalUsers: users?.length || 0,
        totalBookmarks: bookmarks?.length || 0
      });
      
      setRecentBooks(books?.slice(0, 5) || []);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate cover image is required
    if (!formData.coverFile) {
      alert('Please upload a cover image for the book');
      return;
    }

    // Validate at least one book file (EPUB or PDF) is required
    if (!formData.epubFile && !formData.pdfFile) {
      alert('Please upload at least one book file (EPUB or PDF)');
      return;
    }

    setUploading(true);

    try {
      if (!formData.title || !formData.author) {
        alert('Please fill in title and author');
        setUploading(false);
        return;
      }

      let isbnValue = formData.isbn;
      if (!isbnValue || isbnValue.trim() === '') {
        isbnValue = null;
      }

      // Upload cover file
      const timestamp = Date.now();
      const safeFileName = formData.coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const coverPath = `${timestamp}_${safeFileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('book-covers')
        .upload(coverPath, formData.coverFile, { upsert: true });
      
      if (uploadError) {
        throw new Error(`Failed to upload cover: ${uploadError.message}`);
      }
      
      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from('book-covers')
        .getPublicUrl(coverPath);

      // Create book
      const newBook = await db.createBook({
        title: formData.title,
        author: formData.author,
        description: formData.description,
        reading_level: formData.reading_level,
        isbn: isbnValue,
        cover_url: coverUrl,
        status: 'available'
      });

      if (!newBook?.id) {
        throw new Error('Failed to create book record');
      }

      // Upload EPUB if selected
      if (formData.epubFile) {
        const epubTimestamp = Date.now();
        const epubSafeFileName = formData.epubFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const epubPath = `${newBook.id}/epub/${epubTimestamp}_${epubSafeFileName}`;
        
        const { error: epubError } = await supabase.storage
          .from('book-files')
          .upload(epubPath, formData.epubFile);
        
        if (epubError) {
          console.error('EPUB upload error:', epubError);
          throw new Error(`Failed to upload EPUB: ${epubError.message}`);
        }
        
        const { data: { publicUrl: epubUrl } } = supabase.storage
          .from('book-files')
          .getPublicUrl(epubPath);
        
        await db.addBookFormat({
          book_id: newBook.id,
          format_type: 'epub',
          file_url: epubUrl,
          file_size: formData.epubFile.size
        });
      }

      // Upload PDF if selected
      if (formData.pdfFile) {
        const pdfTimestamp = Date.now();
        const pdfSafeFileName = formData.pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const pdfPath = `${newBook.id}/pdf/${pdfTimestamp}_${pdfSafeFileName}`;
        
        const { error: pdfError } = await supabase.storage
          .from('book-files')
          .upload(pdfPath, formData.pdfFile);
        
        if (pdfError) {
          console.error('PDF upload error:', pdfError);
          throw new Error(`Failed to upload PDF: ${pdfError.message}`);
        }
        
        const { data: { publicUrl: pdfUrl } } = supabase.storage
          .from('book-files')
          .getPublicUrl(pdfPath);
        
        await db.addBookFormat({
          book_id: newBook.id,
          format_type: 'pdf',
          file_url: pdfUrl,
          file_size: formData.pdfFile.size
        });
      }

      alert('Book created successfully!');
      setShowAddBookModal(false);
      resetForm();
      fetchDashboardData(); 
      
    } catch (err) {
      console.error('Error saving book:', err);
      alert(`Failed to save book: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchDashboardData} />;

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>Librarian Dashboard</h1>
        <p>Welcome back, {profile?.full_name || 'Librarian'}!</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">📚</span>
          <span className="stat-value">{stats.totalBooks}</span>
          <span className="stat-label">Total Books </span>
          <Link to="/dashboard/books" className="stat-link">Browse →</Link>
        </div>
        
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <span className="stat-value">{stats.totalUsers}</span>
          <span className="stat-label">Library Members </span>
          <span className="stat-link">{stats.totalUsers} total</span>
        </div>
        
        <div className="stat-card">
          <span className="stat-icon">🔖</span>
          <span className="stat-value">{stats.totalBookmarks}</span>
          <span className="stat-label">Bookmarks </span>
          <span className="stat-link">Across library</span>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button onClick={() => setShowAddBookModal(true)} className="action-card">
            <span className="action-icon">➕</span>
            <span className="action-text">Add New Book</span>
          </button>
          
          <button onClick={() => navigate('/admin/books')} className="action-card">
            <span className="action-icon">📚</span>
            <span className="action-text">Manage Books</span>
          </button>
          
          <button onClick={() => navigate('/dashboard/books')} className="action-card">
            <span className="action-icon">👥</span>
            <span className="action-text">Browse Library</span>
          </button>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Recently Added Books</h2>
        <div className="continue-reading-list">
          {recentBooks.map(book => (
            <Link key={book.id} to={`/dashboard/books/${book.id}`} className="continue-reading-item">
              <div>
                <h3>{book.title}</h3>
                <p>by {book.author}</p>
              </div>
              <span className="continue-btn">View →</span>
            </Link>
          ))}
          {recentBooks.length === 0 && <p>No books added yet</p>}
        </div>
      </section>

      <aside className="accessibility-tip">
        <h3>💡 Librarian Tips</h3>
        <ul>
          <li>Click "Add New Book" to upload EPUB, PDF, or cover images</li>
          <li>Browse and manage books from the Books page</li>
          <li>Monitor library activity from this dashboard</li>
        </ul>
      </aside>

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => !uploading && setShowAddBookModal(false)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Book</h2>
              <button 
                onClick={() => setShowAddBookModal(false)} 
                className="modal-close"
                disabled={uploading}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              {/* Basic Info */}
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

              {/* Cover Image - REQUIRED */}
              <div className="form-group">
                <label>Cover Image * <span style={{ color: '#ef4444' }}>(Required)</span></label>
                <div
                  {...coverDropzone.getRootProps()}
                  className={`dropzone ${coverDropzone.isDragActive ? 'active' : ''}`}
                  style={{ borderColor: !formData.coverFile && formData.coverFile === null ? '#ef4444' : undefined }}
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
                {!formData.coverFile && (
                  <small style={{ color: '#ef4444', display: 'block', marginTop: '0.25rem' }}>
                    Cover image is required
                  </small>
                )}
              </div>

              {/* Book Files Section - REQUIRED (at least one) */}
              <div className="form-section">
                <h3>Book Files <span style={{ color: '#ef4444' }}>(At least one required)</span></h3>
                
                {/* EPUB Upload */}
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

                {/* PDF Upload */}
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

                {!formData.epubFile && !formData.pdfFile && (
                  <small style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem' }}>
                    At least one book file (EPUB or PDF) is required
                  </small>
                )}
                {formData.epubFile && !formData.pdfFile && (
                  <small style={{ color: '#10b981', display: 'block', marginTop: '0.5rem' }}>
                    ✓ EPUB file selected
                  </small>
                )}
                {!formData.epubFile && formData.pdfFile && (
                  <small style={{ color: '#10b981', display: 'block', marginTop: '0.5rem' }}>
                    ✓ PDF file selected
                  </small>
                )}
                {formData.epubFile && formData.pdfFile && (
                  <small style={{ color: '#10b981', display: 'block', marginTop: '0.5rem' }}>
                    ✓ Both EPUB and PDF files selected
                  </small>
                )}
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowAddBookModal(false)} 
                  className="btn btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={uploading || !formData.coverFile || (!formData.epubFile && !formData.pdfFile)}
                >
                  {uploading ? 'Creating Book...' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianDashboard;