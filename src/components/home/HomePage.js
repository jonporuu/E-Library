import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';

const HomePage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch books from database
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('books')
          .select('id, title, author, cover_url, reading_level')
          .limit(6) // Show only 6 books on homepage
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setBooks(data || []);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to load books');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
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
          <a href="#features" style={linkStyle}>Features</a>
          <a href="#books" style={linkStyle}>Browse Books</a>
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

        {/* Browse Books Section */}
        <section id="books" style={{ padding: '80px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>Browse Our Collection</h2>
            <div style={{ width: '50px', height: '2px', background: '#000', margin: '20px auto' }}></div>
            <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto' }}>
              Discover books from our growing library. Sign in to start reading!
            </p>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #f0f0f0', borderTopColor: '#333', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
              <p style={{ marginTop: '20px', color: '#666' }}>Loading books...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
              <p>Failed to load books. Please try again later.</p>
            </div>
          ) : books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
              <p>No books available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="books-grid" style={booksGridStyle}>
              {books.map(book => (
                <div key={book.id} className="book-card" style={bookCardStyle}>
                  <div className="book-cover" style={bookCoverStyle}>
                    <img 
                      src={book.cover_url || 'https://via.placeholder.com/300x400?text=No+Cover'} 
                      alt={`Cover of ${book.title}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x400?text=No+Cover';
                      }}
                    />
                    <div className="book-overlay" style={bookOverlayStyle}>
                      <Link to="/login" style={readBtnStyle}>
                        Sign in to Read
                      </Link>
                    </div>
                  </div>
                  <div className="book-info" style={bookInfoStyle}>
                    <h3 style={bookTitleStyle}>{book.title}</h3>
                    <p style={bookAuthorStyle}>by {book.author}</p>
                    <span className="level-badge" style={{
                      ...levelBadgeStyle,
                      backgroundColor: 
                        book.reading_level === 'beginner' ? '#10b981' : 
                        book.reading_level === 'intermediate' ? '#f59e0b' : '#ef4444'
                    }}>
                      {book.reading_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <Link to="/login" style={viewAllBtnStyle}>
              View All Books →
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ padding: '80px 0', borderTop: '1px solid #f0f0f0' }}>
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

      {/* Add spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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

const booksGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '30px'
};

const bookCardStyle = {
  background: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid #f0f0f0',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  cursor: 'pointer'
};

const bookCoverStyle = {
  position: 'relative',
  aspectRatio: '3/4',
  overflow: 'hidden',
  backgroundColor: '#f5f5f5'
};

const bookOverlayStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.3s ease'
};

const readBtnStyle = {
  padding: '12px 24px',
  background: '#fff',
  color: '#1a1a1a',
  textDecoration: 'none',
  borderRadius: '4px',
  fontWeight: '600',
  fontSize: '0.9rem'
};

const bookInfoStyle = {
  padding: '15px'
};

const bookTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  marginBottom: '5px',
  color: '#1a1a1a',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const bookAuthorStyle = {
  fontSize: '0.85rem',
  color: '#666',
  marginBottom: '10px'
};

const levelBadgeStyle = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '0.7rem',
  fontWeight: '600',
  color: '#fff',
  textTransform: 'uppercase'
};

const viewAllBtnStyle = {
  display: 'inline-block',
  padding: '12px 30px',
  background: '#1a1a1a',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: '4px',
  fontWeight: '500',
  transition: 'background 0.3s ease'
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

// Add hover effects
const style = document.createElement('style');
style.textContent = `
  .book-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }
  .book-card:hover .book-overlay {
    opacity: 1;
  }
  .feature-card:hover {
    transform: translateY(-5px);
  }
  .view-all-btn:hover {
    background: #333;
  }
  .read-btn:hover {
    background: #f0f0f0;
  }
`;
document.head.appendChild(style);

export default HomePage;