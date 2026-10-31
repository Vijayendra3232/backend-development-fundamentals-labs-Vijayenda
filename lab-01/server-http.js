/**
 * Lab 1 - Plain Node.js HTTP Server
 * Course: Backend Development Fundamentals (Year II Term II · Aurora)
 * Faculty: Yugandhar Gurjalwar
 * 
 * Objective: Create a plain web server using Node.js built-in 'http' module
 * that responds with "Hello" on port 3000.
 */

const http = require('http');

const PORT = process.env.PORT || 3000;

// Create server using built-in http module
const server = http.createServer((req, res) => {
  // Set response HTTP status code to 200 (OK) and header content-type
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  // Send the response body "Hello"
  res.end('Hello');
});

// Start listening on port 3000
server.listen(PORT, () => {
  console.log(`Plain HTTP server is running at http://localhost:${PORT}/`);
});
