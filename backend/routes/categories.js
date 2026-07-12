const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const cats = await db.queryAll(`SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id AND status='active') as product_count FROM categories c ORDER BY c.name`);
    res.json(cats);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [name, slug, description || '']);
    res.json({ id: result.lastInsertRowid, slug });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;
    await db.run('UPDATE categories SET name=COALESCE(?,name), slug=COALESCE(?,slug), description=COALESCE(?,description) WHERE id=?', [name, slug, description, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
