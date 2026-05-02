import React from 'react';

const ErrorMessage = ({ message, onRetry, showHomeLink = false }) => {
  return (
    <div 
      className="error-message" 
      role="alert" 
      aria-live="assertive"
    >
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <h2>Error</h2>
      <p>{message}</p>
      <div className="error-actions">
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>
        )}
        {showHomeLink && (
          <a href="/" className="btn btn-secondary">Go Home</a>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;