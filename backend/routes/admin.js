const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, adminOnly, (req, res) => {
  const totalProducts = db.queryOne("SELECT COUNT(*) as count FROM products").count;
  const totalOrders = db.queryOne("SELECT COUNT(*) as count FROM orders").count;
  const totalUsers = db.queryOne("SELECT COUNT(*) as count FROM users WHERE role='customer'").count;
  const totalRevenue = db.queryOne("SELECT COALESCE(SUM(total),0) as total FROM orders WHERE status != 'cancelled'").total;
  const pendingSellRequests = db.queryOne("SELECT COUNT(*) as count FROM sell_requests WHERE status='pending'").count;
  const recentOrders = db.queryAll("SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5");
  const salesByBrand = db.queryAll(`SELECT b.name, COUNT(*) as count, COALESCE(SUM(o.total),0) as revenue FROM orders o LEFT JOIN json_each(o.items) items ON 1=1 LEFT JOIN products p ON json_extract(items.value, '$.product_id') = p.id RIGHT JOIN brands b ON p.brand_id = b.id GROUP BY b.name ORDER BY revenue DESC`);

  res.json({ totalProducts, totalOrders, totalUsers, totalRevenue, pendingSellRequests, recentOrders: recentOrders.map(o => ({...o, items: JSON.parse(o.items)})), salesByBrand });
});

router.get('/orders', auth, adminOnly, (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  let sql = `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone FROM orders o LEFT JOIN users u ON o.user_id = u.id`;
  const params = [];
  if (status) { sql += ` WHERE o.status = ?`; params.push(status); }
  sql += ` ORDER BY o.created_at DESC`;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  sql += ` LIMIT ? OFFSET ?`; params.push(parseInt(limit), offset);
  const orders = db.queryAll(sql, params);
  const total = db.queryOne(`SELECT COUNT(*) as count FROM orders${status ? ' WHERE status = ?' : ''}`, status ? [status] : []).count;
  res.json({ orders: orders.map(o => ({...o, items: JSON.parse(o.items)})), total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

router.put('/orders/:id/status', auth, adminOnly, (req, res) => {
  const { status, notes } = req.body;
  db.run('UPDATE orders SET status = ?, notes = COALESCE(?, notes) WHERE id = ?', [status, notes, req.params.id]);
  db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.user.id, 'update_order', `Updated order ${req.params.id} to status: ${status}`]);
  res.json({ success: true });
});

router.get('/users', auth, adminOnly, (req, res) => {
  const users = db.queryAll("SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC");
  res.json(users);
});

router.put('/users/:id/status', auth, adminOnly, (req, res) => {
  const { status } = req.body;
  db.run('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ success: true });
});

router.get('/products', auth, adminOnly, (req, res) => {
  const products = db.queryAll(`SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC`);
  res.json(products);
});

router.get('/sell-requests', auth, adminOnly, (req, res) => {
  const requests = db.queryAll(`SELECT s.*, u.name as user_name, u.email, u.phone FROM sell_requests s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC`);
  res.json(requests);
});

router.put('/sell-requests/:id', auth, adminOnly, (req, res) => {
  const { status, admin_notes } = req.body;
  db.run('UPDATE sell_requests SET status = ?, admin_notes = COALESCE(?, admin_notes) WHERE id = ?', [status, admin_notes, req.params.id]);
  res.json({ success: true });
});

router.get('/logs', auth, adminOnly, (req, res) => {
  const logs = db.queryAll(`SELECT l.*, u.name as admin_name FROM admin_logs l LEFT JOIN users u ON l.admin_id = u.id ORDER BY l.created_at DESC LIMIT 50`);
  res.json(logs);
});

module.exports = router;
