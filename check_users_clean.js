require('dotenv').config();
const { pool } = require('./src/config/db');

async function checkUsers() {
    try {
        // Disable the connection logging in db.js if possible or just ignore it
        const res = await pool.query('SELECT ma_nv, mat_khau FROM nhan_vien ORDER BY ma_nv ASC LIMIT 5');
        console.log('--- USER LIST START ---');
        console.log(JSON.stringify(res.rows, null, 2));
        console.log('--- USER LIST END ---');
    } catch (err) {
        console.error('Error querying users:', err);
    } finally {
        pool.end();
    }
}

checkUsers();
