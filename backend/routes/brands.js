const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const brands = await db.queryAll(`SELECT b.*, (SELECT COUNT(*)::int FROM products WHERE brand_id = b.id AND status='active') as product_count FROM brands b ORDER BY b.name`);
    res.json(brands);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.run('INSERT INTO brands (name) VALUES ($1)', [name]);
    res.json({ id: result.lastInsertRowid });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.run('UPDATE brands SET name = $1 WHERE id = $2', [req.body.name, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.run('DELETE FROM brands WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
