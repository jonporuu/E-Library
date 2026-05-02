import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { db, supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const BookUpload = ({ onUploadComplete }) => {
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [books, setBooks] = useState([
    {
      id: Date.now(),
      title: '',
      author: '',
      description: '',
      reading_level: 'intermediate',
      isbn: '',
      page_count: '',
      coverFile: null,
      epubFile: null,
      pdfFile: null,
      audioFile: null
    }
  ]);

  const readingLevels = ['beginner', 'intermediate', 'advanced'];

  // Check if user has permission
  const canUpload = profile?.role === 'admin' || profile?.role === 'librarian';

  console.log('BookUpload - User profile:', profile);
  console.log('BookUpload - User role:', profile?.role);
  console.log('BookUpload - Can upload:', canUpload);

  const addBook = () => {
    setBooks([...books, {
      id: Date.now(),
      title: '',
      author: '',
      description: '',
      reading_level: 'intermediate',
      isbn: '',
      page_count: '',
      coverFile: null,
      epubFile: null,
      pdfFile: null,
      audioFile: null
    }]);
  };

  const removeBook = (id) => {
    if (books.length > 1) {
      setBooks(books.filter(b => b.id !== id));
    }
  };

  const updateBook = (id, field, value) => {
    setBooks(books.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const onDrop = useCallback((acceptedFiles, rejectedFiles, id, type) => {
    if (rejectedFiles.length > 0) {
      console.warn('Rejected files:', rejectedFiles);
      alert(`Some files were rejected. Please check file type and size.`);
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      console.log('Accepted file:', file.name, file.type, file.size);
      updateBook(id, `${type}File`, file);
    }
  }, []);

  const uploadFile = async (file, bucket, path) => {
    console.log('Uploading file:', file.name, 'to bucket:', bucket, 'path:', path);

    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`Upload progress for ${path}: ${percent}%`);
            setUploadProgress(prev => ({ ...prev, [path]: percent }));
          }
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      console.log('Upload successful:', data);
      return data.path;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('BookUpload - Starting upload process');
    console.log('BookUpload - Can upload check:', canUpload);

    if (!canUpload) {
      alert('Only librarians and admins can upload books');
      return;
    }

    setUploading(true);
    setUploadProgress({});

    try {
      console.log('BookUpload - Processing books:', books);
      for (const book of books) {
        console.log('Processing book:', book.title);

        if (!book.title || !book.author) {
          alert(`Please fill in title and author for all books`);
          setUploading(false);
          return;
        }

        // Validate that at least one file is selected
        if (!book.coverFile && !book.epubFile && !book.pdfFile && !book.audioFile) {
          alert(`Please select at least one file (cover, EPUB, PDF, or audio) for "${book.title}"`);
          setUploading(false);
          return;
        }

        // 1. Upload cover image
        let coverUrl = book.cover_url || 'https://via.placeholder.com/300x400?text=No+Cover';
        if (book.coverFile) {
          console.log('Uploading cover for:', book.title);
          const coverPath = `covers/${Date.now()}_${book.coverFile.name}`;
          await uploadFile(book.coverFile, 'book-covers', coverPath);
          const { data: { publicUrl } } = supabase.storage
            .from('book-covers')
            .getPublicUrl(coverPath);
          coverUrl = publicUrl;
        }

        // 2. Create book record
        const newBook = await db.createBook({
          title: book.title,
          author: book.author,
          description: book.description,
          reading_level: book.reading_level,
          status: 'available',
          cover_url: coverUrl,
          isbn: book.isbn || null,
          page_count: book.page_count ? parseInt(book.page_count) : null
        });

        // 3. Upload book files and link to book
        const formats = [];

        if (book.epubFile) {
          console.log('Uploading EPUB for:', book.title, book.epubFile.name);
          const epubPath = `epub/${newBook.id}/${book.epubFile.name}`;
          await uploadFile(book.epubFile, 'book-files', epubPath);
          const { data: { publicUrl } } = supabase.storage
            .from('book-files')
            .getPublicUrl(epubPath);
          formats.push({
            book_id: newBook.id,
            format_type: 'epub',
            file_url: publicUrl,
            file_size: book.epubFile.size
          });
        }

        if (book.pdfFile) {
          console.log('Uploading PDF for:', book.title, book.pdfFile.name);
          const pdfPath = `pdf/${newBook.id}/${book.pdfFile.name}`;
          await uploadFile(book.pdfFile, 'book-files', pdfPath);
          const { data: { publicUrl } } = supabase.storage
            .from('book-files')
            .getPublicUrl(pdfPath);
          formats.push({
            book_id: newBook.id,
            format_type: 'pdf',
            file_url: publicUrl,
            file_size: book.pdfFile.size
          });
        }

        if (book.audioFile) {
          console.log('Uploading audio for:', book.title, book.audioFile.name);
          const audioPath = `audio/${newBook.id}/${book.audioFile.name}`;
          await uploadFile(book.audioFile, 'book-files', audioPath);
          const { data: { publicUrl } } = supabase.storage
            .from('book-files')
            .getPublicUrl(audioPath);
          formats.push({
            book_id: newBook.id,
            format_type: 'audio',
            file_url: publicUrl,
            file_size: book.audioFile.size
          });
        }

        // 4. Save format records
        for (const format of formats) {
          await db.addBookFormat(format);
        }
      }

      alert('Books uploaded successfully!');
      onUploadComplete?.();
      
      // Reset form
      setBooks([{
        id: Date.now(),
        title: '',
        author: '',
        description: '',
        reading_level: 'intermediate',
        isbn: '',
        page_count: '',
        coverFile: null,
        epubFile: null,
        pdfFile: null,
        audioFile: null
      }]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  if (!canUpload) {
    return (
      <div className="upload-unauthorized">
        <p>You don't have permission to upload books. Please contact an administrator.</p>
      </div>
    );
  }

  return (
    <div className="book-upload-container">
      <h2>Upload Books</h2>
      <p className="upload-help">Add multiple books with their files. Drag and drop or click to select files.</p>

      <form onSubmit={handleSubmit}>
        {books.map((book, index) => (
          <div key={book.id} className="book-upload-card">
            <div className="book-header">
              <h3>Book #{index + 1}</h3>
              {books.length > 1 && (
                <button 
                  type="button" 
                  className="btn btn-danger btn-sm"
                  onClick={() => removeBook(book.id)}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={book.title}
                  onChange={(e) => updateBook(book.id, 'title', e.target.value)}
                  required
                  placeholder="Book title"
                />
              </div>

              <div className="form-group">
                <label>Author *</label>
                <input
                  type="text"
                  value={book.author}
                  onChange={(e) => updateBook(book.id, 'author', e.target.value)}
                  required
                  placeholder="Author name"
                />
              </div>

              <div className="form-group">
                <label>Reading Level</label>
                <select
                  value={book.reading_level}
                  onChange={(e) => updateBook(book.id, 'reading_level', e.target.value)}
                >
                  {readingLevels.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>ISBN</label>
                <input
                  type="text"
                  value={book.isbn}
                  onChange={(e) => updateBook(book.id, 'isbn', e.target.value)}
                  placeholder="978-..."
                />
              </div>

              <div className="form-group">
                <label>Page Count</label>
                <input
                  type="number"
                  value={book.page_count}
                  onChange={(e) => updateBook(book.id, 'page_count', e.target.value)}
                  placeholder="Number of pages"
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={book.description}
                  onChange={(e) => updateBook(book.id, 'description', e.target.value)}
                  rows="3"
                  placeholder="Brief description of the book"
                />
              </div>
            </div>

            {/* File Upload Zones */}
            <div className="file-upload-grid">
              <Dropzone
                id={book.id}
                type="cover"
                label="Cover Image"
                accept={{ 'image/*': [] }}
                file={book.coverFile}
                onDrop={onDrop}
                icon="🖼️"
              />
              <Dropzone
                id={book.id}
                type="epub"
                label="EPUB File"
                accept={{
                  'application/epub+zip': ['.epub'],
                  'application/x-zip-compressed': ['.epub'],
                  'application/zip': ['.epub']
                }}
                file={book.epubFile}
                onDrop={onDrop}
                icon="📖"
              />
              <Dropzone
                id={book.id}
                type="pdf"
                label="PDF File"
                accept={{
                  'application/pdf': ['.pdf'],
                  'application/x-pdf': ['.pdf']
                }}
                file={book.pdfFile}
                onDrop={onDrop}
                icon="📄"
              />
              <Dropzone
                id={book.id}
                type="audio"
                label="Audio Book (MP3)"
                accept={{
                  'audio/mpeg': ['.mp3'],
                  'audio/mp3': ['.mp3'],
                  'audio/*': ['.mp3']
                }}
                file={book.audioFile}
                onDrop={onDrop}
                icon="🎧"
              />
            </div>

            {/* Progress bars */}
            {uploading && Object.keys(uploadProgress).length > 0 && (
              <div className="upload-progress">
                {Object.entries(uploadProgress).map(([path, progress]) => (
                  <div key={path} className="progress-item">
                    <span className="progress-name">{path.split('/').pop()}</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="progress-percent">{Math.round(progress)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="upload-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={addBook}
            disabled={uploading}
          >
            + Add Another Book
          </button>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload All Books'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Dropzone Component
const Dropzone = ({ id, type, label, accept, file, onDrop, icon }) => {
  const handleDrop = useCallback((acceptedFiles, rejectedFiles) => {
    onDrop(acceptedFiles, rejectedFiles, id, type);
  }, [id, type, onDrop]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleDrop,
    accept,
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB max
    onDropRejected: (rejectedFiles) => {
      console.error('Drop rejected:', rejectedFiles);
      const reasons = rejectedFiles.map(file => {
        const errors = file.errors.map(err => err.message).join(', ');
        return `${file.file.name}: ${errors}`;
      }).join('\n');
      alert(`File upload rejected:\n${reasons}`);
    }
  });

  return (
    <div
      {...getRootProps()}
      className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''} ${file ? 'has-file' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="dropzone-content">
        <span className="dropzone-icon">{icon}</span>
        <p className="dropzone-label">{label}</p>
        {file ? (
          <p className="dropzone-file">{file.name}</p>
        ) : (
          <p className="dropzone-hint">
            {isDragReject ? 'File type not supported' : isDragActive ? 'Drop here' : 'Drag & drop or click'}
          </p>
        )}
      </div>
    </div>
  );
};

export default BookUpload;