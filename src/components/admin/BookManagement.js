import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { db, supabase } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import BookUpload from './BookUpload';

const BookManagement = () => {
  const { speak } = useAccessibility();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bookFormats, setBookFormats] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
  // Form data including files
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    reading_level: 'beginner',
    isbn: '',
    cover_url: '',
    // File uploads
    coverFile: null,
    epubFile: null,
    pdfFile: null
  });

  // Dropzone hooks
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
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await db.getBooks();
      setBooks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load books');
      speak('Error loading books');
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
    setUploading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.author) {
        alert('Please fill in title and author');
        setUploading(false);
        return;
      }

      // Validate that at least one file is selected (if not editing with existing cover)
      const hasCover = formData.coverFile || formData.cover_url;
      const hasBookFile = formData.epubFile || formData.pdfFile;
      
      if (!hasCover && !hasBookFile) {
        alert('Please select at least a cover image or a book file (EPUB/PDF)');
        setUploading(false);
        return;
      }

      let coverUrl = formData.cover_url;

      // Upload cover file if selected
      if (formData.coverFile) {
        console.log('Uploading cover for:', formData.title);
        const coverPath = `covers/${Date.now()}_${formData.coverFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('book-covers')
          .upload(coverPath, formData.coverFile, { upsert: true });
        
        if (uploadError) {
          console.error('Cover upload error:', uploadError);
          throw new Error(`Failed to upload cover: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('book-covers')
          .getPublicUrl(coverPath);
        coverUrl = publicUrl;
        console.log('Cover uploaded successfully:', publicUrl);
      }

      // Create or update book
      let bookId;
      if (editingBook) {
        await db.updateBook(editingBook.id, {
          title: formData.title,
          author: formData.author,
          description: formData.description,
          reading_level: formData.reading_level,
          isbn: formData.isbn,
          cover_url: coverUrl
        });
        bookId = editingBook.id;
        speak('Book updated successfully');
      } else {
        const newBook = await db.createBook({
          title: formData.title,
          author: formData.author,
          description: formData.description,
          reading_level: formData.reading_level,
          isbn: formData.isbn,
          cover_url: coverUrl,
          status: 'available'
        });
        bookId = newBook.id;
        speak('Book created successfully');
      }

      // Upload book files (EPUB/PDF) if selected
      if (formData.epubFile) {
        console.log('Uploading EPUB for:', formData.title, formData.epubFile.name);
        const epubPath = `epub/${bookId}/${formData.epubFile.name}`;
        const { error: epubError } = await supabase.storage
          .from('book-files')
          .upload(epubPath, formData.epubFile);
        
        if (!epubError) {
          const { data: { publicUrl } } = supabase.storage
            .from('book-files')
            .getPublicUrl(epubPath);
          await db.addBookFormat({
            book_id: bookId,
            format_type: 'epub',
            file_url: publicUrl,
            file_size: formData.epubFile.size
          });
          console.log('EPUB uploaded successfully:', publicUrl);
        } else {
          console.error('EPUB upload error:', epubError);
          throw new Error(`Failed to upload EPUB: ${epubError.message}`);
        }
      }

      if (formData.pdfFile) {
        console.log('Uploading PDF for:', formData.title, formData.pdfFile.name);
        const pdfPath = `pdf/${bookId}/${formData.pdfFile.name}`;
        const { error: pdfError } = await supabase.storage
          .from('book-files')
          .upload(pdfPath, formData.pdfFile);
        
        if (!pdfError) {
          const { data: { publicUrl } } = supabase.storage
            .from('book-files')
            .getPublicUrl(pdfPath);
          await db.addBookFormat({
            book_id: bookId,
            format_type: 'pdf',
            file_url: publicUrl,
            file_size: formData.pdfFile.size
          });
          console.log('PDF uploaded successfully:', publicUrl);
        } else {
          console.error('PDF upload error:', pdfError);
          throw new Error(`Failed to upload PDF: ${pdfError.message}`);
        }
      }

      setShowModal(false);
      setEditingBook(null);
      resetForm();
      fetchBooks();
    } catch (err) {
      console.error('Error saving book:', err);
      speak('Failed to save book: ' + err.message);
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
      cover_url: book.cover_url || '',
      coverFile: null,
      epubFile: null,
      pdfFile: null
    });
    loadBookFormats(book.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    
    try {
      await db.deleteBook(id);
      setBooks(books.filter(b => b.id !== id));
      speak('Book deleted');
    } catch (err) {
      speak('Failed to delete book');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      reading_level: 'beginner',
      isbn: '',
      cover_url: '',
      coverFile: null,
      epubFile: null,
      pdfFile: null
    });
    setBookFormats([]);
  };

  const handleBulkUploadComplete = () => {
    setShowBulkUpload(false);
    fetchBooks(); // Refresh the book list
    speak('Books uploaded successfully');
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
      <div className="admin-header">
        <h1>Book Management</h1>
        <p>Manage library catalog</p>
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
          >
            + Add Single Book
          </button>
          <button 
            onClick={() => setShowBulkUpload(true)}
            className="btn btn-secondary"
          >
            📚 Bulk Upload Books
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table" role="table" aria-label="Books list">
          <thead>
            <tr>
              <th scope="col">Cover</th>
              <th scope="col">Title</th>
              <th scope="col">Author</th>
              <th scope="col">Level</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.id}>
                <td>
                  <img 
                    src={book.cover_url} 
                    alt="" 
                    className="table-cover"
                    width="50"
                    height="70"
                  />
                </td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>
                  <span className={`level-badge level-${book.reading_level}`}>
                    {book.reading_level}
                  </span>
                </td>
                <td>{book.status}</td>
                <td>
                  <button 
                    onClick={() => handleEdit(book)}
                    className="btn btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(book.id)}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal with File Upload */}
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal modal-large">
            <h2 id="modal-title">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
            
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
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="isbn">ISBN</label>
                  <input
                    type="text"
                    id="isbn"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Cover Image - URL or File */}
              <div className="form-group">
                <label>Cover Image</label>
                <div className="file-input-wrapper">
                  <input
                    type="text"
                    name="cover_url"
                    value={formData.cover_url}
                    onChange={handleChange}
                    placeholder="Or enter image URL"
                    className="url-input"
                  />
                  <span className="or-divider">OR</span>
                  <div
                    {...coverDropzone.getRootProps()}
                    className={`dropzone ${coverDropzone.isDragActive ? 'active' : ''}`}
                  >
                    <input {...coverDropzone.getInputProps()} />
                    <div className="dropzone-content">
                      {formData.coverFile ? (
                        <div className="file-preview">
                          <span className="file-icon">🖼️</span>
                          <span className="file-name">{formData.coverFile.name}</span>
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
              </div>

              {/* Book Files Section */}
              <div className="form-section">
                <h3>Book Files (Optional)</h3>
                
                {/* EPUB Upload */}
                <div className="form-group file-upload-group">
                  <label>EPUB File</label>
                  <div
                    {...epubDropzone.getRootProps()}
                    className={`dropzone ${epubDropzone.isDragActive ? 'active' : ''}`}
                  >
                    <input {...epubDropzone.getInputProps()} />
                    <div className="dropzone-content">
                      {formData.epubFile ? (
                        <div className="file-preview">
                          <span className="file-icon">📖</span>
                          <span className="file-name">{formData.epubFile.name}</span>
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
                    <input {...pdfDropzone.getInputProps()} />
                    <div className="dropzone-content">
                      {formData.pdfFile ? (
                        <div className="file-preview">
                          <span className="file-icon">📄</span>
                          <span className="file-name">{formData.pdfFile.name}</span>
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

              {/* Existing Files (when editing) */}
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
                  disabled={uploading}
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