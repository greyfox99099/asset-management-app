# Asset Management App

A full-stack application for managing company assets.

## Prerequisites

- Node.js (v16+)
- PostgreSQL

## Setup & Run

### 1. Database Setup

Make sure PostgreSQL is running and create the database and tables:

```bash
# Enter the backend directory
cd backend

# Create database and tables (assuming default postgres user)
# You might need to adjust the command based on your postgres setup
psql -U postgres -f schema.sql
```

**Note:** Check `backend/.env` if you need to adjust database credentials (default: user=`postgres`, password=`password`, db=`asset_management`).

### 2. Backend Server

Runs on http://localhost:5001

```bash
cd backend
npm install
npm run start
# Or for development with auto-restart:
# npm run dev
```

### 3. Frontend Application

Runs on http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

## Usage

Open [http://localhost:5173](http://localhost:5173) in your browser.
