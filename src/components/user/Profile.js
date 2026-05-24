import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const Profile = () => {
  const { user, profile } = useAuth();
  const { speak } = useAccessibility();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || ''
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      await db.updateProfile(user.id, {
        full_name: formData.fullName
      });
      
      setMessage('Profile updated successfully');
      setMessageType('success');
      speak('Profile updated successfully');
      setEditing(false);
      
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (error) {
      setMessage('Failed to update profile');
      setMessageType('error');
      speak('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    if (passwordData.newPassword.length < 6) {
      setMessage('New password must be at least 6 characters long');
      setMessageType('error');
      speak('Password too short');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage('New passwords do not match');
      setMessageType('error');
      speak('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setMessage('Password changed successfully! Please use your new password next time you log in.');
      setMessageType('success');
      speak('Password changed successfully');
      
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
      setChangingPassword(false);
      
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (error) {
      console.error('Password change error:', error);
      setMessage(error.message || 'Failed to change password');
      setMessageType('error');
      speak('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account information</p>
      </div>

      {message && (
        <div className={`alert alert-${messageType === 'success' ? 'success' : 'error'}`} role="status">
          {message}
        </div>
      )}

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.full_name?.charAt(0) || '👤'}
          </div>
          <div className="profile-info">
            <h2>{profile.full_name}</h2>
            <span className={`role-badge role-${profile.role}`}>{profile.role}</span>
            <p className="profile-email">{user?.email}</p>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="disabled-input"
              />
              <small className="form-help">Email cannot be changed. Contact support for assistance.</small>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setEditing(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Full Name:</span>
              <span className="detail-value">{profile.full_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="profile-actions">
              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit Profile
              </button>
              <button 
                onClick={() => setChangingPassword(true)} 
                className="btn btn-secondary"
              >
                Change Password
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {changingPassword && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
          <div className="modal">
            <h2 id="password-modal-title">Change Password</h2>
            <p className="modal-note">Enter your new password below. Your password must be at least 6 characters long.</p>
            
            <form onSubmit={handlePasswordSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <small className="form-help">Minimum 6 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;