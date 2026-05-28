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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { speak } = useAccessibility();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('one special character (!@#$%^&* etc.)');
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      speak(msg);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      const msg = `Password must contain: ${passwordErrors.join(', ')}`;
      setError(msg);
      speak(msg);
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        disability_type: formData.disabilityType || null,
        input_preference: formData.inputPreference
      });
      
      // Show success message
      const successMsg = 'Registration successful! Redirecting to login...';
      setSuccess(successMsg);
      speak(successMsg);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Account created successfully! Please log in.' }
        });
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError('Failed to create account. Please try again.');
      speak('Registration failed. Please try again.');
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    speak(showPassword ? 'Password hidden' : 'Password visible');
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Check password strength for live feedback
  const getPasswordStrength = () => {
    if (!formData.password) return null;
    
    const errors = validatePassword(formData.password);
    if (errors.length === 0) return { text: 'Strong password! ✓', color: '#10b981' };
    if (errors.length <= 2) return { text: 'Weak password', color: '#f59e0b' };
    return { text: 'Very weak password', color: '#ef4444' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Create Account</h1>
          <p className="auth-subtitle">Join our accessible e-library community</p>
          
          {/* Success Snackbar/Toast Notification */}
          {success && (
            <div className="alert alert-success" role="alert" style={{
              backgroundColor: '#d1fae5',
              borderColor: '#10b981',
              color: '#065f46',
              animation: 'slideIn 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>✅</span>
                <span>{success}</span>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Username *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                autoComplete="name"
                autoFocus
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  aria-describedby="password-help"
                  style={{ paddingRight: '40px' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '5px'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              
              {/* Password requirements list */}
              <ul style={{ 
                fontSize: '0.75rem', 
                marginTop: '0.5rem', 
                paddingLeft: '1rem',
                color: '#64748b'
              }}>
                <li style={{ color: formData.password.length >= 8 ? '#10b981' : '#64748b' }}>
                  ✓ At least 8 characters
                </li>
                <li style={{ color: /[A-Z]/.test(formData.password) ? '#10b981' : '#64748b' }}>
                  ✓ One uppercase letter
                </li>
                <li style={{ color: /[a-z]/.test(formData.password) ? '#10b981' : '#64748b' }}>
                  ✓ One lowercase letter
                </li>
                <li style={{ color: /[0-9]/.test(formData.password) ? '#10b981' : '#64748b' }}>
                  ✓ One number
                </li>
                <li style={{ color: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '#10b981' : '#64748b' }}>
                  ✓ One special character (!@#$%^&* etc.)
                </li>
              </ul>
              
              {strength && (
                <small style={{ color: strength.color, display: 'block', marginTop: '0.25rem' }}>
                  {strength.text}
                </small>
              )}
              <small id="password-help" className="form-help">
                Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  style={{ paddingRight: '40px' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '5px'
                  }}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <small style={{ color: '#ef4444', display: 'block', marginTop: '0.25rem' }}>
                  Passwords do not match
                </small>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                <small style={{ color: '#10b981', display: 'block', marginTop: '0.25rem' }}>
                  ✓ Passwords match
                </small>
              )}
            </div>

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

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;