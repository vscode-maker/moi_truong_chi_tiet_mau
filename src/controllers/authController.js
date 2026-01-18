const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    const { ma_nv, mat_khau } = req.body;
    try {
        const result = await pool.query('SELECT * FROM nhan_vien WHERE ma_nv = $1', [ma_nv]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ success: false, message: 'Mã nhân viên không tồn tại' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(mat_khau, user.mat_khau);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Mật khẩu không đúng' });
        }

        // Sign Token
        const token = jwt.sign({ ma_nv: user.ma_nv, vai_tro: user.vai_tro }, process.env.JWT_SECRET, { expiresIn: '72h' });

        res.json({
            success: true,
            token,
            user: {
                ma_nv: user.ma_nv,
                ho_va_ten: user.ho_va_ten,
                chuc_vu: user.chuc_vu,
                hinh_anh: user.hinh_anh,
                vai_tro: user.vai_tro
            }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const getProfile = async (req, res) => {
    try {
        console.log('Auth/me - ma_nv from token:', req.user?.ma_nv);

        if (!req.user || !req.user.ma_nv) {
            return res.status(401).json({ success: false, message: 'Invalid token: no ma_nv' });
        }

        const result = await pool.query('SELECT * FROM nhan_vien WHERE ma_nv = $1', [req.user.ma_nv]);
        const user = result.rows[0];

        if (!user) {
            console.log('Auth/me - User not found for ma_nv:', req.user.ma_nv);
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                ma_nv: user.ma_nv,
                ho_va_ten: user.ho_va_ten,
                chuc_vu: user.chuc_vu,
                hinh_anh: user.hinh_anh,
                vai_tro: user.vai_tro,
                phong_ban: user.phong_ban,
                email: user.email,
                so_dien_thoai: user.so_dien_thoai
            }
        });
    } catch (err) {
        console.error('Auth/me error:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    login,
    getProfile
};
