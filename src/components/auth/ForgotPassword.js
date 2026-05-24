import React, { useState } from 'react';
<<<<<<< HEAD
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
=======
import { Link } from 'react-router-dom';
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
import { useAccessibility } from '../../contexts/AccessibilityContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { speak } = useAccessibility();
<<<<<<< HEAD
  const navigate = useNavigate();
=======
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
<<<<<<< HEAD
      // Get the current URL for redirect
      const redirectUrl = `${window.location.origin}/update-password`;
      
      // Send password reset email via Supabase
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (resetError) throw resetError;

      setMessage('Password reset instructions have been sent to your email. Please check your inbox and spam folder.');
      speak('Password reset instructions sent. Please check your email.');
      
      // Clear email field after successful send
      setEmail('');
      
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset instructions. Please try again.');
      speak('Failed to send reset instructions');
=======
      // In a real app, call Supabase auth reset
      // await supabase.auth.resetPasswordForEmail(email);
      setMessage('Password reset instructions have been sent to your email.');
      speak('Password reset instructions sent. Please check your email.');
    } catch (err) {
      setError('Failed to send reset instructions. Please try again.');
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Reset Password</h1>
          <p className="auth-subtitle">Enter your email to receive reset instructions</p>
          
          {message && (
            <div className="alert alert-success" role="status">
              {message}
            </div>
          )}
          
          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          {!message && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
<<<<<<< HEAD
                  placeholder="your@email.com"
=======
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Instructions'}
              </button>
            </form>
          )}

          <div className="auth-links">
<<<<<<< HEAD
            <Link to="/login">← Back to Sign In</Link>
=======
            <Link to="/login">Back to Sign In</Link>
>>>>>>> 891216a9949c197a1dc76bc1bc22136a043f9c95
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;