const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const configs = await db.queryAll('SELECT method, enabled FROM payment_config');
    res.json(configs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:method', auth, adminOnly, async (req, res) => {
  try {
    const { enabled, api_key, api_secret, merchant_id } = req.body;
    const existing = await db.queryOne('SELECT * FROM payment_config WHERE method = ?', [req.params.method]);
    if (!existing) return res.status(404).json({ error: 'Payment method not found' });
    await db.run('UPDATE payment_config SET enabled = ?, api_key = COALESCE(?, api_key), api_secret = COALESCE(?, api_secret), merchant_id = COALESCE(?, merchant_id) WHERE method = ?',
      [enabled ?? existing.enabled, api_key, api_secret, merchant_id, req.params.method]);
    await db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.user.id, 'update_payment', `Updated payment method: ${req.params.method}`]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
