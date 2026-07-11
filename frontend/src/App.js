import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import Home from './pages/customer/Home';
import Products from './pages/customer/Products';
import ProductDetail from './pages/customer/ProductDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import Orders from './pages/customer/Orders';
import SellPhone from './pages/customer/SellPhone';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import Wishlist from './pages/customer/Wishlist';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminCategories from './pages/admin/Categories';
import AdminPayments from './pages/admin/Payments';
import AdminSellRequests from './pages/admin/SellRequests';
import AdminCoupons from './pages/admin/Coupons';

const styles = {
  header: { background: '#1e40af', color: '#fff', padding: '12px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' },
  headerInner: { maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: -0.5 },
  nav: { display: 'flex', gap: 20, alignItems: 'center', fontSize: 14 },
  navLink: { color: '#fff', opacity: 0.9, transition: '0.2s' },
  badge: { background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700, marginLeft: 4 },
  btnSm: { background: '#fff', color: '#1e40af', border: 'none', padding: '6px 14px', borderRadius: 6, fontWeight: 600, fontSize: 13 },
  footer: { background: '#1f2937', color: '#9ca3af', padding: '32px 0', marginTop: 60, fontSize: 14 },
};

function NavBar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <div style={styles.header}>
      <div style={styles.headerInner}>
        <Link to="/" style={{ ...styles.logo, color: '#fff', textDecoration: 'none' }}>Agrawal Mobiles</Link>
        <div style={styles.nav}>
          <Link to="/products" style={styles.navLink}>Products</Link>
          <Link to="/sell" style={styles.navLink}>Sell Your Phone</Link>
          {user ? (
            <>
              <Link to="/cart" style={styles.navLink}>Cart{count > 0 && <span style={styles.badge}>{count}</span>}</Link>
              <Link to="/wishlist" style={styles.navLink}>Wishlist</Link>
              <Link to="/orders" style={styles.navLink}>Orders</Link>
              {user.role === 'admin' && <Link to="/admin" style={{ ...styles.navLink, fontWeight: 700 }}>Admin</Link>}
              <span style={{ opacity: 0.7, fontSize: 13 }}>{user.name}</span>
              <button onClick={() => { logout(); navigate('/'); }} style={styles.btnSm}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.btnSm}>Login</Link>
              <Link to="/register" style={{ ...styles.btnSm, background: '#22c55e', color: '#fff' }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div style={styles.footer}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ maxWidth: 300 }}>
          <h4 style={{ color: '#fff', marginBottom: 8 }}>Agrawal Mobiles</h4>
          <p style={{ lineHeight: 1.6, marginBottom: 8 }}>Buy & Sell New and Used Mobile Phones. Your trusted phone store since 2010.</p>
          <p style={{ lineHeight: 1.6 }}>
            Shop No. 7, Agrawal Market, Near Bus Stand,<br />
            Main Road, City Center, India - 302001<br />
            <strong style={{ color: '#fff' }}>Call: 8460431599</strong><br />
            Email: info@agrawalmobiles.com
          </p>
        </div>
        <div>
          <h4 style={{ color: '#fff', marginBottom: 8 }}>Quick Links</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link to="/products" style={{ color: '#9ca3af' }}>All Products</Link>
            <Link to="/sell" style={{ color: '#9ca3af' }}>Sell Your Phone</Link>
            <Link to="/cart" style={{ color: '#9ca3af' }}>Cart</Link>
            <Link to="/orders" style={{ color: '#9ca3af' }}>My Orders</Link>
          </div>
        </div>
        <div>
          <h4 style={{ color: '#fff', marginBottom: 8 }}>Categories</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Link to="/products?os=Android" style={{ color: '#9ca3af' }}>Android Phones</Link>
            <Link to="/products?os=iOS" style={{ color: '#9ca3af' }}>iOS / iPhones</Link>
            <Link to="/products?condition=refurbished" style={{ color: '#9ca3af' }}>Refurbished</Link>
            <Link to="/products?condition=new" style={{ color: '#9ca3af' }}>New Arrivals</Link>
          </div>
        </div>
        <div>
          <h4 style={{ color: '#fff', marginBottom: 8 }}>Business Hours</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 13 }}>
            <span>Mon - Sat: 10:00 AM - 8:00 PM</span>
            <span>Sunday: 11:00 AM - 5:00 PM</span>
            <span style={{ marginTop: 8, color: '#22c55e' }}>Same-day delivery available!</span>
          </div>
        </div>
      </div>
      <div className="container" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #374151', textAlign: 'center' }}>
        &copy; 2024 Agrawal Mobiles. All rights reserved. | Designed with care for our customers.
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<Orders />} />
            <Route path="/sell" element={<SellPhone />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
            <Route path="/admin/sell-requests" element={<AdminSellRequests />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
