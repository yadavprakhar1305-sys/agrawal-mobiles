const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { brand, category, os, condition, min_price, max_price, search, sort, featured, page = 1, limit = 20 } = req.query;
    let sql = `SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active'`;
    const params = [];
    let paramIdx = 0;

    function addParam(val, clause) {
      if (val) { paramIdx++; sql += ` AND ${clause} $${paramIdx}`; params.push(val); }
    }
    addParam(brand, 'p.brand_id =');
    addParam(category, 'p.category_id =');
    addParam(os, 'p.os =');
    addParam(condition, 'p.condition =');
    addParam(min_price, 'p.price >=');
    addParam(max_price, 'p.price <=');
    if (search) { paramIdx++; sql += ` AND (p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`; params.push(`%${search}%`); }
    if (featured === '1') { sql += ' AND p.featured = 1'; }

    if (sort === 'price_asc') sql += ' ORDER BY p.price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY p.price DESC';
    else if (sort === 'newest') sql += ' ORDER BY p.created_at DESC';
    else if (sort === 'name') sql += ' ORDER BY p.name ASC';
    else sql += ' ORDER BY p.featured DESC, p.created_at DESC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    paramIdx++; sql += ` LIMIT $${paramIdx}`; params.push(parseInt(limit));
    paramIdx++; sql += ` OFFSET $${paramIdx}`; params.push(offset);

    const products = await db.queryAll(sql, params);
    const total = products.length > 0 ? 0 : 0; // will be replaced below

    let countSql = `SELECT COUNT(*)::int as total FROM products p WHERE p.status = 'active'`;
    const countParams = [];
    let countIdx = 0;
    function addCountParam(val, clause) {
      if (val) { countIdx++; countSql += ` AND ${clause} $${countIdx}`; countParams.push(val); }
    }
    addCountParam(brand, 'p.brand_id =');
    addCountParam(category, 'p.category_id =');
    addCountParam(os, 'p.os =');
    addCountParam(condition, 'p.condition =');
    addCountParam(min_price, 'p.price >=');
    addCountParam(max_price, 'p.price <=');
    if (search) { countIdx++; countSql += ` AND (p.name ILIKE $${countIdx} OR p.description ILIKE $${countIdx})`; countParams.push(`%${search}%`); }

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
    const product = await db.queryOne(`SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id WHERE ${isId ? 'p.id' : 'p.slug'} = $1`, [idOrSlug]);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    const reviews = await db.queryAll(`SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.product_id = $1 ORDER BY r.created_at DESC`, [product.id]);
    const avgRating = await db.queryOne(`SELECT AVG(rating)::float as avg, COUNT(*)::int as count FROM reviews WHERE product_id = $1`, [product.id]);
    res.json({ ...product, reviews, avg_rating: avgRating.avg || 0, review_count: avgRating.count || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const result = await db.run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price || null, stock, description, JSON.stringify(images || []), featured || 0]);
    await db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'create_product', `Created product: ${name}`]);
    res.json({ id: result.lastInsertRowid, slug });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured, status } = req.body;
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;
    const existing = await db.queryOne('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    await db.run(`UPDATE products SET name=COALESCE($1,name), slug=COALESCE($2,slug), brand_id=COALESCE($3,brand_id), category_id=COALESCE($4,category_id), os=COALESCE($5,os), ram=COALESCE($6,ram), storage=COALESCE($7,storage), camera=COALESCE($8,camera), battery=COALESCE($9,battery), processor=COALESCE($10,processor), screen_size=COALESCE($11,screen_size), condition=COALESCE($12,condition), price=COALESCE($13,price), discount_price=$14, stock=COALESCE($15,stock), description=COALESCE($16,description), images=COALESCE($17,images), featured=COALESCE($18,featured), status=COALESCE($19,status) WHERE id=$20`,
      [name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price ?? existing.discount_price, stock, description, images ? JSON.stringify(images) : undefined, featured ?? existing.featured, status, req.params.id]);
    await db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'update_product', `Updated product ID ${req.params.id}: ${name || existing.name}`]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await db.run('DELETE FROM products WHERE id = $1', [req.params.id]);
    await db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'delete_product', `Deleted product ID ${req.params.id}`]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
