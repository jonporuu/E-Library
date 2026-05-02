import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const UserDashboard = () => {
  const { profile } = useAuth();
  const { speak } = useAccessibility();
  const [stats, setStats] = useState({
    booksRead: 0,
    bookmarks: 0,
    currentBooks: 0
  });
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch reading progress
      const progress = await db.getReadingProgress(profile?.id);
      const bookmarks = await db.getBookmarks(profile?.id);
      
      setStats({
        booksRead: progress.filter(p => p.percentage === 100).length,
        bookmarks: bookmarks.length,
        currentBooks: progress.filter(p => p.percentage < 100).length
      });

      // Get recently accessed books
      setRecentBooks(progress.slice(0, 3));
      speak('Welcome to your dashboard');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>Welcome, {profile?.full_name || 'Reader'}!</h1>
        <p>Your personal reading space</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" role="region" aria-label="Reading statistics">
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">📚</span>
          <span className="stat-value">{stats.currentBooks}</span>
          <span className="stat-label">Currently Reading</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">✅</span>
          <span className="stat-value">{stats.booksRead}</span>
          <span className="stat-label">Books Completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon" aria-hidden="true">🔖</span>
          <span className="stat-value">{stats.bookmarks}</span>
          <span className="stat-label">Bookmarks</span>
        </div>
      </div>

      {/* Quick Actions - FIXED: Updated paths to match routing */}
      <section className="dashboard-section" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title">Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/dashboard/books" className="action-card">
            <span className="action-icon" aria-hidden="true">📖</span>
            <span className="action-text">Browse Books</span>
          </Link>
          <Link to="/dashboard/bookmarks" className="action-card">
            <span className="action-icon" aria-hidden="true">🔖</span>
            <span className="action-text">My Bookmarks</span>
          </Link>
          <Link to="/dashboard/settings" className="action-card">
            <span className="action-icon" aria-hidden="true">⚙️</span>
            <span className="action-text">Accessibility Settings</span>
          </Link>
        </div>
      </section>

      {/* Continue Reading - FIXED: Updated book path */}
      {recentBooks.length > 0 && (
        <section className="dashboard-section" aria-labelledby="continue-reading-title">
          <h2 id="continue-reading-title">Continue Reading</h2>
          <div className="continue-reading-list">
            {recentBooks.map(item => (
              <Link 
                key={item.id} 
                to={`/dashboard/books/${item.book_id}`}
                className="continue-reading-item"
              >
                <div className="book-progress-info">
                  <h3>{item.books?.title || 'Unknown Book'}</h3>
                  <div className="progress-bar-small">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${item.percentage}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="progress-text">{item.percentage}% complete</span>
                </div>
                <span className="continue-btn">Continue →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Accessibility Tip */}
      <aside className="accessibility-tip" role="complementary">
        <h3>💡 Tip</h3>
        <p>Use keyboard shortcuts to navigate: Alt + A for high contrast, Alt + +/- for font size, Arrow keys to turn pages.</p>
      </aside>
    </div>
  );
};

export default UserDashboard;