import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    disabilityType: '',
    inputPreference: 'standard'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { speak } = useAccessibility();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      speak('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      speak('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        disability_type: formData.disabilityType || null,
        input_preference: formData.inputPreference
      });
      speak('Registration successful. Welcome to the library.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Failed to create account. Please try again.');
      speak('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join our accessible e-library community</p>
          
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  autoComplete="new-password"
                  aria-describedby="password-help"
                />
                <small id="password-help" className="form-help">At least 6 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <fieldset className="form-fieldset">
              <legend>Accessibility Preferences (Optional)</legend>
              
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
            </fieldset>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-links">
            <span>Already have an account?</span>
            <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;