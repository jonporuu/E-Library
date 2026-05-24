import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const AdminDashboard = () => {
  const { speak } = useAccessibility();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    activeReaders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [users, books, progress] = await Promise.all([
        db.getAllProfiles(),
        db.getBooks(),
<<<<<<< HEAD
=======
        // In real app, get active readers count
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
        Promise.resolve([])
      ]);

      setStats({
        totalUsers: users.length,
        totalBooks: books.length,
        activeReaders: new Set(progress.map(p => p.user_id)).size
      });
      speak('Admin dashboard loaded');
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and management</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid admin-stats">
        <div className="stat-card admin-stat">
          <span className="stat-icon" aria-hidden="true">👥</span>
          <span className="stat-value">{stats.totalUsers}</span>
          <span className="stat-label">Total Users</span>
          <Link to="/admin/users" className="stat-link">Manage Users →</Link>
        </div>
        <div className="stat-card admin-stat">
          <span className="stat-icon" aria-hidden="true">📚</span>
          <span className="stat-value">{stats.totalBooks}</span>
          <span className="stat-label">Total Books</span>
          <Link to="/admin/books" className="stat-link">Manage Books →</Link>
        </div>
        <div className="stat-card admin-stat">
          <span className="stat-icon" aria-hidden="true">📖</span>
          <span className="stat-value">{stats.activeReaders}</span>
          <span className="stat-label">Active Readers</span>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="admin-section" aria-labelledby="admin-actions-title">
        <h2 id="admin-actions-title">Quick Actions</h2>
        <div className="admin-actions-grid">
          <Link to="/admin/users" className="admin-action-card">
            <span className="action-icon" aria-hidden="true">👤</span>
            <h3>User Management</h3>
            <p>Add, edit, or remove user accounts and assign roles</p>
          </Link>
          <Link to="/admin/books" className="admin-action-card">
            <span className="action-icon" aria-hidden="true">📚</span>
            <h3>Book Management</h3>
            <p>Add new books, update metadata, manage catalog</p>
          </Link>
          <Link to="/books" className="admin-action-card">
            <span className="action-icon" aria-hidden="true">📖</span>
            <h3>View Library</h3>
            <p>Browse the library as a user would see it</p>
          </Link>
        </div>
      </section>

      {/* System Status */}
      <section className="admin-section" aria-labelledby="system-status-title">
        <h2 id="system-status-title">System Status</h2>
        <div className="system-status">
          <div className="status-item">
            <span className="status-label">Database:</span>
<<<<<<< HEAD
            <span className="status-value status-ok">Connected</span>
=======
            <span className="status-value status-ok">Connected (Mock Mode)</span>
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
          </div>
          <div className="status-item">
            <span className="status-label">Authentication:</span>
            <span className="status-value status-ok">Active</span>
          </div>
<<<<<<< HEAD
          <div className="status-item">
            <span className="status-label">Storage:</span>
            <span className="status-value status-ok">Connected</span>
          </div>
=======
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;