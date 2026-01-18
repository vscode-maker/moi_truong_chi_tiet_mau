const { pool } = require('../config/db');

// Middleware to sanitize table name
const sanitizeTable = async (req, res, next) => {
    const table = req.params.table;
    // Allow alphanumeric and underscore only, basic sanitization
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
        return res.status(400).json({ success: false, message: 'Invalid table name' });
    }
    next();
};

const getMaxSequence = async (req, res) => {
    try {
        const query = `
            SELECT MAX(CAST(NULLIF(regexp_replace(so_thu_tu_phieu, '[^0-9]', '', 'g'), '') AS INTEGER)) as max_seq 
            FROM so_phieu_kq
        `;
        const result = await pool.query(query);
        const maxSeq = result.rows[0].max_seq || 0;
        res.json({ success: true, maxSeq: maxSeq });
    } catch (err) {
        console.error('Error fetching max sequence:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const genericList = async (req, res) => {
    const table = req.params.table;
    const { limit = 100, offset = 0, search, sort, order = 'DESC', ...filters } = req.query;

    try {
        let query = `SELECT * FROM "${table}"`;
        let countQuery = `SELECT COUNT(*) FROM "${table}"`;
        const values = [];
        let whereClauses = [];
        let valueIndex = 1;

        // handle filters
        Object.keys(filters).forEach(key => {
            if (/^[a-zA-Z0-9_]+$/.test(key)) {
                whereClauses.push(`"${key}" = $${valueIndex}`);
                values.push(filters[key]);
                valueIndex++;
            }
        });

        if (whereClauses.length > 0) {
            const whereStmt = ' WHERE ' + whereClauses.join(' AND ');
            query += whereStmt;
            countQuery += whereStmt;
        }

        if (sort && /^[a-zA-Z0-9_]+$/.test(sort)) {
            const dir = (order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
            query += ` ORDER BY "${sort}" ${dir}`;
        } else {
            query += ` ORDER BY 1 DESC`;
        }

        query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
        values.push(limit, offset);

        const { rows } = await pool.query(query, values);
        const filterValues = values.slice(0, values.length - 2);
        const countRes = await pool.query(countQuery, filterValues);

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: parseInt(countRes.rows[0].count),
                limit,
                offset
            }
        });
    } catch (err) {
        console.error(`Error list ${table}:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const genericCreate = async (req, res) => {
    const table = req.params.table;
    const data = req.body;

    const allowedTables = ['so_phieu_kq', 'cong_viec', 'thiet_bi'];
    if (!allowedTables.includes(table)) {
        return res.status(403).json({ success: false, message: 'Table not accessible via generic CRUD' });
    }

    try {
        const keys = Object.keys(data).filter(k => k !== 'id');
        const values = keys.map(k => data[k]);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.map(k => `"${k}"`).join(', ');

        const query = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`;
        const result = await pool.query(query, values);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(`Error create ${table}:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const genericUpdate = async (req, res) => {
    const table = req.params.table;
    const id = req.params.id;
    const data = req.body;

    const allowedTables = ['so_phieu_kq', 'cong_viec', 'thiet_bi'];
    if (!allowedTables.includes(table)) {
        return res.status(403).json({ success: false, message: 'Table not accessible via generic CRUD' });
    }

    try {
        const keys = Object.keys(data).filter(k => k !== 'id');
        if (keys.length === 0) return res.json({ success: true, data: data });

        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const values = [...keys.map(k => data[k]), id];

        const query = `UPDATE "${table}" SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
        const result = await pool.query(query, values);

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(`Error update ${table}:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const genericDelete = async (req, res) => {
    const table = req.params.table;
    const id = req.params.id;

    const allowedTables = ['so_phieu_kq', 'cong_viec', 'thiet_bi', 'don_hang'];
    if (!allowedTables.includes(table)) {
        return res.status(403).json({ success: false, message: 'Table not accessible via generic CRUD' });
    }

    try {
        await pool.query(`DELETE FROM "${table}" WHERE id = $1`, [id]);
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (err) {
        console.error(`Error delete ${table}:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
};

const getDistinctValues = async (req, res) => {
    const { table, column } = req.params;

    if (!/^[a-zA-Z0-9_]+$/.test(column)) {
        return res.status(400).json({ success: false, message: 'Invalid column name' });
    }

    try {
        const query = `SELECT DISTINCT "${column}" FROM "${table}" WHERE "${column}" IS NOT NULL AND "${column}" != '' ORDER BY "${column}"`;
        const result = await pool.query(query);
        const values = result.rows.map(row => row[column]);

        res.json({ success: true, data: values });
    } catch (err) {
        console.error(`Error distinct ${table} ${column}:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    sanitizeTable,
    getMaxSequence,
    genericList,
    genericCreate,
    genericUpdate,
    genericDelete,
    getDistinctValues
};
