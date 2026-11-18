# Lab 4: Registration, login and JWT

**Name:** Gorrela Vijayendra  
**Registration Number:** 252U1R6085  
**Section:** Aurora · Year II Term II  
**Course:** Backend Development Fundamentals  
**Faculty:** Joel Prashanth D · Yugandhar Gurjalwar  

---

## Live Link

- **Production Live URL (Railway):** *Pending Railway deploy*
- **Deployment Platform:** Railway (`backend-development-fundamentals`)
- **Service Name:** `lab-04`

---

## How to Run

### Prerequisites
- Node.js (v18.x or newer recommended; tested on v24.15.0)
- npm (v9.x or newer)

### Installation
Clone the course repository and navigate into the `lab-04/` directory:
```bash
git clone https://github.com/Vijayendra3232/backend-development-fundamentals-labs-Vijayenda.git
cd backend-development-fundamentals-labs-Vijayenda/lab-04
npm install
```

### Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

| Variable | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | Network port on which Express listens | `3000` |
| `STUDENT_NAME` | Student full name | `Gorrela Vijayendra` |
| `STUDENT_REG_NO` | Student registration number | `252U1R6085` |
| `STUDENT_SECTION` | Class section and cohort | `Aurora · Year II Term II` |

> *Rule: Never commit or share `.env`. Per Task 5, the JWT secret key (`JWT_SECRET`) is kept in a constant for now and will be moved to `.env` in Lab 8.*

### Database Initialization & Seeding
Initialize the SQLite database (`goodreads.db`) with the `user` and `book` tables (seeding only bcrypt-hashed passwords, never plain text):
```bash
npm run seed
```

### Start Commands

**Development mode** (auto-restarts on save with `nodemon`):
```bash
npm run dev
# Server running at http://localhost:3000/
```

**Production mode**:
```bash
npm start
# Server running at http://localhost:3000/
```

### 1-Click Postman Testing
Import [`auth-api-lab4.postman_collection.json`](auth-api-lab4.postman_collection.json) into Postman to run all 7 registration and login test requests (both success and failure cases).

---

## Endpoints / Scripts Table

### REST API Endpoints (`server.js`)

| Method | Endpoint / Path | Request Body (JSON) | Status Code | Description |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/register/` | `{"username", "name", "password"}` | `201 Created` / `400 Bad Request` | Rejects duplicate/invalid inputs with `400`; hashes password with `bcrypt.hash` and stores new user. |
| **POST** | `/login/` | `{"username", "password"}` | `200 OK` / `400 Bad Request` | Verifies user & password with `bcrypt.compare`; returns `{ "jwt_token": "..." }` signed with `jwt.sign`. |
| **GET** | `/books` | None (supports Lab 3 query params) | `200 OK` / `400 Bad Request` | Retrieves books with search, sort, pagination, and price-range filters. |
| **GET** | `/books/:bookId` | None | `200 OK` / `404 Not Found` | Retrieves a single book record by ID. |
| **GET** | `/` | None | `200 OK` | API health check and route overview. |
| **ANY** | `/*` | Any | `404 Not Found` | Catch-all handler for undefined routes. |

### npm Scripts

| Script Command | Command Line | Description |
| :--- | :--- | :--- |
| `npm start` | `node server.js` | Starts the Express authentication server. |
| `npm run dev` | `nodemon server.js` | Starts the server with automatic reload via `nodemon`. |
| `npm run seed` | `node seed.js` | Creates `user` and `book` tables and seeds hashed sample data into `goodreads.db`. |

---

## Database Schema (Task 2)

```sql
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL
);
```

- `username` has a `UNIQUE` constraint at the database level in addition to application-level duplicate checking.
- `password` stores **only** the 60-character salted bcrypt hash (`$2b$10$...`). Plain-text passwords are never stored or logged.
- All SQL statements use parameterized `?` placeholders to prevent SQL injection.

---

## JWT Structure & `jwt.io` Decoding (Task 5 & Task 6)

A JSON Web Token consists of three Base64Url-encoded parts separated by dots (`.`): `header.payload.signature`.

**Example token returned by `POST /login/`:**
```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJhaHVsX2F1cm9yYSIsImlhdCI6MTc5NTAxODQ4M30.24L7hPcUe-sliFAF_xr0wqABBo3bNeEZaiux92LbNo4
```

| Part | Decoded Value | Purpose |
| :--- | :--- | :--- |
| **1. Header** (Red) | `{"alg": "HS256", "typ": "JWT"}` | Declares the signing algorithm (HMAC-SHA256) and token type (`JWT`). |
| **2. Payload** (Purple) | `{"username": "rahul_aurora", "iat": 1795018483}` | Carries non-sensitive claims: **only `username`** plus issued-at timestamp (`iat`). **Never contains passwords.** |
| **3. Signature** (Blue) | `HMACSHA256(base64Url(header) + "." + base64Url(payload), JWT_SECRET)` | Cryptographic proof that the token was issued by our server and has not been tampered with. |

---

## Screenshots

### 1. POST /register/ — Successful Registration (`201 Created`)
![Register New User 201](screenshots/01-post-register-201.png)

### 2. POST /register/ — Duplicate Username Rejected (`400 Bad Request`)
![Duplicate Username 400](screenshots/02-post-register-duplicate-400.png)

### 3. POST /login/ — Valid Login Returning `{ jwt_token }` (`200 OK`)
![Valid Login JWT 200](screenshots/03-post-login-success-200.png)

### 4. POST /login/ — Unknown User Rejected (`400 Bad Request`)
![Unknown User 400](screenshots/04-post-login-unknown-user-400.png)

### 5. POST /login/ — Wrong Password Rejected (`400 Bad Request`)
![Wrong Password 400](screenshots/05-post-login-wrong-password-400.png)

### 6. Task 6 — Decoding JWT on `jwt.io` (Header, Payload, Signature)
![JWT Decoded Breakdown](screenshots/06-jwt-io-decoded.png)

### 7. SQLite Database View — Hashed Passwords Only
![SQLite Users Hashed Passwords](screenshots/07-sqlite-users-hashed-db.png)

---

## Viva Questions & Answers

### Q1: Why POST for login?
**Answer:**
- `POST` sends the `username` and `password` inside the **HTTP request body** (encrypted in transit over HTTPS), whereas `GET` appends credentials as query parameters in the URL.
- URLs are recorded in browser history, server access logs, proxy logs, and `Referer` headers — sending passwords via `GET` would expose them in plain text everywhere.
- Additionally, `POST` is not cached by browsers or proxies by default and semantically represents creating an authentication session/token.

### Q2: Hash vs encrypt?
**Answer:**
- **Hashing (e.g., `bcrypt`, SHA-256):** A **one-way** mathematical transformation. You cannot reverse a bcrypt hash back into the original password. To verify a password on login, `bcrypt.compare` hashes the incoming password using the stored salt and checks whether the resulting hashes match. Ideal for passwords.
- **Encryption (e.g., AES, RSA):** A **two-way** transformation using a key. Ciphertext can be decrypted back to the original plaintext if you have the decryption key. Ideal for data you must later read back (like credit card numbers or private messages), **not** passwords.

### Q3: What does `jwt.sign` need?
**Answer:**
`jwt.sign(payload, secretOrPrivateKey, [options])` requires at minimum **two arguments**:
1. **`payload`:** A JSON object containing the claims to embed (e.g., `{ username: dbUser.username }`).
2. **`secretOrPrivateKey`:** The secret string or private key used to compute the cryptographic signature (e.g., `JWT_SECRET`).
3. **`options` (optional):** Configuration such as `{ expiresIn: '1h', algorithm: 'HS256' }`.

### Q4: What should never go into the payload?
**Answer:**
- **Passwords (plain text or even hashes)**, secret keys, credit card numbers, SSNs/Aadhaar numbers, or any confidential PII must **never** be placed in a JWT payload.
- Why? Because the JWT payload is only **Base64Url-encoded**, **not encrypted** — anyone who intercepts the token can decode and read the payload instantly at `jwt.io` without knowing the secret key.

---

## Notes: Problems Faced and How You Solved Them

1. **Duplicate Username Race Conditions:**
   - *Problem:* Checking `SELECT ... WHERE username = ?` before `INSERT` is standard, but concurrent requests with the same username could still trigger a SQLite `UNIQUE constraint failed` exception.
   - *Solution:* Kept both the explicit `SELECT` check (returning `400` with `{ "message": "User already exists" }`) and a `catch` check for `UNIQUE constraint failed` so duplicate registrations always return `400 Bad Request` cleanly instead of `500`.

2. **Ensuring Fresh Deployments Auto-Initialize Schema:**
   - *Problem:* On cloud deployments (such as Railway), starting against a fresh filesystem can fail with `SQLITE_ERROR: no such table: user` if `npm run seed` wasn't run manually.
   - *Solution:* Added `CREATE TABLE IF NOT EXISTS` statements inside `schema.sql` and executed them automatically during `initializeDBAndServer()` in `server.js`.

3. **Postman Raw Body Content-Type Handling:**
   - *Problem:* Sending raw JSON in Postman while accidentally leaving the format dropdown on `Text` leaves `req.body` undefined under default `express.json()`.
   - *Solution:* Added a safe `express.text()` fallback parser right after `app.use(express.json())` so both `application/json` and raw JSON text strings parse smoothly.
