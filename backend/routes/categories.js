const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const cats = db.queryAll(`SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id AND status='active') as product_count FROM categories c ORDER BY c.name`);
  res.json(cats);
});

router.post('/', auth, adminOnly, (req, res) => {
  const { name, description } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const result = db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [name, slug, description || '']);
  res.json({ id: result.lastInsertRowid, slug });
});

router.put('/:id', auth, adminOnly, (req, res) => {
  const { name, description } = req.body;
  const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;
  db.run('UPDATE categories SET name=COALESCE(?,name), slug=COALESCE(?,slug), description=COALESCE(?,description) WHERE id=?', [name, slug, description, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', auth, adminOnly, (req, res) => {
  db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
