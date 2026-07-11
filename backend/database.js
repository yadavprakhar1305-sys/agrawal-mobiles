const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'agrawal.db');

let db;

async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      brand_id INTEGER,
      category_id INTEGER,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      pincode TEXT NOT NULL,
      phone TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'placed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sell_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      condition TEXT NOT NULL,
      asking_price REAL,
      description TEXT,
      images TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT CHECK(discount_type IN ('percentage','fixed')),
      discount_value REAL NOT NULL,
      min_order REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 100,
      used_count INTEGER DEFAULT 0,
      expires_at DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS payment_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method TEXT UNIQUE NOT NULL,
      enabled INTEGER DEFAULT 1,
      api_key TEXT,
      api_secret TEXT,
      merchant_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_id) REFERENCES users(id)
    )
  `);

  // Seed default admin
  const admin = db.exec('SELECT id FROM users WHERE email = "admin@agrawalmobiles.com"');
  if (admin.length === 0 || admin[0].values.length === 0) {
    const hashed = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)', ['Admin', 'admin@agrawalmobiles.com', '8460431599', hashed, 'admin']);
  }

  // Seed payment configs
  const pmts = db.exec('SELECT COUNT(*) as cnt FROM payment_config');
  if (pmts.length > 0 && pmts[0].values[0][0] === 0) {
    const insert = db.prepare('INSERT INTO payment_config (method, enabled) VALUES (?, ?)');
    db.run('INSERT INTO payment_config (method, enabled) VALUES (?, ?)', ['cod', 1]);
    db.run('INSERT INTO payment_config (method, enabled) VALUES (?, ?)', ['upi', 1]);
    db.run('INSERT INTO payment_config (method, enabled) VALUES (?, ?)', ['card', 1]);
    db.run('INSERT INTO payment_config (method, enabled) VALUES (?, ?)', ['netbanking', 0]);
  }

  // Seed brands
  const brands = db.exec('SELECT COUNT(*) as cnt FROM brands');
  if (brands.length > 0 && brands[0].values[0][0] === 0) {
    const brandNames = ['Samsung','Apple','Xiaomi','Vivo','Oppo','Realme','OnePlus','Nothing','Motorola','Google'];
    brandNames.forEach(b => db.run('INSERT INTO brands (name) VALUES (?)', [b]));
  }

  // Seed categories
  const cats = db.exec('SELECT COUNT(*) as cnt FROM categories');
  if (cats.length > 0 && cats[0].values[0][0] === 0) {
    db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['Android Phones', 'android-phones', 'All Android smartphones']);
    db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['iOS / iPhones', 'ios-iphones', 'Apple iPhone models']);
    db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['Refurbished', 'refurbished', 'Certified pre-owned phones']);
    db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['New Arrivals', 'new-arrivals', 'Latest launched phones']);
    db.run('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', ['Accessories', 'accessories', 'Phone accessories']);
  }

  // Seed sample products
  const prods = db.exec('SELECT COUNT(*) as cnt FROM products');
  if (prods.length > 0 && prods[0].values[0][0] === 0) {
    const getBrandId = (name) => {
      const r = db.exec(`SELECT id FROM brands WHERE name = '${name}'`);
      return r[0].values[0][0];
    };
    const getCatId = (slug) => {
      const r = db.exec(`SELECT id FROM categories WHERE slug = '${slug}'`);
      return r[0].values[0][0];
    };
    const samsung = getBrandId('Samsung');
    const apple = getBrandId('Apple');
    const xiaomi = getBrandId('Xiaomi');
    const android = getCatId('android-phones');
    const ios = getCatId('ios-iphones');

    const insert = (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured) => {
      db.run(`INSERT INTO products (name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, images, featured)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, slug, brand_id, category_id, os, ram, storage, camera, battery, processor, screen_size, condition, price, discount_price, stock, description, JSON.stringify([images]), featured]);
    };

    insert('Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', samsung, android, 'Android', '12GB', '256GB', '200MP + 50MP + 12MP + 10MP', '5000mAh', 'Snapdragon 8 Gen 3', '6.8 inches', 'new', 129999, 119999, 15, 'The ultimate Galaxy experience with AI features and S Pen.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', 1);
    insert('Samsung Galaxy S24', 'samsung-galaxy-s24', samsung, android, 'Android', '8GB', '256GB', '50MP + 12MP + 10MP', '4000mAh', 'Exynos 2400', '6.2 inches', 'new', 79999, 74999, 20, 'Compact flagship with powerful AI capabilities.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', 0);
    insert('iPhone 15 Pro Max', 'iphone-15-pro-max', apple, ios, 'iOS', '8GB', '256GB', '48MP + 12MP + 12MP', '4422mAh', 'A17 Pro', '6.7 inches', 'new', 159900, 149900, 10, 'Apple\'s most powerful iPhone with titanium design.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 1);
    insert('iPhone 15', 'iphone-15', apple, ios, 'iOS', '6GB', '128GB', '48MP + 12MP', '3349mAh', 'A16 Bionic', '6.1 inches', 'new', 79900, 74900, 25, 'Dynamic Island and 48MP camera system.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 0);
    insert('Xiaomi 14 Pro', 'xiaomi-14-pro', xiaomi, android, 'Android', '12GB', '256GB', '50MP + 50MP + 50MP', '4880mAh', 'Snapdragon 8 Gen 3', '6.73 inches', 'new', 79999, 74999, 18, 'Leica-powered camera system with flagship performance.', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400', 1);
    insert('Samsung Galaxy S23 FE', 'samsung-galaxy-s23-fe', samsung, android, 'Android', '8GB', '128GB', '50MP + 8MP + 12MP', '4500mAh', 'Exynos 2200', '6.4 inches', 'refurbished', 49999, 35999, 8, 'Refurbished flagship experience at a great price.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', 0);
    insert('iPhone 14 Pro Max', 'iphone-14-pro-max', apple, ios, 'iOS', '6GB', '256GB', '48MP + 12MP + 12MP', '4323mAh', 'A16 Bionic', '6.7 inches', 'used', 129900, 89900, 5, 'Pre-owned in excellent condition.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', 0);
  }

  saveDb();
  console.log('Database initialized with seed data.');
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper to convert sql.js results to array of objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    rows.push(row);
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified(), lastInsertRowid: queryOne('SELECT last_insert_rowid() as id')?.id };
}

// Initialize
let ready = false;
const readyPromise = initDb().then(() => { ready = true; });

module.exports = { queryAll, queryOne, run, readyPromise, getDb: () => db };
