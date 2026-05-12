import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
  return (
    <div className="layout">
      <Header />
      <main id="main-content" className="main-content" role="main" tabIndex="-1">
        <Outlet />
      </main>
      <footer className="footer" role="contentinfo">
        <div className="container">
          <p>&copy; 2026 E-Library. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;