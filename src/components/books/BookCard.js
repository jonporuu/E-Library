import React from 'react';
import { Link } from 'react-router-dom';

const BookCard = ({ book }) => {
  const getLevelColor = (level) => {
    switch(level) {
      case 'beginner': return 'level-beginner';
      case 'intermediate': return 'level-intermediate';
      case 'advanced': return 'level-advanced';
      default: return '';
    }
  };

  return (
    <article className="book-card" role="listitem">
      {/* Link to book reader page */}
      <Link to={`/dashboard/books/${book.id}`} className="book-card-link">
        <div className="book-cover">
          <img 
            src={book.cover_url || '/placeholder-book.png'} 
            alt={`Cover of ${book.title}`}
            loading="lazy"
          />
          <span className={`level-badge ${getLevelColor(book.reading_level)}`}>
            {book.reading_level}
          </span>
        </div>
        <div className="book-info">
          <h2 className="book-title">{book.title}</h2>
          <p className="book-author">by {book.author}</p>
          {book.description && (
            <p className="book-description">
              {book.description.substring(0, 100)}...
            </p>
          )}
          <span className="read-more">Click to read →</span>
        </div>
      </Link>
    </article>
  );
};

export default BookCard;