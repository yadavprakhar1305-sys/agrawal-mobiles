const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { brand, model, condition, asking_price, description, images } = req.body;
    if (!brand || !model || !condition) return res.status(400).json({ error: 'Brand, model and condition are required' });
    await db.run('INSERT INTO sell_requests (user_id, brand, model, condition, asking_price, description, images) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [req.user.id, brand, model, condition, asking_price || null, description || '', JSON.stringify(images || [])]);
    res.json({ success: true, message: 'Your request has been submitted for review' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const requests = await db.queryAll('SELECT * FROM sell_requests WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(requests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
