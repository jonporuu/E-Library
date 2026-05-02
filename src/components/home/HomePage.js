import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-wrapper" style={{ backgroundColor: '#ffffff', minHeight: '100vh', color: '#1a1a1a', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Navbar Section */}
      <header className={`navbar ${isScrolled ? 'scrolled' : ''}`} style={{
        ...navStyle,
        boxShadow: isScrolled ? '0 2px 10px rgba(0,0,0,0.05)' : 'none',
        borderBottom: isScrolled ? '1px solid #eee' : '1px solid #f0f0f0',
        transition: 'all 0.3s ease'
      }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
          <i className="fas fa-book-open" style={{ color: '#333' }}></i>
          <span style={{ fontSize: '1.2rem', letterSpacing: '1px' }}>E-LIBRARY</span>
        </div>
        <nav className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#features" style={linkStyle}>Browse</a>
          <Link to="/login" style={linkStyle}>Sign In</Link>
          <Link to="/register" className="btn-primary" style={primaryBtnStyle}>Get Started</Link>
        </nav>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Hero Section */}
        <section className="hero" style={heroSectionStyle}>
          <div className="hero-content" style={{ textAlign: 'center', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '20px', fontWeight: '800', lineHeight: '1.2' }}>
              Your Gateway to <br /> Unlimited Reading
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#666', lineHeight: '1.6', marginBottom: '40px' }}>
              Explore a vast collection of academic journals, classic literature, and modern fiction. 
              Our streamlined system provides a fast, efficient, and distraction-free study environment.
            </p>
            <div className="hero-btns" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <Link to="/register" className="btn-primary" style={largeBtnStyle}>Register</Link>
              <Link to="/login" className="btn-outline" style={outlineBtnStyle}>Login</Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ padding: '80px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Platform Features</h2>
            <div style={{ width: '50px', height: '2px', background: '#000', margin: '20px auto' }}></div>
          </div>
          
          <div className="features-grid" style={gridStyle}>
            <FeatureCard 
              icon="fa-search" 
              title="Smart Search" 
              description="Quickly find titles, authors, or specific topics with our advanced filtering system."
            />
            <FeatureCard 
              icon="fa-cloud-download-alt" 
              title="Offline Access" 
              description="Download your favorite resources and study anytime, even without an internet connection."
            />
            <FeatureCard 
              icon="fa-user-graduate" 
              title="Study Metrics" 
              description="Track your reading progress and manage your personal bookmarked collection effortlessly."
            />
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer style={footerStyle}>
        <div style={{ opacity: 0.7 }}>
          <p>&copy; {new Date().getFullYear()} E-Library System. Built for students and researchers.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card" style={cardStyle}>
    <div style={{ marginBottom: '20px', fontSize: '1.5rem', color: '#1a1a1a' }}>
      <i className={`fas ${icon}`}></i>
    </div>
    <h3 style={{ marginBottom: '10px', fontSize: '1.25rem', fontWeight: '600' }}>{title}</h3>
    <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5' }}>{description}</p>
  </div>
);

// --- CSS-in-JS Styles ---

const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '25px 50px',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  background: '#ffffff',
};

const linkStyle = {
  textDecoration: 'none',
  color: '#444',
  fontWeight: '500',
  fontSize: '0.9rem'
};

const primaryBtnStyle = {
  background: '#1a1a1a',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontSize: '0.9rem',
  fontWeight: '500'
};

const heroSectionStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '120px 0',
  borderBottom: '1px solid #f9f9f9'
};

const largeBtnStyle = {
  ...primaryBtnStyle,
  padding: '15px 35px',
  fontSize: '1rem'
};

const outlineBtnStyle = {
  padding: '15px 35px',
  borderRadius: '4px',
  textDecoration: 'none',
  fontSize: '1rem',
  color: '#1a1a1a',
  border: '1px solid #1a1a1a',
  fontWeight: '500'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '30px'
};

const cardStyle = {
  padding: '40px',
  background: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  transition: 'transform 0.2s ease'
};

const footerStyle = {
  padding: '60px 20px',
  textAlign: 'center',
  borderTop: '1px solid #f0f0f0',
  marginTop: '40px',
  fontSize: '0.9rem'
};

export default HomePage;