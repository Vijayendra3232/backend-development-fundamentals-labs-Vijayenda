-- Lab 3: REST API, query parameters, validation, debugging
-- Table: book

DROP TABLE IF EXISTS book;

CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  price INTEGER NOT NULL,
  pages INTEGER NOT NULL
);

INSERT INTO book (title, author, price, pages) VALUES
  ('Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', 450, 320),
  ('To Kill a Mockingbird', 'Harper Lee', 350, 281),
  ('The Great Gatsby', 'F. Scott Fitzgerald', 299, 180),
  ('Pride and Prejudice', 'Jane Austen', 250, 279),
  ('1984', 'George Orwell', 320, 328),
  ('The Catcher in the Rye', 'J.D. Salinger', 380, 214),
  ('The Hobbit', 'J.R.R. Tolkien', 499, 310),
  ('Clean Code', 'Robert C. Martin', 650, 464),
  ('Atomic Habits', 'James Clear', 420, 320),
  ('The Pragmatic Programmer', 'David Thomas & Andrew Hunt', 599, 352),
  ('JavaScript: The Good Parts', 'Douglas Crockford', 399, 176),
  ('Harry Potter and the Chamber of Secrets', 'J.K. Rowling', 480, 341);
