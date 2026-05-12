import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/supabaseClient';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const { speak } = useAccessibility();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        disabilityType: profile.disability_type || '',
        inputPreference: profile.input_preference || 'standard'
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

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
      speak('Failed to update profile');
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
        <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`} role="status">
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
              <span className="detail-label">Disability Type:</span>
              <span className="detail-value">{profile.disability_type || 'Not specified'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Input Preference:</span>
              <span className="detail-value">{profile.input_preference}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
            <button onClick={() => setEditing(true)} className="btn btn-primary">
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;