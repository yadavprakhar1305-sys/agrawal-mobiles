const express = require('express');
const db = require('../database');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, (req, res) => {
  const { items, total, address, city, pincode, phone, payment_method, notes } = req.body;
  if (!items || !address || !city || !pincode || !phone || !payment_method) return res.status(400).json({ error: 'Missing required fields' });
  const orderNo = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const result = db.run('INSERT INTO orders (order_no, user_id, items, total, address, city, pincode, phone, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [orderNo, req.user.id, JSON.stringify(items), total, address, city, pincode, phone, payment_method, notes || '']);

  db.run('DELETE FROM carts WHERE user_id = ?', [req.user.id]);

  const deduct = db.queryAll('SELECT id FROM products WHERE id IN (' + items.map((_, i) => '?' ).join(',') + ') AND stock > 0', items.map(i => i.product_id || i.id));
  items.forEach(item => {
    db.run('UPDATE products SET stock = stock - 1 WHERE id = ? AND stock > 0', [item.product_id || item.id]);
  });

  res.json({ id: result.lastInsertRowid, order_no: orderNo });
});

router.get('/', auth, (req, res) => {
  const orders = db.queryAll('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
  res.json(orders.map(o => ({ ...o, items: JSON.parse(o.items) })));
});

router.get('/:id', auth, (req, res) => {
  const order = db.queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ ...order, items: JSON.parse(order.items) });
});

module.exports = router;
