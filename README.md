# BareSober — Premium Skincare E-Commerce Platform

A production-ready full-stack skincare e-commerce application built with Node.js, Express.js, MongoDB, and vanilla HTML/CSS/JavaScript.

---

## Quick Start

### Prerequisites
- Node.js v18+
- npm
- MongoDB Atlas account (recommended)
- Docker Desktop (optional, for containerized run)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Edit `.env` and set these values:
- `MONGO_URI` — your **MongoDB Atlas** connection string
- `JWT_SECRET` — a strong random secret
- `EMAIL_USER` / `EMAIL_PASS` — Gmail credentials for email notifications (optional)
- `TWILIO_*` — Twilio credentials for SMS OTP (optional; mock used if absent)
- `RAZORPAY_*` — Razorpay credentials for payments (optional; mock used)

Example Atlas URI:
```env
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/baresober?retryWrites=true&w=majority&appName=BareSober
```

### 3. Seed Database
```bash
npm run seed
```
This creates:
- Admin user: `admin@baresober.com` / `Admin@123`
- Sample user: `priya@example.com` / `User@123`
- Sample products

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

### 5. Open in Browser
- Store: `http://localhost:5000`
- Admin Panel: `http://localhost:5000/admin/`
- Health Check: `http://localhost:5000/api/health`

---

## Docker Setup

### Run app with MongoDB Atlas
Make sure `.env` contains your Atlas `MONGO_URI`, then run:
```bash
docker compose up --build
```

### Run app with local MongoDB container
If you want Docker to start MongoDB too, update `.env` like this:
```env
MONGO_URI=mongodb://mongo:27017/baresober
```
Then run:
```bash
docker compose --profile localdb up --build
```

---

## Project Structure

```text
Bare-sover-main/
├── client/
├── server/
├── seed/
├── uploads/
├── .env
├── .env.example
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

---

### MongoDB Atlas Database Image
A ready-to-use placeholder image asset is included at:
- `client/img/mongodb-atlas.svg`

## Notes
- MongoDB Atlas is the recommended database setup.
- The Docker compose file supports both Atlas and an optional local MongoDB container.
- Uploaded product images are persisted through the `uploads/` volume.
- For production, change the JWT secret and all placeholder credentials.

---

## Default Admin Login
- Email: `admin@baresober.com`
- Password: `Admin@123`

---

## Tech Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MongoDB Atlas / MongoDB
- Auth: JWT + bcryptjs
- Uploads: Multer
- Email: Nodemailer
- Payments: Razorpay (mock-ready)

---

## License
© 2026 BareSober. All rights reserved.
