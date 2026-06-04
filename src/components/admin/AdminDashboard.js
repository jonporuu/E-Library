import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, supabase } from '../../services/supabaseClient';
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
      
      // Fetch all data in parallel
      const [users, books] = await Promise.all([
        db.getAllProfiles(),
        db.getBooks(true)  
      ]);

      // Get ALL reading progress to count unique active readers
      const { data: allProgress } = await supabase
        .from('reading_progress')
        .select('user_id');

      // Count unique users who have reading progress
      const uniqueReaders = allProgress 
        ? new Set(allProgress.map(p => p.user_id)).size 
        : 0;

      setStats({
        totalUsers: users?.length || 0,
        totalBooks: books?.length || 0,
        activeReaders: uniqueReaders
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
          <span className="stat-label">Total Users </span>
        </div>
        <div className="stat-card admin-stat">
          <span className="stat-icon" aria-hidden="true">📚</span>
          <span className="stat-value">{stats.totalBooks}</span>
          <span className="stat-label">Total Books </span>
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
          <Link to="/dashboard/books" className="admin-action-card">
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
            <span className="status-value status-ok">Connected</span>
          </div>
          <div className="status-item">
            <span className="status-label">Authentication:</span>
            <span className="status-value status-ok">Active</span>
          </div>
          <div className="status-item">
            <span className="status-label">Storage:</span>
            <span className="status-value status-ok">Connected</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;