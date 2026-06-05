import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import ConfirmToast from '../common/ConfirmToast';

const Bookmarks = () => {
  const { user } = useAuth();
  const { speak } = useAccessibility();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [confirmState, setConfirmState] = useState({
  show: false,
  message: '',
  onConfirm: null,
  type: 'warning'
});

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

  const handleDelete = (id) => {
    setConfirmState({
      show: true,
      message: 'Are you sure you want to delete this bookmark?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await db.deleteBookmark(id);
          setBookmarks(bookmarks.filter(b => b.id !== id));
          speak('Bookmark deleted');
        } catch (err) {
          speak('Failed to delete bookmark');
        }
        setConfirmState({ show: false });
      }
    });
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
      {confirmState.show && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 9999
            }}
            onClick={() => setConfirmState({ show: false })}
          />
          <ConfirmToast
            message={confirmState.message}
            type={confirmState.type}
            onConfirm={confirmState.onConfirm}
            onCancel={() => setConfirmState({ show: false })}
            confirmText="Delete"
          />
        </>
      )}      
    </div>
  );
};

export default Bookmarks;
