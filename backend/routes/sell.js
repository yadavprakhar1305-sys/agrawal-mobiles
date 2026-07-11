const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, (req, res) => {
  const { brand, model, condition, asking_price, description, images } = req.body;
  if (!brand || !model || !condition) return res.status(400).json({ error: 'Brand, model and condition are required' });
  db.run('INSERT INTO sell_requests (user_id, brand, model, condition, asking_price, description, images) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, brand, model, condition, asking_price || null, description || '', JSON.stringify(images || [])]);
  res.json({ success: true, message: 'Your request has been submitted for review' });
});

router.get('/', auth, (req, res) => {
  const requests = db.queryAll('SELECT * FROM sell_requests WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(requests);
});

module.exports = router;
