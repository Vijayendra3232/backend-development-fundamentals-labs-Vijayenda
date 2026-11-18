/**
 * Lab 4: Registration, login and JWT
 * Course: Backend Development Fundamentals (Year II Term II · Aurora)
 * Faculty: Joel Prashanth D · Yugandhar Gurjalwar
 * Student: Gorrela Vijayendra (252U1R6085)
 *
 * Description: Express + SQLite backend with user registration (bcrypt password hashing),
 * user login (bcrypt verification + JWT generation), and Lab 3 Books REST API.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'goodreads.db');

// Task 5: Keep the JWT secret key in a constant for now (will be moved to .env in Lab 8)
const JWT_SECRET = 'MY_SECRET_TOKEN';
const SALT_ROUNDS = 10;

let db = null;

// Task 1: Parse incoming JSON bodies (with graceful fallback if Postman sends text/plain JSON)
app.use(express.json());
app.use(express.text({ type: ['text/*', 'application/*'] }));
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      // Leave body untouched; route validation will return 400
    }
  }
  next();
});

/**
 * Initialize SQLite database, ensure user & book tables exist, and start Express server.
 */
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Ensure schema tables exist (supports fresh deployments on Railway/Render)
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await db.exec(schemaSql);
    }

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
 * Route: GET /
 * Description: API Health Check & Endpoint Overview
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Lab 4: Registration, Login and JWT Authentication API',
    student: 'Gorrela Vijayendra',
    registrationNumber: '252U1R6085',
    section: 'Aurora · Year II Term II',
    faculty: 'Joel Prashanth D · Yugandhar Gurjalwar',
    endpoints: {
      register: 'POST /register/',
      login: 'POST /login/',
      getBooks: 'GET /books?search_q=&order_by=id&order=ASC&limit=10&offset=0&min_price=&max_price=',
      getBookById: 'GET /books/:bookId',
    },
  });
});

/**
 * Task 3: POST /register/ (and /register)
 * Description: Register a new user with bcrypt-hashed password.
 * Status:
 *   201 Created     - User created successfully
 *   400 Bad Request - Missing/invalid fields or username already exists
 */
app.post(['/register', '/register/'], async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { username, name, password } = body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({
        message: "Missing or invalid 'username'. It must be a non-empty string.",
      });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        message: "Missing or invalid 'name'. It must be a non-empty string.",
      });
    }

    if (!password || typeof password !== 'string' || password.length < 5) {
      return res.status(400).json({
        message: "Missing or invalid 'password'. Password must be at least 5 characters long.",
      });
    }

    const cleanUsername = username.trim();
    const cleanName = name.trim();

    // Parameterized query to check if username already exists
    const existingUser = await db.get(
      'SELECT id, username FROM user WHERE username = ?;',
      [cleanUsername]
    );

    if (existingUser !== undefined) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password with bcrypt — plain-text password is NEVER stored or logged
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const insertResult = await db.run(
      'INSERT INTO user (username, name, password) VALUES (?, ?, ?);',
      [cleanUsername, cleanName, hashedPassword]
    );

    return res.status(201).json({
      message: 'User created successfully',
      userId: insertResult.lastID,
      username: cleanUsername,
    });
  } catch (error) {
    // Handle UNIQUE constraint race condition cleanly
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'User already exists' });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Task 4 & 5: POST /login/ (and /login)
 * Description: Authenticate user with bcrypt.compare and return signed JWT token.
 * Payload contains ONLY { username } (never the password).
 * Status:
 *   200 OK          - Returns { jwt_token }
 *   400 Bad Request - Missing credentials, unknown user, or wrong password
 */
app.post(['/login', '/login/'], async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { username, password } = body;

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({
        message: "Missing or invalid 'username'.",
      });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        message: "Missing or invalid 'password'.",
      });
    }

    const cleanUsername = username.trim();

    // Parameterized query to look up user by username
    const dbUser = await db.get(
      'SELECT id, username, name, password FROM user WHERE username = ?;',
      [cleanUsername]
    );

    if (dbUser === undefined) {
      return res.status(400).json({ message: 'Invalid user' });
    }

    // Compare provided password against stored bcrypt hash
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (!isPasswordMatched) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Task 5: Put ONLY the username (never the password) in the JWT payload
    const payload = { username: dbUser.username };
    const jwtToken = jwt.sign(payload, JWT_SECRET);

    return res.status(200).json({ jwt_token: jwtToken });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * Preserved from Lab 3: Books Read Endpoints
 */
const ALLOWED_COLUMNS = ['id', 'title', 'author', 'price', 'pages'];
const ALLOWED_ORDERS = ['ASC', 'DESC'];

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

    const cleanOrderBy = String(order_by).toLowerCase();
    const cleanOrder = String(order).toUpperCase();

    if (!ALLOWED_COLUMNS.includes(cleanOrderBy)) {
      return res.status(400).json({
        message: `Invalid 'order_by' column. Allowed values: ${ALLOWED_COLUMNS.join(', ')}.`,
      });
    }
    if (!ALLOWED_ORDERS.includes(cleanOrder)) {
      return res.status(400).json({
        message: "Invalid 'order' direction. Allowed values: ASC, DESC.",
      });
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: "Invalid 'limit' or 'offset'. Limit must be >= 1 and offset >= 0.",
      });
    }

    const conditions = ['title LIKE ?'];
    const params = [`%${search_q}%`];

    if (min_price !== undefined && max_price !== undefined) {
      const minP = Number(min_price);
      const maxP = Number(max_price);
      if (isNaN(minP) || isNaN(maxP)) {
        return res.status(400).json({ message: "'min_price' and 'max_price' must be valid numbers." });
      }
      conditions.push('price BETWEEN ? AND ?');
      params.push(minP, maxP);
    } else if (min_price !== undefined) {
      const minP = Number(min_price);
      if (isNaN(minP)) {
        return res.status(400).json({ message: "'min_price' must be a valid number." });
      }
      conditions.push('price >= ?');
      params.push(minP);
    } else if (max_price !== undefined) {
      const maxP = Number(max_price);
      if (isNaN(maxP)) {
        return res.status(400).json({ message: "'max_price' must be a valid number." });
      }
      conditions.push('price <= ?');
      params.push(maxP);
    }

    const query = `
      SELECT * FROM book
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${cleanOrderBy} ${cleanOrder}
      LIMIT ? OFFSET ?;
    `;
    params.push(parsedLimit, parsedOffset);

    const books = await db.all(query, params);
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get(['/books/:bookId', '/books/:bookId/'], async (req, res) => {
  try {
    const bookId = parseInt(req.params.bookId, 10);
    if (isNaN(bookId)) {
      return res.status(400).json({ message: 'Invalid bookId parameter. It must be an integer.' });
    }
    const book = await db.get('SELECT * FROM book WHERE id = ?;', [bookId]);
    if (!book) {
      return res.status(404).json({ message: `Book with ID ${bookId} not found.` });
    }
    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Catch-all 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});
