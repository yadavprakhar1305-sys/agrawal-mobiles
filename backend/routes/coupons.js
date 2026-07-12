const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let coupons;
    if (req.user.role === 'admin') {
      coupons = await db.queryAll('SELECT * FROM coupons ORDER BY created_at DESC');
    } else {
      coupons = await db.queryAll("SELECT * FROM coupons WHERE status='active' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) AND used_count < max_uses");
    }
    res.json(coupons);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/validate', auth, async (req, res) => {
  try {
    const { code, order_total } = req.body;
    const coupon = await db.queryOne("SELECT * FROM coupons WHERE code = ? AND status='active' AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP) AND used_count < max_uses", [code]);
    if (!coupon) return res.status(400).json({ error: 'Invalid or expired coupon' });
    if (order_total < coupon.min_order) return res.status(400).json({ error: `Minimum order amount is ₹${coupon.min_order}` });
    const discount = coupon.discount_type === 'percentage' ? (order_total * coupon.discount_value / 100) : coupon.discount_value;
    res.json({ valid: true, discount, coupon });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order, max_uses, expires_at } = req.body;
    await db.run('INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [code.toUpperCase(), discount_type, discount_value, min_order || 0, max_uses || 100, expires_at || null]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { code, discount_type, discount_value, min_order, max_uses, expires_at, status } = req.body;
    await db.run('UPDATE coupons SET code=COALESCE(?,code), discount_type=COALESCE(?,discount_type), discount_value=COALESCE(?,discount_value), min_order=COALESCE(?,min_order), max_uses=COALESCE(?,max_uses), expires_at=COALESCE(?,expires_at), status=COALESCE(?,status) WHERE id=?',
      [code, discount_type, discount_value, min_order, max_uses, expires_at, status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.run('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
