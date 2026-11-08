/**
 * Lab 3 - Task 7 Debugging Exercise: Fixed Server
 * Solution file resolving all 4 bugs:
 *
 * FIX 1: Correct import path: require('sqlite') and require('sqlite3')
 * FIX 2: Resolving port conflict: Use process.env.PORT || 3001 with dynamic fallback or process management
 * FIX 3: Correct table-name: changed 'books' to 'book' matching schema
 * FIX 4: Added 'await' before db.all(query) to resolve the Promise
 */

// [FIX 1] Correct module import paths
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// [FIX 2] Avoid port conflict using environment variable or alternate port
const PORT = process.env.PORT || 3001;

const dbPath = path.join(__dirname, '../goodreads.db');
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log(`Fixed Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Route with FIX 3 and FIX 4
app.get('/books', async (req, res) => {
  try {
    // [FIX 3] Correct table name 'book' (not 'books')
    const query = `SELECT * FROM book;`;

    // [FIX 4] Added 'await' before asynchronous query
    const books = await db.all(query);

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
