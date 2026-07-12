const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const items = await db.queryAll(`SELECT c.id, c.quantity, p.*, b.name as brand_name FROM carts c LEFT JOIN products p ON c.product_id = p.id LEFT JOIN brands b ON p.brand_id = b.id WHERE c.user_id = $1`, [req.user.id]);
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const existing = await db.queryOne('SELECT id, quantity FROM carts WHERE user_id = $1 AND product_id = $2', [req.user.id, product_id]);
    if (existing) {
      await db.run('UPDATE carts SET quantity = $1 WHERE id = $2', [existing.quantity + quantity, existing.id]);
    } else {
      await db.run('INSERT INTO carts (user_id, product_id, quantity) VALUES ($1, $2, $3)', [req.user.id, product_id, quantity]);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    await db.run('UPDATE carts SET quantity = $1 WHERE id = $2 AND user_id = $3', [req.body.quantity, req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.run('DELETE FROM carts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/', auth, async (req, res) => {
  try {
    await db.run('DELETE FROM carts WHERE user_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
