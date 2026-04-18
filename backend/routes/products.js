const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


router.get('/shop/:shopId', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products WHERE shop_id = ? AND is_active = true', [req.params.shopId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/shop/:shopId', authenticateToken, authorizeRole('seller'), upload.single('image'), async (req, res) => {
    try {
        const { shopId } = req.params;
        const { name, description, price, stock } = req.body;
        
        let image_url = 'https://picsum.photos/150';
        if (req.file) {
            image_url = '/uploads/' + req.file.filename;
        }

        const shopResult = await db.query('SELECT * FROM shops WHERE id = ? AND seller_id = ?', [shopId, req.user.id]);
        if (shopResult.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized for this shop' });
        }

        const result = await db.query(
            'INSERT INTO products (shop_id, name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [shopId, name, description, price, stock, image_url]
        );
        res.status(201).json({ id: result.insertId, shop_id: shopId, name, description, price, stock, image_url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id', authenticateToken, authorizeRole('seller'), async (req, res) => {
    try {
        const { name, description, price, stock, image_url, is_active } = req.body;
        
        const productCheck = await db.query(`
            SELECT p.id FROM products p 
            JOIN shops s ON p.shop_id = s.id 
            WHERE p.id = ? AND s.seller_id = ?
        `, [req.params.id, req.user.id]);

        if (productCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized for this product' });
        }

        await db.query(
            'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ?, is_active = ? WHERE id = ?',
            [name, description, price, stock, image_url, is_active, req.params.id]
        );
        res.json({ message: 'Product updated', id: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
