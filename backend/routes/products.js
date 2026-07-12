const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { brand, category, os, condition, min_price, max_price, search, sort, featured, page = 1, limit = 20 } = req.query;
    let sql = `SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active'`;
    const params = [];

    function addParam(val, clause) {
      if (val) { sql += ` AND ${clause} ?`; params.push(val); }
    }
    addParam(brand, 'p.brand_id =');
    addParam(category, 'p.category_id =');
    addParam(os, 'p.os =');
    addParam(condition, 'p.condition =');
    addParam(min_price, 'p.price >=');
    addParam(max_price, 'p.price <=');
    if (search) { sql += ` AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?))`; params.push(`%${search}%`, `%${search}%`); }
    if (featured === '1') { sql += ' AND p.featured = 1'; }

    if (sort === 'price_asc') sql += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
    else if (sort === 'newest') sql += ' ORDER BY p.created_at DESC';
    else if (sort === 'name') sql += ' ORDER BY p.name ASC';
    else sql += ' ORDER BY p.featured DESC, p.created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const products = await db.queryAll(sql, params);

    let countSql = `SELECT COUNT(*) as total FROM products p WHERE p.status = 'active'`;
    const countParams = [];
    function addCountParam(val, clause) {
      if (val) { countSql += ` AND ${clause} ?`; countParams.push(val); }
    }
    addCountParam(brand, 'p.brand_id =');
    addCountParam(category, 'p.category_id =');
    addCountParam(os, 'p.os =');
    addCountParam(condition, 'p.condition =');
    addCountParam(min_price, 'p.price >=');
    addCountParam(max_price, 'p.price <=');
    if (search) { countSql += ` AND (LOWER(p.name) LIKE LOWER(?) OR LOWER(p.description) LIKE LOWER(?))`; countParams.push(`%${search}%`, `%${search}%`); }

    const countResult = await db.queryOne(countSql, countParams);
    res.json({ products, total: countResult.total, page: parseInt(page), pages: Math.ceil(countResult.total / parseInt(limit)) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/featured', async (req, res) => {
  try {
    const products = await db.queryAll(`SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id WHERE p.featured = 1 AND p.status = 'active' LIMIT 8`);
    res.json(products);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = /^\d+$/.test(idOrSlug);
    const product = await db.queryOne(`SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id WHERE ${isId ? 'p.id' : 'p.slug'} = ?`, [idOrSlug]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const reviews = await db.queryAll(`SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC`, [product.id]);
    const avgRating = await db.queryOne(`SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id = ?`, [product.id]);
    res.json({ ...product, reviews, avg_rating: avgRating.avg || 0, review_count: avgRating.count || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await db.run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price || null, stock, description, JSON.stringify(images || []), featured || 0]);
    await db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.user.id, 'create_product', `Created product: ${name}`]);
    res.json({ id: result.lastInsertRowid, slug });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured, status } = req.body;
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;
    const existing = await db.queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    await db.run(`UPDATE products SET name=COALESCE(?,name), slug=COALESCE(?,slug), brand_id=COALESCE(?,brand_id), category_id=COALESCE(?,category_id), os=COALESCE(?,os), ram=COALESCE(?,ram), storage=COALESCE(?,storage), camera=COALESCE(?,camera), battery=COALESCE(?,battery), processor=COALESCE(?,processor), screen_size=COALESCE(?,screen_size), condition=COALESCE(?,condition), price=COALESCE(?,price), discount_price=?, stock=COALESCE(?,stock), description=COALESCE(?,description), images=COALESCE(?,images), featured=COALESCE(?,featured), status=COALESCE(?,status) WHERE id=?`,
      [name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price ?? existing.discount_price, stock, description, images ? JSON.stringify(images) : undefined, featured ?? existing.featured, status, req.params.id]);
    await db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.user.id, 'update_product', `Updated product ID ${req.params.id}: ${name || existing.name}`]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    await db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.user.id, 'delete_product', `Deleted product ID ${req.params.id}`]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
