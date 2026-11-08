/**
 * Lab 3: REST API, query parameters, validation, debugging
 * Course: Backend Development Fundamentals (Year II Term II · Aurora)
 * Faculty: Yugandhar Gurjalwar
 * Student: Gorrela Vijayendra (252U1R6085)
 *
 * Description: RESTful API for books with search, sorting, pagination,
 * price filtering, request validation, and consistent status codes.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'goodreads.db');

let db = null;

// Middleware to parse JSON and text request bodies
app.use(express.json());
app.use(express.text({ type: ['text/*', 'application/*'] }));
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // ignore parse error if not valid JSON
    }
  }
  next();
});

/**
 * Task 3: initializeDBAndServer()
 * Opens the SQLite database connection and starts listening on the port
 * only after the connection succeeds.
 */
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

/**
 * Helper: Column and Order Whitelisting
 * Prevents SQL Injection in identifiers (identifiers cannot use '?' placeholders)
 */
const ALLOWED_COLUMNS = ['id', 'title', 'author', 'price', 'pages'];
const ALLOWED_ORDERS = ['ASC', 'DESC'];

/**
 * Route: GET /
 * Description: API Root Index & Welcome
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 3: REST API with Query Parameters, Validation & Filtering',
    student: 'Gorrela Vijayendra',
    registrationNumber: '252U1R6085',
    section: 'Aurora · Year II Term II',
    faculty: 'Yugandhar Gurjalwar',
    endpoints: {
      getBooks: 'GET /books?search_q=&order_by=id&order=ASC&limit=10&offset=0&min_price=&max_price=',
      getBookById: 'GET /books/:bookId',
      createBook: 'POST /books',
      updateBook: 'PUT /books/:bookId',
      deleteBook: 'DELETE /books/:bookId',
    },
  });
});

/**
 * Task 1, 2, 3: GET /books (and /books/)
 * Description: Retrieve books with search_q, order_by, order, limit, offset, and price-range filters
 * Status: 200 OK (success), 400 Bad Request (invalid params)
 */
app.get(['/books', '/books/'], async (req, res) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = 10,
      offset = 0,
      min_price,
      max_price,
    } = req.query;

    // Validate order_by and order against whitelist
    const sanitizedOrderBy = ALLOWED_COLUMNS.includes(order_by.toLowerCase())
      ? order_by.toLowerCase()
      : 'id';

    const sanitizedOrder = ALLOWED_ORDERS.includes(order.toUpperCase())
      ? order.toUpperCase()
      : 'ASC';

    // Parse and validate pagination
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ message: "Invalid 'limit' parameter. It must be a positive integer." });
    }
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ message: "Invalid 'offset' parameter. It must be a non-negative integer." });
    }

    // Build query conditions and parameters array
    const conditions = ['title LIKE ?'];
    const queryParams = [`%${search_q}%`];

    // Price range filtering (Task 3)
    if (min_price !== undefined && max_price !== undefined) {
      const min = parseFloat(min_price);
      const max = parseFloat(max_price);
      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({ message: "Invalid 'min_price' or 'max_price'. Both must be numeric." });
      }
      conditions.push('price BETWEEN ? AND ?');
      queryParams.push(min, max);
    } else if (min_price !== undefined) {
      const min = parseFloat(min_price);
      if (isNaN(min)) {
        return res.status(400).json({ message: "Invalid 'min_price'. It must be numeric." });
      }
      conditions.push('price >= ?');
      queryParams.push(min);
    } else if (max_price !== undefined) {
      const max = parseFloat(max_price);
      if (isNaN(max)) {
        return res.status(400).json({ message: "Invalid 'max_price'. It must be numeric." });
      }
      conditions.push('price <= ?');
      queryParams.push(max);
    }

    // Append limit and offset to query parameters
    queryParams.push(parsedLimit, parsedOffset);

    const getBooksQuery = `
      SELECT
        id,
        title,
        author,
        price,
        pages
      FROM
        book
      WHERE
        ${conditions.join(' AND ')}
      ORDER BY
        ${sanitizedOrderBy} ${sanitizedOrder}
      LIMIT ? OFFSET ?;
    `;

    const books = await db.all(getBooksQuery, queryParams);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

/**
 * Task 1, 5: GET /books/:bookId
 * Description: Retrieve single book by ID
 * Status: 200 OK (found), 404 Not Found (missing record), 400 Bad Request (invalid ID)
 */
app.get(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid 'bookId'. It must be an integer." });
    }

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
    const book = await db.get(getBookQuery, [parsedId]);

    if (!book) {
      return res.status(404).json({ message: `Book with ID ${parsedId} not found.` });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

/**
 * Task 4, 5, 6: POST /books
 * Description: Add a new book with strict body validation
 * Status: 201 Created (success), 400 Bad Request (validation failure)
 */
app.post(['/books', '/books/'], async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Strict validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: "Missing or invalid 'title'. It must be a non-empty string." });
    }
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({ message: "Missing or invalid 'author'. It must be a non-empty string." });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "Missing or invalid 'price'. It must be a non-negative number." });
    }
    if (pages === undefined || pages === null || isNaN(Number(pages)) || Number(pages) <= 0) {
      return res.status(400).json({ message: "Missing or invalid 'pages'. It must be a positive integer." });
    }

    const addBookQuery = `
      INSERT INTO
        book (title, author, price, pages)
      VALUES
        (?, ?, ?, ?);
    `;
    const dbResponse = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Math.floor(Number(pages)),
    ]);

    res.status(201).json({
      message: 'Book Added Successfully',
      bookId: dbResponse.lastID,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

/**
 * Task 4, 5: PUT /books/:bookId
 * Description: Update an existing book with validation
 * Status: 200 OK (success), 404 Not Found (missing record), 400 Bad Request (validation failure)
 */
app.put(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid 'bookId'. It must be an integer." });
    }

    const { title, author, price, pages } = req.body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: "Missing or invalid 'title'. It must be a non-empty string." });
    }
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({ message: "Missing or invalid 'author'. It must be a non-empty string." });
    }
    if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "Missing or invalid 'price'. It must be a non-negative number." });
    }
    if (pages === undefined || pages === null || isNaN(Number(pages)) || Number(pages) <= 0) {
      return res.status(400).json({ message: "Missing or invalid 'pages'. It must be a positive integer." });
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
    const dbResponse = await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      Number(price),
      Math.floor(Number(pages)),
      parsedId,
    ]);

    if (dbResponse.changes === 0) {
      return res.status(404).json({ message: `Book with ID ${parsedId} not found.` });
    }

    res.status(200).json({
      message: 'Book Details Updated Successfully',
      bookId: parsedId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

/**
 * Task 5: DELETE /books/:bookId
 * Description: Remove a book by ID
 * Status: 200 OK (success), 404 Not Found (missing record), 400 Bad Request (invalid ID)
 */
app.delete(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const { bookId } = req.params;
    const parsedId = parseInt(bookId, 10);
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: "Invalid 'bookId'. It must be an integer." });
    }

    const deleteBookQuery = `
      DELETE FROM
        book
      WHERE
        id = ?;
    `;
    const dbResponse = await db.run(deleteBookQuery, [parsedId]);

    if (dbResponse.changes === 0) {
      return res.status(404).json({ message: `Book with ID ${parsedId} not found.` });
    }

    res.status(200).json({
      message: 'Book Deleted Successfully',
      bookId: parsedId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error: ' + error.message });
  }
});

/**
 * 404 Catch-All Handler for undefined paths
 */
app.use((req, res) => {
  res.status(404).json({
    message: `Path '${req.originalUrl}' does not exist on this server.`,
  });
});

module.exports = app;
