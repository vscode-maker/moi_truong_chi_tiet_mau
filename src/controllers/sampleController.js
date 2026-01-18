const { pool } = require('../config/db');

// Helper to map UI keys to DB columns
const mapChiTietMauInput = (data) => {
    const validColumns = [
        'id_nha_thau', 'id_nguoi_nhan_mau', 'id_chi_tieu',
        'ma_nguoi_phan_tich', 'ma_nguoi_duyet',
        'trang_thai_tong_hop', 'trang_thai_phan_tich',
        'ket_qua_thuc_te', 'ket_qua_in_phieu',
        'don_vi_tinh', 'tien_to', 'uu_tien', 'phe_duyet',
        'ngay_nhan_mau', 'ngay_tra_ket_qua', 'don_gia', 'chiet_khau', 'thanh_tien',
        'history', 'canh_bao_phan_tich', 'loai_phan_tich', 'noi_phan_tich',
        'nhom_mau', 'ghi_chu'
    ];

    const mapped = {};
    Object.keys(data).forEach(k => {
        let dbKey = k;
        // Map keys
        if (k === 'nguoi_phan_tich') dbKey = 'ma_nguoi_phan_tich';
        if (k === 'nguoi_duyet') dbKey = 'ma_nguoi_duyet';
        if (k === 'nguoi_nhan') dbKey = 'id_nguoi_nhan_mau';

        // Filter valid
        if (validColumns.includes(dbKey)) {
            mapped[dbKey] = data[k];
        }
    });
    return mapped;
};

const search = async (req, res) => {
    console.log('POST /cefinea/chi-tiet-mau/search', req.body);
    const { search, limit = 100, offset = 0 } = req.body;

    try {
        let baseQuery = `
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
        `;

        let countQuery = `
            SELECT COUNT(*) 
            FROM chi_tiet_mau c
            LEFT JOIN ma_mau m ON c.ma_mau_id = m.mau_id::text
        `;

        const clauses = [];
        const values = [];
        let i = 1;

        if (search && typeof search === 'object') {
            if (search.ma_mau_id) {
                clauses.push(`c.ma_mau_id = $${i}`);
                values.push(search.ma_mau_id);
                i++;
            }
        } else if (typeof search === 'string' && search.trim()) {
            clauses.push(`(m.ma_mau ILIKE $${i} OR m.ten_mau ILIKE $${i})`);
            values.push(`%${search}%`);
            i++;
        }

        if (clauses.length > 0) {
            const whereClause = ' WHERE ' + clauses.join(' AND ');
            baseQuery += whereClause;
            countQuery += whereClause;
        }

        baseQuery += ` ORDER BY c.id DESC LIMIT $${i} OFFSET $${i + 1}`;
        values.push(limit, offset);

        const [rowsRes, countRes] = await Promise.all([
            pool.query(baseQuery, values),
            pool.query(countQuery, values.slice(0, i - 1))
        ]);

        res.json({
            success: true,
            data: rowsRes.rows,
            pagination: {
                total: parseInt(countRes.rows[0].count),
                limit,
                offset
            }
        });

    } catch (err) {
        console.error('Search ChiTietMau Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const list = async (req, res) => {
    console.log('GET /cefinea/chi-tiet-mau', req.query);
    const { limit = 500, offset = 0 } = req.query;
    try {
        const query = `
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
            ORDER BY c.id DESC
            LIMIT $1 OFFSET $2
        `;
        const result = await pool.query(query, [limit, offset]);
        res.json({
            success: true,
            data: result.rows,
            pagination: { total: 1000, limit, offset }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const getDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM chi_tiet_mau WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'Not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const create = async (req, res) => {
    try {
        const body = req.body;
        const keys = Object.keys(body).filter(k => k !== 'id');
        const values = keys.map(k => body[k]);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

        const query = `INSERT INTO chi_tiet_mau (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const update = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const mappedData = mapChiTietMauInput(body);

        const keys = Object.keys(mappedData);
        if (keys.length === 0) return res.json({ success: true });

        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const values = [...Object.values(mappedData), id];

        const query = `UPDATE chi_tiet_mau SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
        const result = await pool.query(query, values);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const bulkUpdate = async (req, res) => {
    const updates = req.body;
    if (!Array.isArray(updates)) {
        return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const results = [];

        for (const update of updates) {
            const { id, data } = update;
            const mappedData = mapChiTietMauInput(data);
            const keys = Object.keys(mappedData);
            if (keys.length === 0) continue;

            const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
            const values = [...Object.values(mappedData), id];

            const query = `UPDATE chi_tiet_mau SET ${setClause} WHERE id = $${keys.length + 1} RETURNING id`;
            const res = await client.query(query, values);
            results.push(res.rows[0]);
        }

        await client.query('COMMIT');
        res.json({ success: true, count: results.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Bulk update error', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

const deleteSample = async (req, res) => {
    const { mau_id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM chi_tiet_mau WHERE ma_mau_id = $1', [mau_id]);
        const result = await client.query('DELETE FROM ma_mau WHERE mau_id = $1 RETURNING *', [mau_id]);

        if (result.rows.length === 0) {
            throw new Error('Mẫu không tồn tại');
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Đã xóa mẫu thành công' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete Error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

const cloneSample = async (req, res) => {
    const { mau_id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const sampleRes = await client.query('SELECT * FROM ma_mau WHERE mau_id = $1', [mau_id]);
        if (sampleRes.rows.length === 0) throw new Error('Mẫu không tồn tại');
        const originalSample = sampleRes.rows[0];

        const newSample = { ...originalSample };
        delete newSample.mau_id;
        delete newSample.id;

        newSample.ma_mau = '⏱ Chờ mã hóa...';
        newSample.trang_thai = '1.Chờ quan trắc (nhận mẫu)';

        const crypto = require('crypto');
        newSample.mau_id = crypto.randomUUID();

        const sKeys = Object.keys(newSample);
        const sValues = Object.values(newSample);
        const sPlaceholders = sKeys.map((_, i) => `$${i + 1}`).join(', ');

        const insertSampleRes = await client.query(
            `INSERT INTO ma_mau (${sKeys.map(k => `"${k}"`).join(', ')}) VALUES (${sPlaceholders}) RETURNING mau_id, *`,
            sValues
        );
        const newMauId = insertSampleRes.rows[0].mau_id;
        const insertedSample = insertSampleRes.rows[0];

        const detailsRes = await client.query('SELECT * FROM chi_tiet_mau WHERE ma_mau_id = $1', [mau_id]);
        const originalDetails = detailsRes.rows;

        for (const detail of originalDetails) {
            const newDetail = { ...detail };
            delete newDetail.id;

            newDetail.ma_mau_id = newMauId;
            newDetail.ma_mau = '⏱ Chờ mã hóa...';
            newDetail.don_hang_id = originalSample.don_hang_id;
            newDetail.trang_thai_phan_tich = 'Mới';

            delete newDetail.ten_chi_tieu;
            delete newDetail.ten_mau;
            delete newDetail.ten_don_hang;
            delete newDetail.ten_khach_hang;
            delete newDetail.nguoi_phan_tich;
            delete newDetail.nguoi_duyet;
            delete newDetail.nguoi_nhan;
            delete newDetail.phuong_phap_thu;
            delete newDetail.nhom_mau;
            delete newDetail.chi_tiet_chi_tieu;

            newDetail.ket_qua_thuc_te = null;
            newDetail.ket_qua_in_phieu = null;
            newDetail.nguoi_phan_tich = null;

            const dKeys = Object.keys(newDetail);
            const dValues = Object.values(newDetail);
            const dPlaceholders = dKeys.map((_, i) => `$${i + 1}`).join(', ');

            await client.query(
                `INSERT INTO chi_tiet_mau (${dKeys.map(k => `"${k}"`).join(', ')}) VALUES (${dPlaceholders})`,
                dValues
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, data: insertedSample });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Clone Error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

const encodeSample = async (req, res) => {
    const { mau_id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const sampleRes = await client.query('SELECT * FROM ma_mau WHERE mau_id = $1 FOR UPDATE', [mau_id]);
        if (sampleRes.rows.length === 0) throw new Error('Mẫu không tồn tại');
        const sample = sampleRes.rows[0];
        const { don_hang_id, loai_mau } = sample;

        await client.query('SELECT 1 FROM don_hang WHERE don_hang_id = $1 FOR UPDATE', [don_hang_id]);

        const typeRes = await client.query('SELECT gia_tri FROM cai_dat WHERE hang_muc = $1 LIMIT 1', [loai_mau]);
        const typeCode = (typeRes.rows.length > 0 && typeRes.rows[0].gia_tri) ? typeRes.rows[0].gia_tri : '';

        const countRes = await client.query(`
            SELECT COUNT(*) 
            FROM ma_mau 
            WHERE don_hang_id = $1 
              AND loai_mau = $2 
              AND ma_mau NOT IN ('⏱ Chờ mã hóa...', 'Chờ mã hóa...')
        `, [don_hang_id, loai_mau]);

        const count = parseInt(countRes.rows[0].count, 10);
        const nextSeq = count + 1;

        const seqStr = nextSeq.toString().padStart(2, '0');
        const newCode = `${don_hang_id}.${typeCode}${seqStr}`;

        await client.query(`
            UPDATE ma_mau 
            SET ma_mau = $1, 
                trang_thai = '3.Chờ chuyển mẫu' 
            WHERE mau_id = $2
        `, [newCode, mau_id]);

        await client.query(`
            UPDATE chi_tiet_mau 
            SET trang_thai_tong_hop = 'CHO_CHUYEN_MAU',
                trang_thai_phan_tich = 'Chờ nhận mẫu'
            WHERE ma_mau_id = $1
        `, [mau_id]);

        await client.query(`
            UPDATE don_hang 
            SET trang_thai_don_hang = '2.Chờ phân tích' 
            WHERE don_hang_id = $1
        `, [don_hang_id]);

        await client.query('COMMIT');
        res.json({ success: true, ma_mau: newCode });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Encode Error:', err);
        res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

const getStats = async (req, res) => {
    try {
        const query = `
            SELECT trang_thai_tong_hop, COUNT(*) as count 
            FROM chi_tiet_mau 
            GROUP BY trang_thai_tong_hop
        `;
        const result = await pool.query(query);

        const stats = result.rows.reduce((acc, row) => {
            acc[row.trang_thai_tong_hop] = parseInt(row.count, 10);
            return acc;
        }, {});

        res.json({ success: true, data: stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    search,
    list,
    getDetail,
    create,
    update,
    bulkUpdate,
    deleteSample,
    cloneSample,
    encodeSample,
    getStats
};
