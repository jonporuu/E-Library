import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';

const ReadingProgress = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const data = await db.getReadingProgress(user.id);
      setProgress(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Reading Progress</h1>
        <p>Track your reading journey</p>
      </div>

      {progress.length === 0 ? (
        <div className="empty-state">
          <p>No reading progress yet.</p>
          <Link to="/books" className="btn btn-primary">Browse Books</Link>
        </div>
      ) : (
        <div className="progress-list">
          {progress.map(item => (
            <div key={item.id} className="progress-item">
              <div className="progress-book-info">
                <h3>{item.books?.title || 'Unknown Book'}</h3>
                <p>by {item.books?.author}</p>
              </div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${item.percentage}%` }}
                  role="progressbar"
                  aria-valuenow={item.percentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
                <span className="progress-percentage">{item.percentage}%</span>
              </div>
              <div className="progress-meta">
                <span>Last read: {new Date(item.last_read).toLocaleDateString()}</span>
                <Link to={`/books/${item.book_id}`} className="btn btn-secondary btn-sm">
                  Continue
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReadingProgress; 