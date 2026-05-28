import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useAccessibility } from './contexts/AccessibilityContext';

// Public Components
import HomePage from './components/home/HomePage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import UpdatePassword from './components/auth/UpdatePassword';

// Layout
import Layout from './components/common/Layout';

// User Components
import UserDashboard from './components/user/UserDashboard';
import Profile from './components/user/Profile';
import Bookmarks from './components/user/Bookmarks';
import ReadingProgress from './components/user/ReadingProgress';

// Book Components
import BookList from './components/books/BookList';
import BookReader from './components/books/BookReader';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import BookManagement from './components/admin/BookManagement';

// Librarian Components
import LibrarianDashboard from './components/librarian/LibrarianDashboard';

// Accessibility
import AccessibilitySettings from './components/accessibility/AccessibilitySettings';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, hasRole } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.some(role => hasRole(role))) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Role-based route wrappers
const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin' , 'librarian']}>
    {children}
  </ProtectedRoute>
);

const UserRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['user', 'librarian', 'admin']}>
    {children}
  </ProtectedRoute>
);

// Public Route 
const PublicRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (user && profile) {
    // Redirect based on role
    if (profile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (profile.role === 'librarian') {
      return <Navigate to="/librarian" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return children;
};

// Role-based redirect component for root path
const RootRedirect = () => {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Redirect based on role
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (profile?.role === 'librarian') {
    return <Navigate to="/librarian" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};

function App() {
  const { highContrast, fontSize, fontFamily, lineSpacing, reduceMotion } = useAccessibility();

 
  React.useEffect(() => {
    document.body.className = '';
    if (highContrast) document.body.classList.add('high-contrast');
    if (reduceMotion) document.body.classList.add('reduce-motion');
    
    document.documentElement.style.setProperty('--user-font-size', `${fontSize}px`);
    document.documentElement.style.setProperty('--user-font-family', fontFamily);
    document.documentElement.style.setProperty('--user-line-height', lineSpacing);
  }, [highContrast, fontSize, fontFamily, lineSpacing, reduceMotion]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className={`app ${highContrast ? 'high-contrast' : ''}`}>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<HomePage />} />
          
          {/* Auth routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />
          <Route path="/update-password" element={<UpdatePassword />} />
          

          {/* PROTECTED USER ROUTES */}
          <Route path="/dashboard" element={
            <UserRoute>
              <Layout />
            </UserRoute>
          }>
            <Route index element={<UserDashboard />} />
          </Route>

          <Route path="/dashboard/books" element={
            <UserRoute>
              <Layout />
            </UserRoute>
          }>
            <Route index element={<BookList />} />
          </Route>

          <Route path="/dashboard/books/:id" element={
            <UserRoute>
              <Layout />
            </UserRoute>
          }>
            <Route index element={<BookReader />} />
          </Route>

          <Route path="/dashboard/bookmarks" element={
            <UserRoute>
              <Layout />
            </UserRoute>
          }>
            <Route index element={<Bookmarks />} />
          </Route>

          <Route path="/dashboard/progress" element={
            <UserRoute>
              <Layout />
            </UserRoute>
          }>
            <Route index element={<ReadingProgress />} />
          </Route>

          <Route path="/dashboard/profile" element={
            <UserRoute>
              <Layout />
            </UserRoute>
          }>
            <Route index element={<Profile />} />
          </Route>

          <Route path="/dashboard/settings" element={
            <UserRoute>
              <Layout />
            </UserRoute>
          }>
            <Route index element={<AccessibilitySettings />} />
          </Route>

          {/* PROTECTED ADMIN ROUTES */}
          <Route path="/admin" element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
          </Route>

          <Route path="/admin/users" element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }>
            <Route index element={<UserManagement />} />
          </Route>

          <Route path="/admin/books" element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }>
            <Route index element={<BookManagement />} />
          </Route>
          {/* Admin Profile Route */}
          <Route path="/admin/profile" element={
            <AdminRoute>
              <Layout />
            </AdminRoute>
          }>
            <Route index element={<Profile />} />
          </Route>

          {/* Librarian Profile Route */}
          <Route path="/librarian/profile" element={
            <ProtectedRoute allowedRoles={['librarian', 'admin']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Profile />} />
          </Route>

          {/* Librarian Routes - Add these */}
          <Route path="/librarian" element={
          <ProtectedRoute allowedRoles={['librarian', 'admin']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<LibrarianDashboard />} />
        </Route>

          {/* Root redirect - role-based */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;