/**
 * Lab 2 - SQLite Database and CRUD Routes
 * Course: Backend Development Fundamentals (Year II Term II · Aurora)
 * Faculty: Yugandhar Gurjalwar
 * Student: Gorrela Vijayendra (252U1R6085)
 *
 * Objective: Connect an Express server to SQLite and expose CRUD operations over HTTP
 * using parameterized SQL queries with '?' placeholders.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve DB path: on Vercel serverless, use /tmp/goodreads.db so SQLite has write permissions
let dbPath = path.join(__dirname, 'goodreads.db');
if (process.env.VERCEL) {
  const tmpDbPath = path.join('/tmp', 'goodreads.db');
  try {
    if (!fs.existsSync(tmpDbPath)) {
      const candidatePaths = [
        path.join(__dirname, 'goodreads.db'),
        path.join(process.cwd(), 'goodreads.db'),
        path.join(process.cwd(), 'lab-02', 'goodreads.db'),
        path.join(__dirname, '..', 'goodreads.db'),
      ];
      for (const candidate of candidatePaths) {
        if (fs.existsSync(candidate)) {
          fs.copyFileSync(candidate, tmpDbPath);
          break;
        }
      }
    }
    dbPath = tmpDbPath;
  } catch (err) {
    console.error('Error preparing database in /tmp:', err);
    dbPath = path.join('/tmp', 'goodreads.db');
  }
}

let db = null;

/**
 * Helper: initialize or return database connection
 * Auto-creates schema and seeds 10 books if the database file is newly created in /tmp
 */
const getDB = async () => {
  if (db) return db;

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  // Ensure table and initial records exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      price INTEGER NOT NULL,
      pages INTEGER NOT NULL
    );
  `);

  const countResult = await db.get('SELECT COUNT(*) AS count FROM book;');
  if (!countResult || countResult.count === 0) {
    await db.exec(`
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
        ('The Pragmatic Programmer', 'David Thomas & Andrew Hunt', 599, 352);
    `);
  }

  return db;
};

// Middleware to parse JSON and text request bodies
app.use(express.json());
app.use(express.text({ type: ['text/*', 'application/*'] }));
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch (err) {
      // ignore parse error if not valid JSON
    }
  }
  next();
});

// Middleware to ensure DB is initialized before executing queries
app.use(async (req, res, next) => {
  try {
    if (!db) {
      db = await getDB();
    }
    next();
  } catch (error) {
    console.error('Database middleware initialization failed:', error);
    res.status(500).json({ error: 'Database connection failed', message: error.message });
  }
});

/**
 * Task 3: initializeDBAndServer()
 * Starts the server only after opening the database when running as a standalone server.
 */
const initializeDBAndServer = async () => {
  try {
    db = await getDB();
    // In serverless (Vercel), HTTP listening is handled by Vercel
    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`Server Running at http://localhost:${PORT}/`);
      });
    }
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
};

initializeDBAndServer();

/**
 * Route: GET /
 * Description: API welcome and index
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 2: SQLite Database & Books CRUD API',
    student: 'Gorrela Vijayendra',
    registrationNumber: '252U1R6085',
    section: 'Aurora · Year II Term II',
    faculty: 'Yugandhar Gurjalwar',
    endpoints: {
      getAllBooks: 'GET /books/',
      getBookById: 'GET /books/:bookId/',
      addBook: 'POST /books/',
      updateBook: 'PUT /books/:bookId/',
      deleteBook: 'DELETE /books/:bookId/',
    },
  });
});

/**
 * Route: GET /books/
 * Description: Retrieve all books from the book table
 * Status: 200 OK
 */
app.get('/books/', async (req, res) => {
  try {
    const getBooksQuery = `
      SELECT
        id,
        title,
        author,
        price,
        pages
      FROM
        book
      ORDER BY
        id ASC;
    `;
    const booksArray = await db.all(getBooksQuery);
    res.status(200).json(booksArray);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * Route: GET /books/:bookId/
 * Description: Retrieve a single book by ID using parameterized query
 * Status: 200 OK (if found), 404 Not Found (if not found)
 */
app.get('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const getBookQuery = `
      SELECT
        id,
        title,
        author,
        price,
        pages
      FROM
        book
      WHERE
        id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);
    if (!book) {
      return res.status(404).json({ error: 'Book not found', bookId: Number(bookId) });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * Route: POST /books/
 * Description: Add a new book to the database using parameterized query
 * Status: 201 Created (success), 400 Bad Request (missing fields)
 */
app.post('/books/', async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'All fields (title, author, price, pages) are required.',
      });
    }

    const addBookQuery = `
      INSERT INTO
        book (title, author, price, pages)
      VALUES
        (?, ?, ?, ?);
    `;
    const dbResponse = await db.run(addBookQuery, [title, author, price, pages]);
    res.status(201).json({
      message: 'Book Added Successfully',
      bookId: dbResponse.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * Route: PUT /books/:bookId/
 * Description: Update an existing book's details by ID using parameterized query
 * Status: 200 OK (success), 404 Not Found (if not found), 400 Bad Request (missing fields)
 */
app.put('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'All fields (title, author, price, pages) are required.',
      });
    }

    const updateBookQuery = `
      UPDATE
        book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE
        id = ?;
    `;
    const dbResponse = await db.run(updateBookQuery, [title, author, price, pages, bookId]);
    if (dbResponse.changes === 0) {
      return res.status(404).json({ error: 'Book not found', bookId: Number(bookId) });
    }

    res.status(200).json({
      message: 'Book Details Updated Successfully',
      bookId: Number(bookId),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * Route: DELETE /books/:bookId/
 * Description: Delete a book from the database by ID using parameterized query
 * Status: 200 OK (success), 404 Not Found (if not found)
 */
app.delete('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;
    const deleteBookQuery = `
      DELETE FROM
        book
      WHERE
        id = ?;
    `;
    const dbResponse = await db.run(deleteBookQuery, [bookId]);
    if (dbResponse.changes === 0) {
      return res.status(404).json({ error: 'Book not found', bookId: Number(bookId) });
    }

    res.status(200).json({
      message: 'Book Deleted Successfully',
      bookId: Number(bookId),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

/**
 * 404 Catch-All Middleware for undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    error: '404 Not Found',
    message: `The requested path '${req.originalUrl}' does not exist on this server.`,
  });
});

module.exports = app;
