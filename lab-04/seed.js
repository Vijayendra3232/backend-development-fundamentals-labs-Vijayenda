/**
 * Lab 4 - Database Seed Script
 * Course: Backend Development Fundamentals (Year II Term II · Aurora)
 * Faculty: Joel Prashanth D · Yugandhar Gurjalwar
 * Student: Gorrela Vijayendra (252U1R6085)
 *
 * Description: Initializes goodreads.db with user and book tables.
 * Uses bcrypt to store only hashed passwords (never plain text).
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, 'goodreads.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const SAMPLE_BOOKS = [
  ["Harry Potter and the Sorcerer's Stone", 'J.K. Rowling', 450, 320],
  ['To Kill a Mockingbird', 'Harper Lee', 350, 281],
  ['The Great Gatsby', 'F. Scott Fitzgerald', 299, 180],
  ['Pride and Prejudice', 'Jane Austen', 250, 279],
  ['1984', 'George Orwell', 320, 328],
  ['The Catcher in the Rye', 'J.D. Salinger', 380, 214],
  ['The Hobbit', 'J.R.R. Tolkien', 499, 310],
  ['Clean Code', 'Robert C. Martin', 650, 464],
  ['Atomic Habits', 'James Clear', 420, 320],
  ['The Pragmatic Programmer', 'David Thomas & Andrew Hunt', 599, 352],
  ['JavaScript: The Good Parts', 'Douglas Crockford', 399, 176],
  ['Harry Potter and the Chamber of Secrets', 'J.K. Rowling', 480, 341],
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to SQLite database at:', dbPath);
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(schemaSql);

    // Reset and seed books
    await db.run('DELETE FROM book;');
    await db.run("DELETE FROM sqlite_sequence WHERE name='book';");
    for (const [title, author, price, pages] of SAMPLE_BOOKS) {
      await db.run(
        'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);',
        [title, author, price, pages]
      );
    }

    // Seed one sample user with bcrypt hash (for quick login verification)
    const existingDemoUser = await db.get(
      'SELECT id, username FROM user WHERE username = ?;',
      ['vijayendra']
    );
    if (!existingDemoUser) {
      const hashedPassword = await bcrypt.hash('Aurora@2026', 10);
      await db.run(
        'INSERT INTO user (username, name, password) VALUES (?, ?, ?);',
        ['vijayendra', 'Gorrela Vijayendra', hashedPassword]
      );
    }

    const users = await db.all('SELECT id, username, name, password FROM user;');
    const bookCount = await db.get('SELECT COUNT(*) AS count FROM book;');

    console.log(`Database seeded successfully! Books: ${bookCount.count}, Users: ${users.length}`);
    console.log('Users table (passwords stored as bcrypt hashes only):');
    console.table(users);

    await db.close();
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
