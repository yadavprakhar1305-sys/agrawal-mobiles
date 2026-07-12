const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', auth, adminOnly, async (req, res) => {
  try {
    const totalProducts = (await db.queryOne("SELECT COUNT(*) as count FROM products")).count;
    const totalOrders = (await db.queryOne("SELECT COUNT(*) as count FROM orders")).count;
    const totalUsers = (await db.queryOne("SELECT COUNT(*) as count FROM users WHERE role='customer'")).count;
    const totalRevenue = (await db.queryOne("SELECT COALESCE(SUM(total),0) as total FROM orders WHERE status != 'cancelled'")).total;
    const pendingSellRequests = (await db.queryOne("SELECT COUNT(*) as count FROM sell_requests WHERE status='pending'")).count;
    const recentOrders = await db.queryAll("SELECT o.*, u.name as user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5");
    res.json({ totalProducts, totalOrders, totalUsers, totalRevenue, pendingSellRequests, recentOrders: recentOrders.map(o => ({...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items})), salesByBrand: [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/orders', auth, adminOnly, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const limitNum = parseInt(limit), offset = (parseInt(page) - 1) * limitNum;
    const parseItems = o => ({...o, items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items});
    if (status) {
      const orders = await db.queryAll('SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.status = ? ORDER BY o.created_at DESC LIMIT ? OFFSET ?', [status, limitNum, offset]);
      const total = (await db.queryOne('SELECT COUNT(*) as count FROM orders WHERE status = ?', [status])).count;
      return res.json({ orders: orders.map(parseItems), total, page: parseInt(page), pages: Math.ceil(total / limitNum) });
    }
    const orders = await db.queryAll('SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?', [limitNum, offset]);
    const total = (await db.queryOne('SELECT COUNT(*) as count FROM orders')).count;
    res.json({ orders: orders.map(parseItems), total, page: parseInt(page), pages: Math.ceil(total / limitNum) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/orders/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status, notes } = req.body;
    await db.run('UPDATE orders SET status = ?, notes = COALESCE(?, notes) WHERE id = ?', [status, notes, req.params.id]);
    await db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.user.id, 'update_order', `Updated order ${req.params.id} to status: ${status}`]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await db.queryAll("SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC");
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/users/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    await db.run('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/products', auth, adminOnly, async (req, res) => {
  try {
    const products = await db.queryAll(`SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC`);
    res.json(products);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/sell-requests', auth, adminOnly, async (req, res) => {
  try {
    const requests = await db.queryAll(`SELECT s.*, u.name as user_name, u.email, u.phone FROM sell_requests s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC`);
    res.json(requests);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/sell-requests/:id', auth, adminOnly, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    await db.run('UPDATE sell_requests SET status = ?, admin_notes = COALESCE(?, admin_notes) WHERE id = ?', [status, admin_notes, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/logs', auth, adminOnly, async (req, res) => {
  try {
    const logs = await db.queryAll(`SELECT l.*, u.name as admin_name FROM admin_logs l LEFT JOIN users u ON l.admin_id = u.id ORDER BY l.created_at DESC LIMIT 50`);
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
