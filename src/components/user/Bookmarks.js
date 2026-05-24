import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const Bookmarks = () => {
  const { user } = useAuth();
  const { speak } = useAccessibility();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const data = await db.getBookmarks(user.id);
      setBookmarks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load bookmarks');
      speak('Error loading bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bookmark?')) return;
    
    try {
      await db.deleteBookmark(id);
      setBookmarks(bookmarks.filter(b => b.id !== id));
      speak('Bookmark deleted');
    } catch (err) {
      speak('Failed to delete bookmark');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBookmarks} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Bookmarks</h1>
        <p>Saved pages from your reading</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="empty-state">
          <p>No bookmarks yet.</p>
          <Link to="/dashboard/books" className="btn btn-primary">Start Reading</Link>
        </div>
      ) : (
        <div className="bookmarks-list" role="list">
          {bookmarks.map(bookmark => (
            <article key={bookmark.id} className="bookmark-card" role="listitem">
              <div className="bookmark-content">
                <h2>
                  {/* FIXED: Use state instead of query param */}
                  <Link 
                    to={`/dashboard/books/${bookmark.book_id}`}
                    state={{ page: bookmark.location }}
                  >
                    {bookmark.books?.title || 'Unknown Book'}
                  </Link>
                </h2>
                <p className="bookmark-meta">
                  Page {bookmark.location} • Saved on {new Date(bookmark.created_at).toLocaleDateString()}
                </p>
                {bookmark.note && (
                  <blockquote className="bookmark-note">
                    "{bookmark.note}"
                  </blockquote>
                )}
              </div>
              <div className="bookmark-actions">
                {/* FIXED: Use state instead of query param */}
                <Link 
                  to={`/dashboard/books/${bookmark.book_id}`}
                  state={{ page: bookmark.location }}
                  className="btn btn-secondary btn-sm"
                >
                  Read
                </Link>
                <button 
                  onClick={() => handleDelete(bookmark.id)}
                  className="btn btn-danger btn-sm"
                  aria-label="Delete bookmark"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;