const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRole('customer'), async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const { shop_id, items, delivery_address, delivery_lat, delivery_lng, payment_id } = req.body;

        const total_amount = items.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);

        await connection.beginTransaction();

        const [orderResult] = await connection.execute(
            `INSERT INTO orders (customer_id, shop_id, total_amount, status, delivery_address, delivery_lat, delivery_lng) 
             VALUES (?, ?, ?, 'placed', ?, ?, ?)`,
            [req.user.id, shop_id, total_amount, delivery_address, delivery_lat, delivery_lng]
        );
        
        const orderId = orderResult.insertId;

        for (let item of items) {
            await connection.execute(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price_at_time]
            );
        }

        await connection.commit();
        res.status(201).json({ message: 'Order placed', orderId });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/my-orders', authenticateToken, authorizeRole('customer'), async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/seller', authenticateToken, authorizeRole('seller'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*, u.name as customer_name, s.name as shop_name,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('name', p.name, 'qty', oi.quantity, 'price', oi.price_at_time, 'image', p.image_url))
                FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id
            ) as items
            FROM orders o
            JOIN shops s ON o.shop_id = s.id
            JOIN users u ON o.customer_id = u.id
            WHERE s.seller_id = ?
            ORDER BY o.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/delivery/available', authenticateToken, authorizeRole('delivery'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*, 
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('name', p.name, 'qty', oi.quantity, 'price', oi.price_at_time))
                FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id
            ) as items
            FROM orders o 
            WHERE o.status = 'placed' OR o.status = 'accepted' 
            ORDER BY o.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/delivery/my-assignments', authenticateToken, authorizeRole('delivery'), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*, 
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT('name', p.name, 'qty', oi.quantity, 'price', oi.price_at_time))
                FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = o.id
            ) as items
            FROM orders o 
            WHERE o.delivery_partner_id = ? 
            ORDER BY o.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;

        let updateQuery = 'UPDATE orders SET status = ? WHERE id = ?';
        let params = [status, req.params.id];

        if (req.user.role === 'delivery' && status === 'picked') {
            updateQuery = 'UPDATE orders SET status = ?, delivery_partner_id = ? WHERE id = ?';
            params = [status, req.user.id, req.params.id];
        }

        await db.query(updateQuery, params);
        res.json({ message: 'Status updated successfully', orderId: req.params.id, status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
