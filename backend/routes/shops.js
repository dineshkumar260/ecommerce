const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 5 } = req.query;
        
        let query;
        let params = [];

        if (lat && lng) {
            query = `
                SELECT * FROM (
                    SELECT id, seller_id, name, description, address, latitude, longitude, is_active,
                    (
                        6371 * acos(
                            LEAST(1.0, cos(radians(?)) * cos(radians(latitude)) *
                            cos(radians(longitude) - radians(?)) +
                            sin(radians(?)) * sin(radians(latitude)))
                        )
                    ) AS distance
                    FROM shops
                    WHERE is_active = true
                ) AS subq
                ORDER BY distance ASC
                LIMIT 50
            `;
            params = [lat, lng, lat];
        } else {
            query = 'SELECT * FROM shops WHERE is_active = true';
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('MySQL spatial query failed: ', err);
        try {
            const fallbackResult = await db.query('SELECT * FROM shops WHERE is_active = true');
            res.json(fallbackResult.rows);
        } catch (e) {
            res.status(500).json({ error: 'Server error' });
        }
    }
});

router.post('/', authenticateToken, authorizeRole('seller'), async (req, res) => {
    try {
        const { name, description, address, latitude, longitude } = req.body;
        const result = await db.query(
            'INSERT INTO shops (seller_id, name, description, address, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, name, description, address, latitude, longitude]
        );
        res.status(201).json({ id: result.insertId, seller_id: req.user.id, name, description, address, latitude, longitude });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/my-shops', authenticateToken, authorizeRole('seller'), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM shops WHERE seller_id = ?', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM shops WHERE id = ?', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
