const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const items = db.queryAll(`SELECT w.id, p.*, b.name as brand_name FROM wishlists w LEFT JOIN products p ON w.product_id = p.id LEFT JOIN brands b ON p.brand_id = b.id WHERE w.user_id = ?`, [req.user.id]);
  res.json(items);
});

router.post('/', auth, (req, res) => {
  const { product_id } = req.body;
  const existing = db.queryOne('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
  if (existing) return res.json({ success: true, message: 'Already in wishlist' });
  db.run('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
  res.json({ success: true });
});

router.delete('/:product_id', auth, (req, res) => {
  db.run('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.product_id]);
  res.json({ success: true });
});

module.exports = router;
