const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const items = await db.queryAll(`SELECT w.id, p.*, b.name as brand_name FROM wishlists w LEFT JOIN products p ON w.product_id = p.id LEFT JOIN brands b ON p.brand_id = b.id WHERE w.user_id = ?`, [req.user.id]);
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { product_id } = req.body;
    const existing = await db.queryOne('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    if (existing) return res.json({ success: true, message: 'Already in wishlist' });
    await db.run('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:product_id', auth, async (req, res) => {
  try {
    await db.run('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, req.params.product_id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
