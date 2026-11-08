/**
 * Lab 3 - Task 7 Debugging Exercise: Broken Server Sample
 * Faculty Handout Code with 4 Intentional Bugs:
 *
 * BUG 1: Wrong import path: requires non-existent or incorrect module path
 * BUG 2: Port conflict (hardcoded fixed port without dynamic fallback or unclosed duplicate)
 * BUG 3: Table-name typo in SQL query ('books' instead of 'book')
 * BUG 4: Missing 'await' on asynchronous database operation
 */

// [BUG 1] Wrong import path: attempting to import from non-existent subpath
// const { open } = require('sqlite/driver'); // WRONG
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// [BUG 2] Hardcoded fixed port that collides when another instance runs
const PORT = 3000; 

const dbPath = path.join(__dirname, '../goodreads.db');
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log(`Broken Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
  }
};

initializeDBAndServer();

// Route with BUG 3 and BUG 4
app.get('/books', async (req, res) => {
  // [BUG 3] Table-name typo: 'books' instead of 'book' -> SQLITE_ERROR: no such table: books
  const query = `SELECT * FROM books;`;

  // [BUG 4] Missing 'await': db.all returns a Promise! Without await, it sends a pending Promise or crashes
  const books = db.all(query); // WRONG: Missing 'await'

  res.send(books);
});
