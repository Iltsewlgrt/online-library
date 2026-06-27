import { Link } from 'react-router-dom';
import type { BookPreview } from '../types';

const fallbackCover = 'https://placehold.co/400x600?text=No+Cover';

export function BookCard({ book }: { book: BookPreview }) {
    return (
        <Link to={`/books/${book.bookId}`} className="book-card">
            <div className="book-card__cover-wrap">
                <img className="book-card__cover" src={book.bookCover || fallbackCover} alt={book.bookTitle} />
            </div>
            <div className="book-card__body">
                <h3>{book.bookTitle}</h3>
                <p>{book.bookAuthors}</p>
            </div>
        </Link>
    );
}
