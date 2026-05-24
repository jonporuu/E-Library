import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
<<<<<<< HEAD
import { supabase } from '../../services/supabaseClient';
=======
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const Profile = () => {
<<<<<<< HEAD
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
=======
  const { user, profile, updateProfile } = useAuth();
  const { speak } = useAccessibility();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95

  useEffect(() => {
    if (profile) {
      setFormData({
<<<<<<< HEAD
        fullName: profile.full_name || ''
=======
        fullName: profile.full_name || '',
        disabilityType: profile.disability_type || '',
        inputPreference: profile.input_preference || 'standard'
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

<<<<<<< HEAD
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

=======
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
<<<<<<< HEAD
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
=======

    try {
      await db.updateProfile(user.id, {
        full_name: formData.fullName,
        disability_type: formData.disabilityType || null,
        input_preference: formData.inputPreference
      });
      setMessage('Profile updated successfully');
      speak('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      setMessage('Failed to update profile');
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
      speak('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
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

=======
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
  if (!profile) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account information</p>
      </div>

      {message && (
<<<<<<< HEAD
        <div className={`alert alert-${messageType === 'success' ? 'success' : 'error'}`} role="status">
=======
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`} role="status">
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
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
<<<<<<< HEAD
              <label>Email</label>
              <input
                type="email"
                value={user?.email}
                disabled
                className="disabled-input"
              />
              <small className="form-help">Email cannot be changed. Contact support for assistance.</small>
=======
              <label htmlFor="disabilityType">Disability Type</label>
              <select
                id="disabilityType"
                name="disabilityType"
                value={formData.disabilityType}
                onChange={handleChange}
              >
                <option value="">Prefer not to say</option>
                <option value="visual">Visual Impairment</option>
                <option value="hearing">Hearing Impairment</option>
                <option value="motor">Motor Disability</option>
                <option value="cognitive">Cognitive Disability</option>
                <option value="multiple">Multiple Disabilities</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="inputPreference">Preferred Input Method</label>
              <select
                id="inputPreference"
                name="inputPreference"
                value={formData.inputPreference}
                onChange={handleChange}
              >
                <option value="standard">Standard (Mouse/Keyboard)</option>
                <option value="keyboard">Keyboard Only</option>
                <option value="voice">Voice Control</option>
                <option value="switch">Switch Access</option>
                <option value="eye">Eye Tracking</option>
              </select>
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
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
<<<<<<< HEAD
              <span className="detail-label">Full Name:</span>
              <span className="detail-value">{profile.full_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user?.email}</span>
=======
              <span className="detail-label">Disability Type:</span>
              <span className="detail-value">{profile.disability_type || 'Not specified'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Input Preference:</span>
              <span className="detail-value">{profile.input_preference}</span>
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
            </div>
            <div className="detail-row">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
<<<<<<< HEAD
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
=======
            <button onClick={() => setEditing(true)} className="btn btn-primary">
              Edit Profile
            </button>
          </div>
        )}
      </div>
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
    </div>
  );
};

export default Profile;