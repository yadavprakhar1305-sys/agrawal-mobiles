const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const items = db.queryAll(`SELECT c.id, c.quantity, p.*, b.name as brand_name FROM carts c LEFT JOIN products p ON c.product_id = p.id LEFT JOIN brands b ON p.brand_id = b.id WHERE c.user_id = ?`, [req.user.id]);
  res.json(items);
});

router.post('/', auth, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const existing = db.queryOne('SELECT id, quantity FROM carts WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
  if (existing) {
    db.run('UPDATE carts SET quantity = ? WHERE id = ?', [existing.quantity + quantity, existing.id]);
  } else {
    db.run('INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)', [req.user.id, product_id, quantity]);
  }
  res.json({ success: true });
});

router.put('/:id', auth, (req, res) => {
  db.run('UPDATE carts SET quantity = ? WHERE id = ? AND user_id = ?', [req.body.quantity, req.params.id, req.user.id]);
  res.json({ success: true });
});

router.delete('/:id', auth, (req, res) => {
  db.run('DELETE FROM carts WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.delete('/', auth, (req, res) => {
  db.run('DELETE FROM carts WHERE user_id = ?', [req.user.id]);
  res.json({ success: true });
});

module.exports = router;
