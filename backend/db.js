const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'asset_management.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database at ' + dbPath);
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    // Use db.all to support RETURNING clause and SELECT queries
    db.all(sql, params, function (err, rows) {
      if (err) {
        return reject(err);
      }
      resolve({ rows: rows });
    });
  });
};

const initDB = () => {
  return new Promise((resolve, reject) => {
    // SQLite creates the file automatically, but we can check connection
    if (db) {
      resolve();
    } else {
      reject(new Error('Database not initialized'));
    }
  });
};

module.exports = {
  query,
  initDB
};
