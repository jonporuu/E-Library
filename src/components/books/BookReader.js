import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Add useLocation
import ePub from 'epubjs';
import { Document, Page } from 'react-pdf';
import { pdfjs } from 'react-pdf';
import { db, supabase } from '../../services/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

// Configure PDF.js worker with local file
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

const BookReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Add this to get location state
  const { user } = useAuth();
  const { fontSize } = useAccessibility();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookFormat, setBookFormat] = useState(null); // 'epub' or 'pdf'
  const [epubBook, setEpubBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [chapters, setChapters] = useState([]);
  const [chapterContent, setChapterContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [progress, setProgress] = useState(0);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [fileSize, setFileSize] = useState(null);
  const contentRef = useRef(null);

  // Check for page parameter from bookmark
  const initialPage = location.state?.page || null;

  // Mock book content - will be replaced with actual EPUB content
  const mockContent = `
    <h2>Chapter 1</h2>
    <p>This is the beginning of an amazing story. The content would normally be loaded from an EPUB or PDF file stored in Supabase Storage.</p>
    <p>For this demo, we're showing placeholder text that demonstrates the reader.</p>
    <h3>Section 1.1</h3>
    <p>The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet.</p>
    <p>Reading should be accessible to everyone. Enjoy your book!</p>
  `;

  useEffect(() => {
    fetchBook();
  }, [id]);

  useEffect(() => {
    if (book) {
      if (bookFormat === 'epub' && chapters.length > 0) {
        loadProgress();
        loadChapter(currentChapter);
      } else if (bookFormat === 'pdf' && numPages) {
        loadProgress();
      }
    }
  }, [book, chapters, currentChapter, bookFormat, numPages]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const data = await db.getBookById(id);
      if (!data) {
        throw new Error('Book not found');
      }
      setBook(data);

      // Check if book has EPUB format
      const epubFormat = data.book_formats?.find(format => format.format_type === 'epub');
      const pdfFormat = data.book_formats?.find(format => format.format_type === 'pdf');

      if (epubFormat) {
        setBookFormat('epub');
        await loadEpubBook(epubFormat.file_url);
      } else if (pdfFormat) {
        setBookFormat('pdf');
        await loadPdfBook(pdfFormat.file_url);
      } else {
        // No supported format found, use mock content
        setBookFormat('mock');
        setChapterContent(mockContent);
        setChapters([{ title: 'Chapter 1', href: 'mock' }]);
      }
    } catch (err) {
      console.error('Error loading book:', err);
      setError('Failed to load book. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadEpubBook = async (epubUrl) => {
    try {
      console.log('Loading EPUB from:', epubUrl);
      setContentLoading(true);

      // Create EPUB book instance with epubjs and timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('EPUB loading timeout - file may be too large or corrupted')), 30000);
      });

      const loadPromise = async () => {
        const epub = ePub(epubUrl);

        // Wait for book to be ready
        await epub.ready;

        // Get file size if available
        try {
          const response = await fetch(epubUrl, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            setFileSize(parseInt(contentLength));
            if (parseInt(contentLength) > 50 * 1024 * 1024) {
              console.warn('Large EPUB file detected, loading may be slow');
            }
          }
        } catch (sizeError) {
          console.warn('Could not determine file size:', sizeError);
        }

        setEpubBook(epub);

        // Get table of contents
        const toc = await epub.toc;
        const chapterList = toc.length > 0 ? toc : [{ title: 'Chapter 1', href: 'chapter1' }];
        setChapters(chapterList);

        console.log('EPUB loaded successfully, chapters:', chapterList.length);
        return epub;
      };

      await Promise.race([loadPromise(), timeoutPromise]);
      setContentLoading(false);
    } catch (error) {
      console.error('Error loading EPUB:', error);
      setContentLoading(false);
      // Fallback to mock content
      setChapterContent(mockContent);
      setChapters([{ title: 'Chapter 1', href: 'mock' }]);
    }
  };

  const loadPdfBook = async (pdfUrl) => {
    try {
      console.log('Loading PDF from:', pdfUrl);
      setContentLoading(true);

      // Extract the file path from the Supabase public URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/book-files/pdf/[id]/[filename]
      const urlParts = pdfUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'book-files');
      if (bucketIndex !== -1) {
        const filePath = urlParts.slice(bucketIndex + 1).join('/');
        console.log('Extracted file path:', filePath);

        // Try to download the file using Supabase client (authenticated)
        const { data, error } = await supabase.storage
          .from('book-files')
          .download(filePath);

        if (error) {
          console.error('Supabase download error:', error);
          throw new Error(`Failed to download PDF: ${error.message}`);
        }

        console.log('PDF downloaded successfully, size:', data.size);
        setFileSize(data.size);

        // Check file size - warn for large files (> 50MB)
        if (data.size > 50 * 1024 * 1024) {
          console.warn('Large PDF file detected, loading may be slow');
        }

        setPdfFile(data); // data is a Blob
        setContentLoading(false);
        return;
      }

      // Fallback: try to load as blob from URL with timeout
      try {
        console.log('Attempting to load PDF as blob from URL...');

        // Create a promise that rejects after 30 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('PDF loading timeout - file may be too large')), 30000);
        });

        const fetchPromise = fetch(pdfUrl).then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const blob = await response.blob();
          console.log('PDF loaded as blob from URL, size:', blob.size);
          setFileSize(blob.size);

          // Check file size - warn for large files (> 50MB)
          if (blob.size > 50 * 1024 * 1024) {
            console.warn('Large PDF file detected, loading may be slow');
          }

          return blob;
        });

        const blob = await Promise.race([fetchPromise, timeoutPromise]);
        setPdfFile(blob);
        setContentLoading(false);
      } catch (blobError) {
        console.warn('Blob loading failed:', blobError);
        setContentLoading(false);
        // Last resort: use direct URL
        setPdfFile(pdfUrl);
      }

      console.log('PDF URL set successfully');
    } catch (error) {
      console.error('Error loading PDF:', error);
      setError(`Failed to load PDF file: ${error.message}`);
      setContentLoading(false);
    }
  };

  const loadChapter = async (chapterIndex) => {
    try {
      setContentLoading(true);

      if (!epubBook || !chapters[chapterIndex]) {
        setChapterContent(mockContent);
        setContentLoading(false);
        return;
      }

      const chapter = chapters[chapterIndex];
      console.log('Loading chapter:', chapter.title, chapter.href);

      // Add timeout for chapter loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Chapter loading timeout')), 10000);
      });

      const loadChapterPromise = async () => {
        // Get chapter content using epubjs
        const chapterDoc = await epubBook.getChapter(chapter.href);

        if (chapterDoc) {
          // Convert to HTML string
          const content = chapterDoc.innerHTML || mockContent;
          setChapterContent(content);
        } else {
          setChapterContent(mockContent);
        }

        // Update progress
        const percent = Math.round(((chapterIndex + 1) / chapters.length) * 100);
        setProgress(percent);
        saveProgress(percent);
      };

      await Promise.race([loadChapterPromise(), timeoutPromise]);
      setContentLoading(false);
    } catch (error) {
      console.error('Error loading chapter:', error);
      setChapterContent(mockContent);
      setContentLoading(false);
    }
  };

  const saveProgress = async (percent) => {
    try {
      await db.updateReadingProgress(user.id, id, {
        last_position: currentChapter,
        percentage: percent
      });
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(prev => prev - 1);
      contentRef.current?.focus();
    }
  };

  const handleNextChapter = () => {
    if (currentChapter < chapters.length - 1) {
      setCurrentChapter(prev => prev + 1);
      contentRef.current?.focus();
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      savePdfProgress();
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(prev => prev + 1);
      savePdfProgress();
    }
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF Document load error:', error);
    setError(`Failed to load PDF: ${error.message || 'Unknown error'}`);
    setContentLoading(false);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    console.log('PDF loaded successfully, pages:', numPages);
    
    // If there's an initial page from bookmark, go to that page
    if (initialPage && initialPage > 0 && initialPage <= numPages) {
      setCurrentPage(initialPage);
      // Save progress for this page
      const percent = Math.round((initialPage / numPages) * 100);
      setProgress(percent);
      db.updateReadingProgress(user.id, id, {
        last_position: initialPage - 1, // 0-based for storage
        percentage: percent
      }).catch(err => console.error('Error saving progress:', err));
    }
    
    setContentLoading(false);
  };

  const savePdfProgress = () => {
    const percent = Math.round((currentPage / numPages) * 100);
    setProgress(percent);
    db.updateReadingProgress(user.id, id, {
      last_position: currentPage - 1, // 0-based for storage
      percentage: percent
    }).catch(err => console.error('Error saving PDF progress:', err));
  };

  const loadProgress = async () => {
    try {
      const progressData = await db.getReadingProgress(user.id);
      const bookProgress = progressData.find(p => p.book_id === id);
      
      // Only load saved progress if there's no initial page from bookmark
      if (bookProgress && !initialPage) {
        if (bookFormat === 'epub') {
          const savedChapter = bookProgress.last_position || 0;
          setCurrentChapter(Math.min(savedChapter, chapters.length - 1));
        } else if (bookFormat === 'pdf') {
          const savedPage = (bookProgress.last_position || 0) + 1; // Convert to 1-based
          setCurrentPage(savedPage);
        }
        setProgress(bookProgress.percentage || 0);
      } else if (initialPage && bookFormat === 'pdf') {
        // Already handling in onDocumentLoadSuccess
        console.log('Will navigate to bookmark page:', initialPage);
      }
    } catch (err) {
      console.error('Error loading progress:', err);
    }
  };

  const handleAddBookmark = async () => {
    try {
      await db.createBookmark({
        user_id: user.id,
        book_id: id,
        location: bookFormat === 'pdf' ? currentPage : currentChapter, // Store 1-based for PDF
        note: bookmarkNote
      });
      setShowBookmarkModal(false);
      setBookmarkNote('');
    } catch (err) {
      console.error('Failed to add bookmark');
    }
  };

  const handleKeyDown = (e) => {
    if (bookFormat === 'epub') {
      if (e.key === 'ArrowLeft') handlePrevChapter();
      if (e.key === 'ArrowRight') handleNextChapter();
    } else if (bookFormat === 'pdf') {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapter, chapters.length, currentPage, numPages, bookFormat]);

  if (loading) return <LoadingSpinner message="Loading book..." fullScreen />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBook} showHomeLink />;
  if (!book) return <ErrorMessage message="Book not found" showHomeLink />;

  return (
    <div className="reader-container">
      {/* Reader Header */}
      <header className="reader-header">
        <button 
          onClick={() => navigate('/dashboard/books')} 
          className="btn btn-icon"
          aria-label="Back to book list"
        >
          ← Back
        </button>
        <h1 className="reader-title">{book.title}</h1>
        <div className="reader-actions">
          <button 
            onClick={() => setShowBookmarkModal(true)}
            className="btn btn-icon"
            aria-label="Add bookmark"
          >
            🔖 Bookmark
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="progress-container" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
        <span className="progress-text">
          {bookFormat === 'pdf' ? (
            `Page ${currentPage} of ${numPages} (${progress}%)`
          ) : (
            `Chapter ${currentChapter + 1} of ${chapters.length} (${progress}%)`
          )}
          {bookFormat === 'epub' && chapters[currentChapter] && ` - ${chapters[currentChapter].title}`}
        </span>
      </div>

      {/* Book Content */}
      <main
        ref={contentRef}
        className="book-content"
        tabIndex="-1"
        style={{
          fontSize: `${fontSize}px`
        }}
        aria-label="Book content"
      >
        {contentLoading ? (
          <div className="loading-container">
            <LoadingSpinner message={
              bookFormat === 'pdf' 
                ? "Loading PDF document..." 
                : "Loading chapter content..."
            } />
            {fileSize && fileSize > 10 * 1024 * 1024 && (
              <p className="loading-hint">
                Large file detected ({(fileSize / (1024 * 1024)).toFixed(1)} MB). 
                Loading may take longer than usual.
              </p>
            )}
          </div>
        ) : bookFormat === 'pdf' ? (
          <div className="pdf-viewer">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<LoadingSpinner message="Processing PDF..." />}
              error={<ErrorMessage message="Failed to load PDF" />}
            >
              <Page
                pageNumber={currentPage}
                scale={1.2}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={<LoadingSpinner message="Loading page..." />}
              />
            </Document>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: chapterContent }} />
        )}
      </main>

      {/* Navigation */}
      <nav className="reader-nav" aria-label={bookFormat === 'pdf' ? 'Page navigation' : 'Chapter navigation'}>
        <button
          onClick={bookFormat === 'pdf' ? handlePrevPage : handlePrevChapter}
          disabled={bookFormat === 'pdf' ? currentPage === 1 : currentChapter === 0}
          className="btn btn-secondary"
          aria-label={bookFormat === 'pdf' ? 'Previous page' : 'Previous chapter'}
        >
          ← {bookFormat === 'pdf' ? 'Previous' : 'Previous'}
        </button>
        <span className="page-indicator" aria-live="polite">
          {bookFormat === 'pdf' ? (
            `Page ${currentPage} of ${numPages}`
          ) : (
            `Chapter ${currentChapter + 1} of ${chapters.length}`
          )}
          {bookFormat === 'epub' && chapters[currentChapter] && ` - ${chapters[currentChapter].title}`}
        </span>
        <button
          onClick={bookFormat === 'pdf' ? handleNextPage : handleNextChapter}
          disabled={bookFormat === 'pdf' ? currentPage === numPages : currentChapter === chapters.length - 1}
          className="btn btn-secondary"
          aria-label={bookFormat === 'pdf' ? 'Next page' : 'Next chapter'}
        >
          {bookFormat === 'pdf' ? 'Next' : 'Next'} →
        </button>
      </nav>

      {/* Bookmark Modal */}
      {showBookmarkModal && (
        <div 
          className="modal-overlay" 
          role="dialog" 
          aria-modal="true"
          aria-labelledby="bookmark-title"
        >
          <div className="modal">
            <h2 id="bookmark-title">Add Bookmark</h2>
            <p>
              {bookFormat === 'pdf' ? (
                `Page ${currentPage} of "${book.title}"`
              ) : (
                `Chapter ${currentChapter + 1} of "${book.title}"`
              )}
            </p>
            <div className="form-group">
              <label htmlFor="bookmark-note">Note (optional):</label>
              <textarea
                id="bookmark-note"
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                rows="3"
                placeholder="Add a note about this section..."
              />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowBookmarkModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleAddBookmark} className="btn btn-primary">
                Save Bookmark
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="reader-help" role="complementary" aria-label="Keyboard shortcuts">
        <p>Use ← → arrow keys to navigate pages</p>
      </div>
    </div>
  );
};

export default BookReader;