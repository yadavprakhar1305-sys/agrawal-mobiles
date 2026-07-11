const express = require('express');
const db = require('../database');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { brand, category, os, condition, min_price, max_price, search, sort, featured, page = 1, limit = 20 } = req.query;
  let sql = `SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active'`;
  const params = [];

  if (brand) { sql += ` AND p.brand_id = ?`; params.push(brand); }
  if (category) { sql += ` AND p.category_id = ?`; params.push(category); }
  if (os) { sql += ` AND p.os = ?`; params.push(os); }
  if (condition) { sql += ` AND p.condition = ?`; params.push(condition); }
  if (min_price) { sql += ` AND p.price >= ?`; params.push(min_price); }
  if (max_price) { sql += ` AND p.price <= ?`; params.push(max_price); }
  if (search) { sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  if (featured === '1') { sql += ` AND p.featured = 1`; }

  if (sort === 'price_asc') sql += ` ORDER BY p.price ASC`;
  else if (sort === 'price_desc') sql += ` ORDER BY p.price DESC`;
  else if (sort === 'newest') sql += ` ORDER BY p.created_at DESC`;
  else if (sort === 'name') sql += ` ORDER BY p.name ASC`;
  else sql += ` ORDER BY p.featured DESC, p.created_at DESC`;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  sql += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const products = db.queryAll(sql, params);
  const countSql = `SELECT COUNT(*) as total FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id WHERE p.status = 'active'`;
  const countParams = [];
  if (brand) { countSql += ` AND p.brand_id = ?`; countParams.push(brand); }
  if (category) { countSql += ` AND p.category_id = ?`; countParams.push(category); }
  if (os) { countSql += ` AND p.os = ?`; countParams.push(os); }
  if (condition) { countSql += ` AND p.condition = ?`; countParams.push(condition); }
  if (min_price) { countSql += ` AND p.price >= ?`; countParams.push(min_price); }
  if (max_price) { countSql += ` AND p.price <= ?`; countParams.push(max_price); }
  if (search) { countSql += ` AND (p.name LIKE ? OR p.description LIKE ?)`; countParams.push(`%${search}%`, `%${search}%`); }
  const total = db.queryOne(countSql, countParams).total;

  res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

router.get('/featured', (req, res) => {
  const products = db.queryAll(`SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id WHERE p.featured = 1 AND p.status = 'active' LIMIT 8`);
  res.json(products);
});

router.get('/:idOrSlug', (req, res) => {
  const { idOrSlug } = req.params;
  const isId = /^\d+$/.test(idOrSlug);
  const product = db.queryOne(`SELECT p.*, b.name as brand_name, c.name as category_name FROM products p LEFT JOIN brands b ON p.brand_id = b.id LEFT JOIN categories c ON p.category_id = c.id WHERE ${isId ? 'p.id' : 'p.slug'} = ?`, [idOrSlug]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const reviews = db.queryAll(`SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC`, [product.id]);
  const avgRating = db.queryOne(`SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE product_id = ?`, [product.id]);
  res.json({ ...product, reviews, avg_rating: avgRating.avg || 0, review_count: avgRating.count || 0 });
});

router.post('/', auth, adminOnly, (req, res) => {
  const { name, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const result = db.run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price || null, stock, description, JSON.stringify(images || []), featured || 0]);
  db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.user.id, 'create_product', `Created product: ${name}`]);
  res.json({ id: result.lastInsertRowid, slug });
});

router.put('/:id', auth, adminOnly, (req, res) => {
  const { name, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured, status } = req.body;
  const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;
  const existing = db.queryOne('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.run(`UPDATE products SET name=COALESCE(?,name), slug=COALESCE(?,slug), brand_id=COALESCE(?,brand_id), category_id=COALESCE(?,category_id), os=COALESCE(?,os), ram=COALESCE(?,ram), storage=COALESCE(?,storage), camera=COALESCE(?,camera), battery=COALESCE(?,battery), processor=COALESCE(?,processor), screen_size=COALESCE(?,screen_size), condition=COALESCE(?,condition), price=COALESCE(?,price), discount_price=?, stock=COALESCE(?,stock), description=COALESCE(?,description), images=COALESCE(?,images), featured=COALESCE(?,featured), status=COALESCE(?,status) WHERE id=?`,
    [name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price ?? existing.discount_price, stock, description, images ? JSON.stringify(images) : undefined, featured ?? existing.featured, status, req.params.id]);
  db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.user.id, 'update_product', `Updated product ID ${req.params.id}: ${name || existing.name}`]);
  res.json({ success: true });
});

router.delete('/:id', auth, adminOnly, (req, res) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
  db.run('INSERT INTO admin_logs (admin_id, action, details) VALUES (?, ?, ?)', [req.user.id, 'delete_product', `Deleted product ID ${req.params.id}`]);
  res.json({ success: true });
});

module.exports = router;
