/**
 * Lab 1 - Express Web Server
 * Course: Backend Development Fundamentals (Year II Term II · Aurora)
 * Faculty: Joel Prashanth D
 * 
 * Objective: Build an Express server with required endpoints and 404 handler.
 */

const express = require('express');

// Initialize the Express application
const app = express();

// Use PORT from environment variable (for deployment) or default to 3000
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies if needed
app.use(express.json());

/**
 * Route: GET /
 * Description: Welcome text
 * Status: 200 OK
 */
app.get('/', (req, res) => {
  res.status(200).send('Welcome to Backend Development Fundamentals - Lab 1 Express Server!');
});

/**
 * Route: GET /about
 * Description: Returns JSON with student name and section
 * Status: 200 OK
 */
app.get('/about', (req, res) => {
  res.status(200).json({
    name: "Gorrela Vijayendra",
    registrationNumber: process.env.STUDENT_REG_NO || "23B01AXXXX",
    section: "Aurora · Year II Term II",
    course: "Backend Development Fundamentals",
    faculty: "Joel Prashanth D"
  });
});

/**
 * Route: GET /time
 * Description: Returns current date and time using new Date()
 * Status: 200 OK
 */
app.get('/time', (req, res) => {
  const current = new Date();
  res.status(200).json({
    currentTime: current.toISOString(),
    readable: current.toString(),
    timestamp: current.getTime()
  });
});

/**
 * 404 Catch-All Handler
 * Description: Returns a 404 status code and error message for any undefined route
 * Status: 404 Not Found
 */
app.use((req, res) => {
  res.status(404).json({
    error: '404 Not Found',
    message: `The requested path '${req.originalUrl}' does not exist on this server.`
  });
});

// Start listening for incoming connections
app.listen(PORT, () => {
  console.log(`Express server is running at http://localhost:${PORT}`);
});

module.exports = app;
