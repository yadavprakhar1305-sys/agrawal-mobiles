const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { items, total, address, city, pincode, phone, payment_method, notes } = req.body;
    if (!items || !address || !city || !pincode || !phone || !payment_method) return res.status(400).json({ error: 'Missing required fields' });
    const orderNo = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const result = await db.run('INSERT INTO orders (order_no, user_id, items, total, address, city, pincode, phone, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [orderNo, req.user.id, items, total, address, city, pincode, phone, payment_method, notes || '']);

    await db.run('DELETE FROM carts WHERE user_id = $1', [req.user.id]);

    for (const item of items) {
      await db.run('UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0', [item.product_id || item.id]);
    }

    res.json({ id: result.lastInsertRowid, order_no: orderNo });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const orders = await db.queryAll('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(orders.map(o => ({ ...o, items: o.items })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const order = await db.queryOne('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ ...order, items: order.items });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
