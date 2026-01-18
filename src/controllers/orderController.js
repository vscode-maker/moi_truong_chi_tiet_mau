const { pool } = require('../config/db');

const createFullOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { order, samples } = req.body;
        if (!order || !order.don_hang_id) {
            throw new Error('Order data missing don_hang_id');
        }

        const genId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

        const orderData = { ...order };
        if (!orderData.id) orderData.id = genId();

        const orderKeys = Object.keys(orderData);
        const orderValues = orderKeys.map(k => orderData[k]);
        const orderPlaceholders = orderKeys.map((_, i) => `$${i + 1}`).join(', ');

        await client.query(
            `INSERT INTO don_hang (${orderKeys.join(', ')}) VALUES (${orderPlaceholders})`,
            orderValues
        );

        if (samples && Array.isArray(samples)) {
            for (const sample of samples) {
                const { details, ...sampleFields } = sample;
                const sampleData = { ...sampleFields };

                delete sampleData.id;
                delete sampleData.mau_id;
                delete sampleData.chi_tiet_chi_tieu;

                sampleData.ma_mau = '⏱ Chờ mã hóa...';

                if (!sampleData.don_hang_id) sampleData.don_hang_id = orderData.don_hang_id;

                const sampleKeys = Object.keys(sampleData);
                const sampleValues = sampleKeys.map(k => sampleData[k]);
                const samplePlaceholders = sampleKeys.map((_, i) => `$${i + 1}`).join(', ');

                const sampleRes = await client.query(
                    `INSERT INTO ma_mau (${sampleKeys.join(', ')}) VALUES (${samplePlaceholders}) RETURNING mau_id`,
                    sampleValues
                );

                const newMauId = sampleRes.rows[0].mau_id;

                if (details && Array.isArray(details)) {
                    for (const detail of details) {
                        const detailData = { ...detail };
                        delete detailData.key;

                        delete detailData.ten_chi_tieu;
                        delete detailData.ten_mau;
                        delete detailData.ten_don_hang;
                        delete detailData.ten_khach_hang;
                        delete detailData.nguoi_phan_tich;
                        delete detailData.nguoi_duyet;
                        delete detailData.nguoi_nhan;
                        delete detailData.phuong_phap_thu;
                        delete detailData.nhom_mau;

                        if (!detailData.id) detailData.id = genId();

                        detailData.ma_mau_id = newMauId;
                        detailData.don_hang_id = orderData.don_hang_id;

                        const detailKeys = Object.keys(detailData);
                        const detailValues = detailKeys.map(k => detailData[k]);
                        const detailPlaceholders = detailKeys.map((_, i) => `$${i + 1}`).join(', ');

                        await client.query(
                            `INSERT INTO chi_tiet_mau (${detailKeys.join(', ')}) VALUES (${detailPlaceholders})`,
                            detailValues
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, orderId: orderData.id, message: 'Order created successfully with samples and details' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Full Create Error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

const generateOrderId = async (req, res) => {
    try {
        const year = new Date().getFullYear();
        const query = `SELECT COUNT(*) FROM don_hang WHERE don_hang_id LIKE $1`;
        const values = [`${year}.%`];

        const result = await pool.query(query, values);
        const count = parseInt(result.rows[0].count, 10);
        const nextSeq = count + 1;

        const newId = `${year}.${nextSeq.toString().padStart(4, '0')}`;

        res.json({ success: true, id: newId });
    } catch (err) {
        console.error('Error generating Order ID:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const getOrderStats = async (req, res) => {
    try {
        const query = `
            SELECT trang_thai_don_hang, COUNT(*) as count 
            FROM don_hang 
            GROUP BY trang_thai_don_hang
        `;
        const result = await pool.query(query);

        const stats = {};
        result.rows.forEach(row => {
            if (row.trang_thai_don_hang) {
                stats[row.trang_thai_don_hang] = parseInt(row.count, 10);
            }
        });

        res.json({ success: true, data: stats });
    } catch (err) {
        console.error('Error fetching order stats:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const generateNextId = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const result = await pool.query('SELECT COUNT(*) FROM don_hang');
        const count = parseInt(result.rows[0].count, 10);
        const nextSequence = count + 1;
        const formattedSequence = nextSequence.toString().padStart(4, '0');
        const nextId = `${currentYear}.${formattedSequence}`;

        res.json({ success: true, nextId });
    } catch (err) {
        console.error('Error generating next ID:', err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getFullOrder = async (req, res) => {
    const { id } = req.params;
    try {
        const orderRes = await pool.query('SELECT * FROM don_hang WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const order = orderRes.rows[0];
        const donHangId = order.don_hang_id;

        const samplesRes = await pool.query('SELECT * FROM ma_mau WHERE don_hang_id = $1 ORDER BY mau_id', [donHangId]);
        const samples = samplesRes.rows;

        const detailsRes = await pool.query(`
            SELECT c.*,
                   m.ma_mau, m.ten_mau,
                   d.ten_don_hang, d.ten_khach_hang,
                   ct.chi_tieu as ten_chi_tieu,
                   nv1.ho_va_ten as ten_nguoi_phan_tich,
                   nv2.ho_va_ten as ten_nguoi_duyet,
                   nv3.ho_va_ten as ten_nguoi_nhan_mau
            FROM chi_tiet_mau c
            LEFT JOIN ma_mau m ON c.ma_mau_id = m.mau_id::text
            LEFT JOIN don_hang d ON c.don_hang_id = d.don_hang_id
            LEFT JOIN chi_tieu ct ON c.id_chi_tieu = ct.id_chi_tieu
            LEFT JOIN nhan_vien nv1 ON c.ma_nguoi_phan_tich = nv1.ma_nv
            LEFT JOIN nhan_vien nv2 ON c.ma_nguoi_duyet = nv2.ma_nv
            LEFT JOIN nhan_vien nv3 ON c.id_nguoi_nhan_mau = nv3.ma_nv
            WHERE c.don_hang_id = $1 
            ORDER BY c.id
        `, [donHangId]);
        const allDetails = detailsRes.rows;

        const samplesWithDetails = samples.map(sample => {
            const sampleDetails = allDetails.filter(d => {
                if (sample.mau_id && d.ma_mau_id) {
                    return d.ma_mau_id == sample.mau_id;
                }
                return d.ma_mau === sample.ma_mau;
            });

            return {
                ...sample,
                details: sampleDetails
            };
        });

        res.json({
            success: true,
            data: {
                order: order,
                samples: samplesWithDetails
            }
        });

    } catch (err) {
        console.error('Error fetching full order:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const getOrderById = async (req, res) => {
    const { id } = req.params;
    try {
        const orderRes = await pool.query('SELECT * FROM don_hang WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const order = orderRes.rows[0];
        const donHangId = order.don_hang_id;

        const samplesRes = await pool.query('SELECT * FROM ma_mau WHERE don_hang_id = $1 ORDER BY mau_id', [donHangId]);
        const samples = samplesRes.rows;

        const detailsRes = await pool.query(`
            SELECT c.*,
                   m.ma_mau, m.ten_mau,
                   d.ten_don_hang, d.ten_khach_hang,
                   ct.chi_tieu as ten_chi_tieu,
                   nv1.ho_va_ten as ten_nguoi_phan_tich,
                   nv2.ho_va_ten as ten_nguoi_duyet,
                   nv3.ho_va_ten as ten_nguoi_nhan_mau
            FROM chi_tiet_mau c
            LEFT JOIN ma_mau m ON c.ma_mau_id = m.mau_id::text
            LEFT JOIN don_hang d ON c.don_hang_id = d.don_hang_id
            LEFT JOIN chi_tieu ct ON c.id_chi_tieu = ct.id_chi_tieu
            LEFT JOIN nhan_vien nv1 ON c.ma_nguoi_phan_tich = nv1.ma_nv
            LEFT JOIN nhan_vien nv2 ON c.ma_nguoi_duyet = nv2.ma_nv
            LEFT JOIN nhan_vien nv3 ON c.id_nguoi_nhan_mau = nv3.ma_nv
            WHERE c.don_hang_id = $1 
            ORDER BY c.id
        `, [donHangId]);
        const allDetails = detailsRes.rows;

        const samplesWithDetails = samples.map(sample => {
            const sampleDetails = allDetails.filter(d => {
                if (sample.mau_id && d.ma_mau_id) return d.ma_mau_id == sample.mau_id;
                return d.ma_mau === sample.ma_mau;
            });
            return { ...sample, details: sampleDetails };
        });

        const slipsRes = await pool.query(`
            SELECT s.*, n.ho_va_ten as ten_nguoi_xuat 
            FROM so_phieu_kq s 
            LEFT JOIN nhan_vien n ON s.nguoi_xuat_phieu = n.ma_nv 
            WHERE s.don_hang_id = $1 
            ORDER BY s.id DESC
        `, [id]);
        const resultSlips = slipsRes.rows;

        res.json({
            success: true,
            data: {
                order: order,
                samples: samplesWithDetails,
                resultSlips: resultSlips
            }
        });

    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const updateFullOrder = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { order, samples } = req.body;
        if (!order || !order.don_hang_id) {
            throw new Error('Order data missing don_hang_id');
        }

        const orderKeys = Object.keys(order).filter(k => k !== 'id');
        if (orderKeys.length > 0) {
            const setClause = orderKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
            const values = [...orderKeys.map(k => order[k]), id];
            await client.query(
                `UPDATE don_hang SET ${setClause} WHERE id = $${orderKeys.length + 1}`,
                values
            );
        }

        await client.query('DELETE FROM chi_tiet_mau WHERE don_hang_id = $1', [order.don_hang_id]);
        await client.query('DELETE FROM ma_mau WHERE don_hang_id = $1', [order.don_hang_id]);

        if (samples && Array.isArray(samples)) {
            const genId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

            for (const sample of samples) {
                const { details, ...sampleFields } = sample;
                const sampleData = { ...sampleFields };

                delete sampleData.id;
                delete sampleData.mau_id;
                delete sampleData.chi_tiet_chi_tieu;

                if (!sampleData.don_hang_id) sampleData.don_hang_id = order.don_hang_id;

                const sampleKeys = Object.keys(sampleData);
                const sampleValues = sampleKeys.map(k => sampleData[k]);
                const samplePlaceholders = sampleKeys.map((_, i) => `$${i + 1}`).join(', ');

                const sampleRes = await client.query(
                    `INSERT INTO ma_mau (${sampleKeys.join(', ')}) VALUES (${samplePlaceholders}) RETURNING mau_id`,
                    sampleValues
                );
                const newMauId = sampleRes.rows[0].mau_id;

                if (details && Array.isArray(details)) {
                    for (const detail of details) {
                        const detailData = { ...detail };
                        delete detailData.key;
                        delete detailData.id;

                        delete detailData.ten_chi_tieu;
                        delete detailData.ten_mau;
                        delete detailData.ten_don_hang;
                        delete detailData.ten_khach_hang;
                        delete detailData.nguoi_phan_tich;
                        delete detailData.nguoi_duyet;
                        delete detailData.nguoi_nhan;
                        delete detailData.phuong_phap_thu;
                        delete detailData.nhom_mau;

                        if (!detailData.id) detailData.id = genId();
                        detailData.ma_mau_id = newMauId;
                        detailData.don_hang_id = order.don_hang_id;

                        const detailKeys = Object.keys(detailData);
                        const detailValues = detailKeys.map(k => detailData[k]);
                        const detailPlaceholders = detailKeys.map((_, i) => `$${i + 1}`).join(', ');

                        await client.query(
                            `INSERT INTO chi_tiet_mau (${detailKeys.join(', ')}) VALUES (${detailPlaceholders})`,
                            detailValues
                        );
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Order updated successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Full Update Error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

const deleteOrderCascading = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const orderRes = await client.query('SELECT don_hang_id FROM don_hang WHERE id = $1', [id]);
        if (orderRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        const { don_hang_id } = orderRes.rows[0];

        await client.query('DELETE FROM so_phieu_kq WHERE don_hang_id = $1', [id]);
        await client.query('DELETE FROM chi_tiet_mau WHERE don_hang_id = $1', [don_hang_id]);
        await client.query('DELETE FROM ma_mau WHERE don_hang_id = $1', [don_hang_id]);
        await client.query('DELETE FROM cong_viec WHERE id_don_hang = $1', [id]);
        await client.query('DELETE FROM don_hang WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.json({ success: true, message: 'Deleted order and all related data successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete Order Error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

module.exports = {
    createFullOrder,
    generateOrderId,
    getOrderStats,
    generateNextId,
    getFullOrder,
    getOrderById,
    updateFullOrder,
    deleteOrderCascading
};
