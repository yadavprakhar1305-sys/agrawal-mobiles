const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, (req, res) => {
  const { product_id, rating, comment } = req.body;
  if (!product_id || !rating) return res.status(400).json({ error: 'Product and rating required' });
  const existing = db.queryOne('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
  if (existing) return res.status(400).json({ error: 'You have already reviewed this product' });
  db.run('INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)', [req.user.id, product_id, rating, comment || '']);
  res.json({ success: true });
});

router.get('/product/:productId', (req, res) => {
  const reviews = db.queryAll(`SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC`, [req.params.productId]);
  res.json(reviews);
});

module.exports = router;
