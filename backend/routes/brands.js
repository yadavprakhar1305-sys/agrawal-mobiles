const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const brands = db.queryAll(`SELECT b.*, (SELECT COUNT(*) FROM products WHERE brand_id = b.id AND status='active') as product_count FROM brands b ORDER BY b.name`);
  res.json(brands);
});

router.post('/', auth, adminOnly, (req, res) => {
  const { name } = req.body;
  const result = db.run('INSERT INTO brands (name) VALUES (?)', [name]);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', auth, adminOnly, (req, res) => {
  db.run('UPDATE brands SET name = ? WHERE id = ?', [req.body.name, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', auth, adminOnly, (req, res) => {
  db.run('DELETE FROM brands WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
