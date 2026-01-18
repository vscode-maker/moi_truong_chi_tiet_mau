require('dotenv').config();
const { pool } = require('./src/config/db');

async function checkUsers() {
    try {
        const res = await pool.query('SELECT ma_nv, ho_va_ten, vai_tro, mat_khau FROM nhan_vien LIMIT 5');
        console.log('Users found:', res.rows);
    } catch (err) {
        console.error('Error querying users:', err);
    } finally {
        pool.end();
    }
}

checkUsers();
