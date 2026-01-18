require('dotenv').config();
const { pool } = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('123', 10);

        // Check if exists
        const check = await pool.query("SELECT * FROM nhan_vien WHERE ma_nv = 'admin'");
        if (check.rows.length > 0) {
            // Update password
            await pool.query("UPDATE nhan_vien SET mat_khau = $1 WHERE ma_nv = 'admin'", [hashedPassword]);
            console.log("Admin user updated with password '123'");
        } else {
            // Insert
            await pool.query(
                "INSERT INTO nhan_vien (ma_nv, ho_va_ten, mat_khau, vai_tro) VALUES ('admin', 'System Admin', $1, 'Admin')",
                [hashedPassword]
            );
            console.log("Admin user created with password '123'");
        }

    } catch (err) {
        console.error('Error creating admin:', err);
    } finally {
        pool.end();
    }
}

createAdmin();
