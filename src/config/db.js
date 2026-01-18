require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    // Database on 163.223.12.189:5432 currently accepts loose SSL or no SSL depending on server config.
    // We use loose SSL based on recent successful tests.
    ssl: { rejectUnauthorized: false }
});

// Test DB connection on startup (Optional, but good for debugging)
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Successfully connected to PostgreSQL database at', res.rows[0].now);
    }
});

module.exports = { pool };
