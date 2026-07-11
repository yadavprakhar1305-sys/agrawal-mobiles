const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const now = new Date().toISOString();
  let coupons;
  if (req.user.role === 'admin') {
    coupons = db.queryAll('SELECT * FROM coupons ORDER BY created_at DESC');
  } else {
    coupons = db.queryAll("SELECT * FROM coupons WHERE status='active' AND (expires_at IS NULL OR expires_at > ?) AND used_count < max_uses", [now]);
  }
  res.json(coupons);
});

router.post('/validate', auth, (req, res) => {
  const { code, order_total } = req.body;
  const now = new Date().toISOString();
  const coupon = db.queryOne("SELECT * FROM coupons WHERE code = ? AND status='active' AND (expires_at IS NULL OR expires_at > ?) AND used_count < max_uses", [code, now]);
  if (!coupon) return res.status(400).json({ error: 'Invalid or expired coupon' });
  if (order_total < coupon.min_order) return res.status(400).json({ error: `Minimum order amount is ₹${coupon.min_order}` });
  const discount = coupon.discount_type === 'percentage' ? (order_total * coupon.discount_value / 100) : coupon.discount_value;
  res.json({ valid: true, discount, coupon });
});

router.post('/', auth, adminOnly, (req, res) => {
  const { code, discount_type, discount_value, min_order, max_uses, expires_at } = req.body;
  db.run('INSERT INTO coupons (code, discount_type, discount_value, min_order, max_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    [code.toUpperCase(), discount_type, discount_value, min_order || 0, max_uses || 100, expires_at || null]);
  res.json({ success: true });
});

router.put('/:id', auth, adminOnly, (req, res) => {
  const { code, discount_type, discount_value, min_order, max_uses, expires_at, status } = req.body;
  db.run('UPDATE coupons SET code=COALESCE(?,code), discount_type=COALESCE(?,discount_type), discount_value=COALESCE(?,discount_value), min_order=COALESCE(?,min_order), max_uses=COALESCE(?,max_uses), expires_at=COALESCE(?,expires_at), status=COALESCE(?,status) WHERE id=?',
    [code, discount_type, discount_value, min_order, max_uses, expires_at, status, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', auth, adminOnly, (req, res) => {
  db.run('DELETE FROM coupons WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
