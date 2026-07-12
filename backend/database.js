const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function queryAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

async function run(sql, params = []) {
  const trimmed = sql.trim();
  if (trimmed.toUpperCase().startsWith('INSERT') && !trimmed.toUpperCase().includes('RETURNING')) {
    sql += ' RETURNING id';
  }
  const result = await pool.query(sql, params);
  return { changes: result.rowCount, lastInsertRowid: result.rows[0]?.id };
}

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS brands (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      brand_id INTEGER REFERENCES brands(id),
      category_id INTEGER REFERENCES categories(id),
      os TEXT CHECK(os IN ('Android','iOS')),
      ram TEXT,
      storage TEXT,
      camera TEXT,
      battery TEXT,
      processor TEXT,
      screen_size TEXT,
      condition TEXT CHECK(condition IN ('new','used','refurbished')),
      price REAL NOT NULL,
      discount_price REAL,
      stock INTEGER DEFAULT 0,
      description TEXT,
      images TEXT DEFAULT '[]',
      featured INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS carts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      items JSONB NOT NULL,
      total REAL NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pincode TEXT NOT NULL,
      phone TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'placed',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sell_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      condition TEXT NOT NULL,
      asking_price REAL,
      description TEXT,
      images TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT CHECK(discount_type IN ('percentage','fixed')),
      discount_value REAL NOT NULL,
      min_order REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      expires_at TIMESTAMP,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_config (
      id SERIAL PRIMARY KEY,
      method TEXT UNIQUE NOT NULL,
      enabled INTEGER DEFAULT 1,
      api_key TEXT,
      api_secret TEXT,
      merchant_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const admin = await queryOne('SELECT id FROM users WHERE email = $1', ['admin@agrawalmobiles.com']);
  if (!admin) {
    const hashed = bcrypt.hashSync('admin123', 10);
    await run('INSERT INTO users (name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5)', ['Admin', 'admin@agrawalmobiles.com', '8460431599', hashed, 'admin']);
  }

  const pmtCount = await queryOne('SELECT COUNT(*)::int as cnt FROM payment_config');
  if (pmtCount.cnt === 0) {
    await run('INSERT INTO payment_config (method, enabled) VALUES ($1, $2)', ['cod', 1]);
    await run('INSERT INTO payment_config (method, enabled) VALUES ($1, $2)', ['upi', 1]);
    await run('INSERT INTO payment_config (method, enabled) VALUES ($1, $2)', ['card', 1]);
    await run('INSERT INTO payment_config (method, enabled) VALUES ($1, $2)', ['netbanking', 0]);
  }

  const brandCount = await queryOne('SELECT COUNT(*)::int as cnt FROM brands');
  if (brandCount.cnt === 0) {
    const brandNames = ['Samsung','Apple','Xiaomi','Vivo','Oppo','Realme','OnePlus','Nothing','Motorola','Google'];
    for (const b of brandNames) {
      await run('INSERT INTO brands (name) VALUES ($1)', [b]);
    }
  }

  const catCount = await queryOne('SELECT COUNT(*)::int as cnt FROM categories');
  if (catCount.cnt === 0) {
    await run('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)', ['Android Phones', 'android-phones', 'All Android smartphones']);
    await run('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)', ['iOS / iPhones', 'ios-iphones', 'Apple iPhone models']);
    await run('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)', ['Refurbished', 'refurbished', 'Certified pre-owned phones']);
    await run('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)', ['New Arrivals', 'new-arrivals', 'Latest launched phones']);
    await run('INSERT INTO categories (name, slug, description) VALUES ($1, $2, $3)', ['Accessories', 'accessories', 'Phone accessories']);
  }

  const prodCount = await queryOne('SELECT COUNT(*)::int as cnt FROM products');
  if (prodCount.cnt === 0) {
    const samsung = (await queryOne("SELECT id FROM brands WHERE name = $1", ['Samsung'])).id;
    const apple = (await queryOne("SELECT id FROM brands WHERE name = $1", ['Apple'])).id;
    const xiaomi = (await queryOne("SELECT id FROM brands WHERE name = $1", ['Xiaomi'])).id;
    const android = (await queryOne("SELECT id FROM categories WHERE slug = $1", ['android-phones'])).id;
    const ios = (await queryOne("SELECT id FROM categories WHERE slug = $1", ['ios-iphones'])).id;

    await run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      ['Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', samsung, android, 'Android', '12GB', '256GB', '200MP + 50MP + 12MP + 10MP', '5000mAh', 'Snapdragon 8 Gen 3', '6.8 inches', 'new', 129999, 119999, 15, 'The ultimate Galaxy experience with AI features and S Pen.', '["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400"]', 1]);

    await run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      ['Samsung Galaxy S24', 'samsung-galaxy-s24', samsung, android, 'Android', '8GB', '256GB', '50MP + 12MP + 10MP', '4000mAh', 'Exynos 2400', '6.2 inches', 'new', 79999, 74999, 20, 'Compact flagship with powerful AI capabilities.', '["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400"]', 0]);

    await run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      ['iPhone 15 Pro Max', 'iphone-15-pro-max', apple, ios, 'iOS', '8GB', '256GB', '48MP + 12MP + 12MP', '4422mAh', 'A17 Pro', '6.7 inches', 'new', 159900, 149900, 10, 'Apple\'s most powerful iPhone with titanium design.', '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"]', 1]);

    await run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      ['iPhone 15', 'iphone-15', apple, ios, 'iOS', '6GB', '128GB', '48MP + 12MP', '3349mAh', 'A16 Bionic', '6.1 inches', 'new', 79900, 74900, 25, 'Dynamic Island and 48MP camera system.', '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"]', 0]);

    await run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      ['Xiaomi 14 Pro', 'xiaomi-14-pro', xiaomi, android, 'Android', '12GB', '256GB', '50MP + 50MP + 50MP', '4880mAh', 'Snapdragon 8 Gen 3', '6.73 inches', 'new', 79999, 74999, 18, 'Leica-powered camera system with flagship performance.', '["https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400"]', 1]);

    await run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      ['Samsung Galaxy S23 FE', 'samsung-galaxy-s23-fe', samsung, android, 'Android', '8GB', '128GB', '50MP + 8MP + 12MP', '4500mAh', 'Exynos 2200', '6.4 inches', 'refurbished', 49999, 35999, 8, 'Refurbished flagship experience at a great price.', '["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400"]', 0]);

    await run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      ['iPhone 14 Pro Max', 'iphone-14-pro-max', apple, ios, 'iOS', '6GB', '256GB', '48MP + 12MP + 12MP', '4323mAh', 'A16 Bionic', '6.7 inches', 'used', 129900, 89900, 5, 'Pre-owned in excellent condition.', '["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400"]', 0]);
  }

  console.log('Database initialized with seed data.');
}

let ready = false;
const readyPromise = initDb().then(() => { ready = true; }).catch(e => {
  console.error('Database init error:', e.message);
  process.exit(1);
});

module.exports = { queryAll, queryOne, run, readyPromise };