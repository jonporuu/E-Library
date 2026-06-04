import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { speak } = useAccessibility();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [emailData, setEmailData] = useState({
    newEmail: '',
    password: ''
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

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    speak(msg);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
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
      
      showMessage('Profile updated successfully', 'success');
      setEditing(false);
      
      await refreshProfile();
    } catch (error) {
      showMessage('Failed to update profile', 'error');
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
      showMessage('New password must be at least 6 characters long', 'error');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      showMessage('Password changed successfully! Please use your new password next time you log in.', 'success');
      
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
      setChangingPassword(false);
    } catch (error) {
      console.error('Password change error:', error);
      showMessage(error.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle email change
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    if (!emailData.newEmail || !emailData.password) {
      showMessage('Please fill in all fields', 'error');
      setLoading(false);
      return;
    }

    if (emailData.newEmail === user?.email) {
      showMessage('New email is the same as your current email', 'error');
      setLoading(false);
      return;
    }

    try {
      // Update email in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        email: emailData.newEmail
      });

      if (error) throw error;

      showMessage(
        'Confirmation emails sent! Please check both your old and new email addresses to confirm the change.',
        'success'
      );
      
      setEmailData({
        newEmail: '',
        password: ''
      });
      setChangingEmail(false);
    } catch (error) {
      console.error('Email change error:', error);
      
      if (error.message.includes('requires recent authentication')) {
        showMessage('For security, please log out and log back in before changing your email.', 'error');
      } else {
        showMessage(error.message || 'Failed to change email', 'error');
      }
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
              <small className="form-help">
                To change your email, use the "Change Email" button below.
              </small>
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
                onClick={() => setChangingEmail(true)} 
                className="btn btn-secondary"
              >
                Change Email
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
            <p className="modal-note">Enter your new password below. Minimum 6 characters.</p>
            
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
                    setPasswordData({ newPassword: '', confirmPassword: '' });
                  }} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW: Change Email Modal */}
      {changingEmail && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="email-modal-title">
          <div className="modal">
            <h2 id="email-modal-title">Change Email</h2>
            <p className="modal-note">
              You'll receive confirmation emails at both your old and new email addresses.
            </p>
            
            <form onSubmit={handleEmailSubmit} className="modal-form">
              <div className="form-group">
                <label>Current Email</label>
                <input
                  type="email"
                  value={user?.email}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="newEmail">New Email</label>
                <input
                  type="email"
                  id="newEmail"
                  name="newEmail"
                  value={emailData.newEmail}
                  onChange={handleEmailChange}
                  required
                  placeholder="Enter new email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Confirm Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={emailData.password}
                  onChange={handleEmailChange}
                  required
                  placeholder="Enter your password to confirm"
                  autoComplete="current-password"
                />
                <small className="form-help">For security, please enter your current password</small>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setChangingEmail(false);
                    setEmailData({ newEmail: '', password: '' });
                  }} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Change Email'}
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