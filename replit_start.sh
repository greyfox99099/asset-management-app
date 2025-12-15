#!/bin/bash
echo "Installing dependencies..."
cd backend
npm install
echo "Starting Backend Server..."
node server.js
