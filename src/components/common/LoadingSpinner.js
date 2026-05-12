import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  return (
    <div 
      className={`loading-spinner ${fullScreen ? 'fullscreen' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="spinner" aria-hidden="true" />
      <p className="loading-message">{message}</p>
      <span className="sr-only">Loading content, please wait</span>
    </div>
  );
};

export default LoadingSpinner;