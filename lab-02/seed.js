/**
 * Lab 2 - Database Seed Script
 * Course: Backend Development Fundamentals (Year II Term II · Aurora)
 * Faculty: Yugandhar Gurjalwar
 * Student: Gorrela Vijayendra (252U1R6085)
 *
 * Description: Initializes goodreads.db with table schema and 10 sample books.
 */

const fs = require('fs');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, 'goodreads.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const seedDatabase = async () => {
  try {
    console.log('Connecting to SQLite database at:', dbPath);
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await db.exec(schemaSql);

    const countResult = await db.get('SELECT COUNT(*) AS count FROM book;');
    console.log(`Database seeded successfully! Total books in table: ${countResult.count}`);

    const books = await db.all('SELECT * FROM book;');
    console.log('Inserted Books:');
    console.table(books);

    await db.close();
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
