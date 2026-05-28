import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, profile, signOut, isAdmin, isLibrarian } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login'); 
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const isActivePath = (path) => location.pathname.startsWith(path) ? 'active' : '';

  const isAdminUser = isAdmin();
  const isLibrarianUser = isLibrarian();

  // Get dashboard path based on role
  const getDashboardPath = () => {
    if (isAdminUser) return '/admin';
    if (isLibrarianUser) return '/librarian';
    return '/dashboard';
  };

  // Get profile path based on role
  const getProfilePath = () => {
    if (isAdminUser) return '/admin/profile';
    if (isLibrarianUser) return '/librarian/profile';
    return '/dashboard/profile';
  };

  return (
    <header className="header" role="banner">
      <div className="container">
        <div className="header-content">
          <Link 
            to={getDashboardPath()} 
            className="logo" 
            aria-label="E-Library Home"
          >
            <span className="logo-icon" aria-hidden="true">📚</span>
            <span className="logo-text">E-Library</span>
          </Link>

          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="main-navigation"
            aria-label="Toggle navigation menu"
          >
            <span aria-hidden="true">☰</span>
          </button>

          <nav 
            id="main-navigation"
            className={`main-nav ${mobileMenuOpen ? 'open' : ''}`}
            role="navigation"
            aria-label="Main navigation"
          >
            <ul className="nav-list">
              {/* Regular User Navigation */}
              {!isAdminUser && !isLibrarianUser && (
                <>
                  <li>
                    <Link to="/dashboard" className={isActive('/dashboard')} onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard/books" className={isActivePath('/dashboard/books')} onClick={() => setMobileMenuOpen(false)}>
                      Books
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard/bookmarks" className={isActive('/dashboard/bookmarks')} onClick={() => setMobileMenuOpen(false)}>
                      Bookmarks
                    </Link>
                  </li>
                </>
              )}

              {/* Admin Navigation */}
              {isAdminUser && (
                <li className="admin-nav-item">
                  <Link to="/admin" className={isActivePath('/admin')} onClick={() => setMobileMenuOpen(false)}>
                    Admin Dashboard
                  </Link>
                </li>
              )}

              {/* Librarian Navigation */}
              {isLibrarianUser && !isAdminUser && (
                <li className="admin-nav-item">
                  <Link to="/librarian" className={isActivePath('/librarian')} onClick={() => setMobileMenuOpen(false)}>
                    Librarian Dashboard
                  </Link>
                </li>
              )}

              {/* Common Navigation for Admin and Librarian */}
              {(isAdminUser || isLibrarianUser) && (
                <>
                  <li>
                    <Link to="/admin/books" className={isActivePath('/admin/books')} onClick={() => setMobileMenuOpen(false)}>
                      Manage Books
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard/books" className={isActivePath('/dashboard/books')} onClick={() => setMobileMenuOpen(false)}>
                      Browse Books
                    </Link>
                  </li>
                </>
              )}

              <li className="user-menu">
                <div className="dropdown">
                  <button className="dropdown-toggle" aria-haspopup="true">
                    <span className="user-avatar" aria-hidden="true">
                      {profile?.full_name?.charAt(0) || '👤'}
                    </span>
                    <span className="user-name">{profile?.full_name || 'User'}</span>
                  </button>
                  <ul className="dropdown-menu" role="menu">
                    <li role="none">
                      <Link to={getDashboardPath()} role="menuitem" onClick={() => setMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </li>
                    <li role="none">
                      <Link to={getProfilePath()} role="menuitem" onClick={() => setMobileMenuOpen(false)}>
                        My Profile
                      </Link>
                    </li>
                    <li role="none">
                      <Link to="/dashboard/settings" role="menuitem" onClick={() => setMobileMenuOpen(false)}>
                        Accessibility Settings
                      </Link>
                    </li>
                    <li role="separator" className="divider" />
                    <li role="none">
                      <button onClick={handleSignOut} role="menuitem" className="logout-btn">
                        Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;