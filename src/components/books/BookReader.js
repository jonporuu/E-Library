import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ePub from 'epubjs';
import { Document, Page } from 'react-pdf';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { supabase, db } from '../../services/supabaseClient';

import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

const BookReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { fontSize } = useAccessibility();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookFormat, setBookFormat] = useState(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const contentRef = useRef(null);
  const readerContainerRef = useRef(null);

  const initialPage = location.state?.page || null;

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

  useEffect(() => {
    if (bookFormat === 'pdf' && numPages && currentPage) {
      savePdfProgress();
    }
  }, [currentPage, numPages]);

  useEffect(() => {
    if (bookFormat === 'epub' && chapters.length > 0) {
      let percent;
      if (currentChapter + 1 === chapters.length) {
        percent = 100;
      } else {
        percent = Math.round(((currentChapter + 1) / chapters.length) * 100);
      }
      setProgress(percent);
      saveProgress(percent);
    }
  }, [currentChapter, chapters.length]);

  // Handle fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await readerContainerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const fetchBook = async () => {
    try {
      setLoading(true);
      const data = await db.getBookById(id);
      if (!data) {
        throw new Error('Book not found');
      }
      setBook(data);

      const epubFormat = data.book_formats?.find(format => format.format_type === 'epub');
      const pdfFormat = data.book_formats?.find(format => format.format_type === 'pdf');

      if (epubFormat) {
        setBookFormat('epub');
        await loadEpubBook(epubFormat.file_url);
      } else if (pdfFormat) {
        setBookFormat('pdf');
        await loadPdfBook(pdfFormat.file_url);
      } else {
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

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('EPUB loading timeout - file may be too large or corrupted')), 30000);
      });

      const loadPromise = async () => {
        const epub = ePub(epubUrl);
        await epub.ready;

        try {
          const response = await fetch(epubUrl, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            setFileSize(parseInt(contentLength));
          }
        } catch (sizeError) {
          console.warn('Could not determine file size:', sizeError);
        }

        setEpubBook(epub);
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
      setChapterContent(mockContent);
      setChapters([{ title: 'Chapter 1', href: 'mock' }]);
    }
  };

  const loadPdfBook = async (pdfUrl) => {
    try {
      console.log('Loading PDF from:', pdfUrl);
      setContentLoading(true);
      
      setPdfFile(pdfUrl);
      setContentLoading(false);
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

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Chapter loading timeout')), 10000);
      });

      const loadChapterPromise = async () => {
        const chapterDoc = await epubBook.getChapter(chapter.href);
        if (chapterDoc) {
          const content = chapterDoc.innerHTML || mockContent;
          setChapterContent(content);
        } else {
          setChapterContent(mockContent);
        }
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
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(prev => prev + 1);
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
    
    if (initialPage && initialPage > 0 && initialPage <= numPages) {
      setCurrentPage(initialPage);
    }
    
    setContentLoading(false);
  };

  const savePdfProgress = () => {
    if (!numPages) return;
    
    let percent;
    if (currentPage === numPages) {
      percent = 100;
    } else {
      percent = Math.round((currentPage / numPages) * 100);
    }
    
    console.log(`Saving PDF progress: Page ${currentPage}/${numPages} = ${percent}%`);
    
    setProgress(percent);
    db.updateReadingProgress(user.id, id, {
      last_position: currentPage - 1,
      percentage: percent
    }).catch(err => console.error('Error saving PDF progress:', err));
  };

  const loadProgress = async () => {
    try {
      const progressData = await db.getReadingProgress(user.id);
      const bookProgress = progressData.find(p => p.book_id === id);
      
      if (bookProgress && !initialPage) {
        if (bookFormat === 'epub') {
          const savedChapter = bookProgress.last_position || 0;
          setCurrentChapter(Math.min(savedChapter, chapters.length - 1));
          setProgress(bookProgress.percentage || 0);
        } else if (bookFormat === 'pdf') {
          const savedPage = (bookProgress.last_position || 0) + 1;
          setCurrentPage(savedPage);
          setProgress(bookProgress.percentage || 0);
        }
      } else if (initialPage && bookFormat === 'pdf') {
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
        location: bookFormat === 'pdf' ? currentPage : currentChapter, 
        note: bookmarkNote
      });
      setShowBookmarkModal(false);
      setBookmarkNote('');
      alert('Bookmark saved!');
    } catch (err) {
      console.error('Failed to add bookmark');
      alert('Failed to save bookmark');
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
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      toggleFullscreen();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChapter, chapters.length, currentPage, numPages, bookFormat]);

  if (loading) return <LoadingSpinner message="Loading book..." fullScreen />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBook} showHomeLink />;
  if (!book) return <ErrorMessage message="Book not found" showHomeLink />;

  // Calculate display progress
  const displayProgress = bookFormat === 'pdf' && numPages
    ? (currentPage === numPages ? 100 : Math.round((currentPage / numPages) * 100))
    : progress;

  return (
    <div 
      ref={readerContainerRef}
      className="reader-container" 
      style={{ 
        ...(isFullscreen && { 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 9999,
          backgroundColor: '#fff',
          padding: '20px',
          overflowY: 'auto'
        })
      }}
    >
      <header className="reader-header" style={isFullscreen ? { position: 'sticky', top: 0, background: '#fff', zIndex: 100 } : {}}>
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
            onClick={toggleFullscreen}
            className="btn btn-icon"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
          >
            {isFullscreen ? '🗗' : '🗖'}
          </button>
          <button 
            onClick={() => setShowBookmarkModal(true)}
            className="btn btn-icon"
            aria-label="Add bookmark"
          >
            🔖 Bookmark
          </button>
        </div>
      </header>

      <div className="progress-container" role="progressbar" aria-valuenow={displayProgress} aria-valuemin="0" aria-valuemax="100">
        <div className="progress-bar" style={{ width: `${displayProgress}%` }} />
        <span className="progress-text">
          {bookFormat === 'pdf' && numPages ? (
            `Page ${currentPage} of ${numPages} (${displayProgress}%)`
          ) : bookFormat === 'epub' && chapters.length ? (
            `Chapter ${currentChapter + 1} of ${chapters.length} (${displayProgress}%)`
          ) : (
            `${displayProgress}% complete`
          )}
        </span>
      </div>

      <main
        ref={contentRef}
        className="book-content"
        tabIndex="-1"
        style={{ 
          fontSize: `${fontSize}px`,
          ...(isFullscreen && { 
            minHeight: 'calc(100vh - 200px)',
            padding: '40px'
          })
        }}
        aria-label="Book content"
      >
        {contentLoading ? (
          <div className="loading-container">
            <LoadingSpinner message={bookFormat === 'pdf' ? "Loading PDF document..." : "Loading chapter content..."} />
          </div>
        ) : bookFormat === 'pdf' ? (
          <div className="pdf-viewer" style={isFullscreen ? { display: 'flex', justifyContent: 'center', alignItems: 'center' } : {}}>
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<LoadingSpinner message="Processing PDF..." />}
              error={<ErrorMessage message="Failed to load PDF" />}
            >
              <Page
                pageNumber={currentPage}
                scale={isFullscreen ? 1.5 : 1.2}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: chapterContent }} />
        )}
      </main>

      <nav className="reader-nav">
        <button
          onClick={bookFormat === 'pdf' ? handlePrevPage : handlePrevChapter}
          disabled={bookFormat === 'pdf' ? currentPage === 1 : currentChapter === 0}
          className="btn btn-secondary"
        >
          ← Previous
        </button>
        <span className="page-indicator" style={{ fontSize: '14px', color: '#666' }}>
          Press F for fullscreen
        </span>
        <button
          onClick={bookFormat === 'pdf' ? handleNextPage : handleNextChapter}
          disabled={bookFormat === 'pdf' ? currentPage === numPages : currentChapter === chapters.length - 1}
          className="btn btn-secondary"
        >
          Next →
        </button>
      </nav>

      {showBookmarkModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <h2>Add Bookmark</h2>
            <p>
              {bookFormat === 'pdf' && numPages ? (
                `Page ${currentPage} of ${numPages}`
              ) : bookFormat === 'epub' && chapters.length ? (
                `Chapter ${currentChapter + 1} of ${chapters.length}`
              ) : (
                `Location ${bookFormat === 'pdf' ? currentPage : currentChapter + 1}`
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
    </div>
  );
};

export default BookReader;