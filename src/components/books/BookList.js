import React, { useState, useEffect } from 'react';
import { db } from '../../services/supabaseClient';
import BookCard from './BookCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useAccessibility } from '../../contexts/AccessibilityContext';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const { speak } = useAccessibility();

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, levelFilter]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await db.getBooks();
      setBooks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load books. Please try again.');
      speak('Error loading books');
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    let filtered = books;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term) ||
        book.description?.toLowerCase().includes(term)
      );
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(book => book.reading_level === levelFilter);
    }

    setFilteredBooks(filtered);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      speak('Search cleared');
    }
  };

  const handleLevelChange = (e) => {
    setLevelFilter(e.target.value);
    speak(`Filter changed to ${e.target.options[e.target.selectedIndex].text}`);
  };

  if (loading) return <LoadingSpinner message="Loading books..." fullScreen />;
  if (error) return <ErrorMessage message={error} onRetry={fetchBooks} />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Book Catalog</h1>
        <p>Browse our collection of accessible books</p>
      </div>

      <div className="filters-container" role="search" aria-label="Book filters">
        <div className="search-box">
          <label htmlFor="search-books" className="sr-only">Search books</label>
          <input
            type="search"
            id="search-books"
            placeholder="Search by title, author, or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
            aria-label="Search books"
          />
          <span className="search-icon" aria-hidden="true">🔍</span>
        </div>

        <div className="filter-group">
          <label htmlFor="level-filter">Reading Level:</label>
          <select 
            id="level-filter" 
            value={levelFilter} 
            onChange={handleLevelChange}
            aria-label="Filter by reading level"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="results-info" aria-live="polite">
        Showing {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
        {searchTerm && ` for "${searchTerm}"`}
      </div>

      {filteredBooks.length === 0 ? (
        <div className="empty-state" role="status">
          <p>No books found matching your criteria.</p>
          <button 
            onClick={() => { setSearchTerm(''); setLevelFilter('all'); }}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div 
          className="books-grid" 
          role="list" 
          aria-label="Book collection"
        >
          {filteredBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookList;