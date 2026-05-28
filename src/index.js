import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { AccessibilityProvider } from './contexts/AccessibilityContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
<React.StrictMode>
  <AuthProvider>
    <AccessibilityProvider>
      <App />
    </AccessibilityProvider>
  </AuthProvider>
</React.StrictMode>
);