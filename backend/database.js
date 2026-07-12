const bcrypt = require('bcryptjs');

let db;
let usePg = false;

async function initDb() {
  if (process.env.DATABASE_URL) {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    function conv(sql, params) {
      let idx = 0;
      const converted = sql.replace(/\?/g, () => `$${++idx}`);
      return { sql: converted, params };
    }
    db = {
      queryAll: async (sql, params) => {
        const c = conv(sql, params);
        return (await pool.query(c.sql, c.params)).rows;
      },
      queryOne: async (sql, params) => {
        const c = conv(sql, params);
        const r = await pool.query(c.sql, c.params);
        return r.rows[0] || null;
      },
      run: async (sql, params) => {
        const c = conv(sql, params);
        let runSql = c.sql;
        const trimmed = runSql.trim().toUpperCase();
        if (trimmed.startsWith('INSERT') && !runSql.includes('RETURNING')) runSql += ' RETURNING id';
        const r = await pool.query(runSql, c.params);
        return { changes: r.rowCount, lastInsertRowid: r.rows[0]?.id };
      },
    };
    usePg = true;
  } else {
    const initSqlJs = require('sql.js');
    const fs = require('fs');
    const path = require('path');
    const DB_PATH = path.join(__dirname, 'agrawal.db');
    const SQL = await initSqlJs();
    let sqldb;
    if (fs.existsSync(DB_PATH)) {
      sqldb = new SQL.Database(fs.readFileSync(DB_PATH));
    } else {
      sqldb = new SQL.Database();
    }
    sqldb.run('PRAGMA foreign_keys = ON');
    const saveDb = () => fs.writeFileSync(DB_PATH, Buffer.from(sqldb.export()));
    const qAll = (sql, params) => {
      const stmt = sqldb.prepare(sql); if (params) stmt.bind(params); const rows = []; while (stmt.step()) rows.push(stmt.getAsObject()); stmt.free(); return rows;
    };
    const qOne = (sql, params) => { const rows = qAll(sql, params); return rows[0] || null; };
    const exec = (sql, params) => { sqldb.run(sql, params); saveDb(); return { changes: sqldb.getRowsModified(), lastInsertRowid: qOne('SELECT last_insert_rowid() as id')?.id }; };
    db = { queryAll: async (s, p) => qAll(s, p), queryOne: async (s, p) => qOne(s, p), run: async (s, p) => exec(s, p) };
  }

  await db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'customer', status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS brands (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, name TEXT NOT NULL UNIQUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, brand_id INTEGER, category_id INTEGER, os TEXT, ram TEXT, storage TEXT, camera TEXT, battery TEXT, processor TEXT, screen_size TEXT, condition TEXT, price REAL NOT NULL, discount_price REAL, stock INTEGER DEFAULT 0, description TEXT, images TEXT DEFAULT '[]', featured INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS carts (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS wishlists (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, order_no TEXT UNIQUE NOT NULL, user_id INTEGER NOT NULL, items TEXT NOT NULL, total REAL NOT NULL, address TEXT NOT NULL, city TEXT NOT NULL, pincode TEXT NOT NULL, phone TEXT NOT NULL, payment_method TEXT NOT NULL, payment_status TEXT DEFAULT 'pending', status TEXT DEFAULT 'placed', notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS sell_requests (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, user_id INTEGER NOT NULL, brand TEXT NOT NULL, model TEXT NOT NULL, condition TEXT NOT NULL, asking_price REAL, description TEXT, images TEXT DEFAULT '[]', status TEXT DEFAULT 'pending', admin_notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, rating INTEGER, comment TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS coupons (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, code TEXT UNIQUE NOT NULL, discount_type TEXT, discount_value REAL NOT NULL, min_order REAL DEFAULT 0, max_uses INTEGER DEFAULT 100, used_count INTEGER DEFAULT 0, expires_at DATETIME, status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS payment_config (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, method TEXT UNIQUE NOT NULL, enabled INTEGER DEFAULT 1, api_key TEXT, api_secret TEXT, merchant_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  await db.run(`CREATE TABLE IF NOT EXISTS admin_logs (id INTEGER PRIMARY KEY AUTOINCREMENT${usePg ? '' : ''}, admin_id INTEGER, action TEXT NOT NULL, details TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);

  const admin = await db.queryOne('SELECT id FROM users WHERE email = ?', ['admin@agrawalmobiles.com']);
  if (!admin) {
    const hashed = bcrypt.hashSync('admin123', 10);
    await db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)', ['Admin', 'admin@agrawalmobiles.com', '8460431599', hashed, 'admin']);
  }

  const pmtCount = await db.queryOne('SELECT COUNT(*) as cnt FROM payment_config');
  if (pmtCount.cnt === 0) {
    await db.run('INSERT INTO payment_config (method, enabled) VALUES (?, ?)', ['cod', 1]);
    await db.run('INSERT INTO payment_config (method, enabled) VALUES (?, ?)', ['upi', 1]);
    await db.run('INSERT INTO payment_config (method, enabled) VALUES (?, ?)', ['card', 1]);
    await db.run('INSERT INTO payment_config (method, enabled) VALUES (?, ?)', ['netbanking', 0]);
  }

  const brandCount = await db.queryOne('SELECT COUNT(*) as cnt FROM brands');
  if (brandCount.cnt === 0) {
    for (const b of ['Samsung','Apple','Xiaomi','Vivo','Oppo','Realme','OnePlus','Nothing','Motorola','Google']) {
      await db.run('INSERT INTO brands (name) VALUES (?)', [b]);
    }
  }

  const catCount = await db.queryOne('SELECT COUNT(*) as cnt FROM categories');
  if (catCount.cnt === 0) {
    await db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['Android Phones', 'android-phones', 'All Android smartphones']);
    await db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['iOS / iPhones', 'ios-iphones', 'Apple iPhone models']);
    await db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['Refurbished', 'refurbished', 'Certified pre-owned phones']);
    await db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['New Arrivals', 'new-arrivals', 'Latest launched phones']);
    await db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['Accessories', 'accessories', 'Phone accessories']);
  }

  const prodCount = await db.queryOne('SELECT COUNT(*) as cnt FROM products');
  if (prodCount.cnt === 0) {
    const samsung = (await db.queryOne("SELECT id FROM brands WHERE name = ?", ['Samsung'])).id;
    const apple = (await db.queryOne("SELECT id FROM brands WHERE name = ?", ['Apple'])).id;
    const xiaomi = (await db.queryOne("SELECT id FROM brands WHERE name = ?", ['Xiaomi'])).id;
    const android = (await db.queryOne("SELECT id FROM categories WHERE slug = ?", ['android-phones'])).id;
    const ios = (await db.queryOne("SELECT id FROM categories WHERE slug = ?", ['ios-iphones'])).id;

    const seed = (n, s, bi, ci, o, r, st, c, b, p, sc, co, pr, dp, sk, d, im, f) =>
      db.run('INSERT INTO products (name,slug,brand_id,category_id,os,ram,storage,camera,battery,processor,screen_size,condition,price,discount_price,stock,description,images,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [n,s,bi,ci,o,r,st,c,b,p,sc,co,pr,dp,sk,d,JSON.stringify([im]),f]);

    await seed('Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', samsung, android, 'Android', '12GB', '256GB', '200MP + 50MP + 12MP + 10MP', '5000mAh', 'Snapdragon 8 Gen 3', '6.8 inches', 'new', 129999, 119999, 15, 'The ultimate Galaxy experience with AI features and S Pen.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', 1);
    await seed('Samsung Galaxy S24', 'samsung-galaxy-s24', samsung, android, 'Android', '8GB', '256GB', '50MP + 12MP + 10MP', '4000mAh', 'Exynos 2400', '6.2 inches', 'new', 79999, 74999, 20, 'Compact flagship with powerful AI capabilities.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', 0);
    await seed('iPhone 15 Pro Max', 'iphone-15-pro-max', apple, ios, 'iOS', '8GB', '256GB', '48MP + 12MP + 12MP', '4422mAh', 'A17 Pro', '6.7 inches', 'new', 159900, 149900, 10, "Apple's most powerful iPhone with titanium design.", 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 1);
    await seed('iPhone 15', 'iphone-15', apple, ios, 'iOS', '6GB', '128GB', '48MP + 12MP', '3349mAh', 'A16 Bionic', '6.1 inches', 'new', 79900, 74900, 25, 'Dynamic Island and 48MP camera system.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 0);
    await seed('Xiaomi 14 Pro', 'xiaomi-14-pro', xiaomi, android, 'Android', '12GB', '256GB', '50MP + 50MP + 50MP', '4880mAh', 'Snapdragon 8 Gen 3', '6.73 inches', 'new', 79999, 74999, 18, 'Leica-powered camera system with flagship performance.', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400', 1);
    await seed('Samsung Galaxy S23 FE', 'samsung-galaxy-s23-fe', samsung, android, 'Android', '8GB', '128GB', '50MP + 8MP + 12MP', '4500mAh', 'Exynos 2200', '6.4 inches', 'refurbished', 49999, 35999, 8, 'Refurbished flagship experience at a great price.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', 0);
    await seed('iPhone 14 Pro Max', 'iphone-14-pro-max', apple, ios, 'iOS', '6GB', '256GB', '48MP + 12MP + 12MP', '4323mAh', 'A16 Bionic', '6.7 inches', 'used', 129900, 89900, 5, 'Pre-owned in excellent condition.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 0);
  }

  console.log('Database initialized with seed data.');
}

const readyPromise = initDb().then(() => {}).catch(e => {
  console.error('Database init error:', e.message);
  process.exit(1);
});

module.exports = {
  queryAll: async (sql, params) => db.queryAll(sql, params),
  queryOne: async (sql, params) => db.queryOne(sql, params),
  run: async (sql, params) => db.run(sql, params),
  readyPromise,
};
