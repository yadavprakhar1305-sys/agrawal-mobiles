const API = window.REACT_APP_API_URL || '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
  },
  products: {
    list: (params) => request('/products?' + new URLSearchParams(params)),
    featured: () => request('/products/featured'),
    get: (id) => request(`/products/${id}`),
    create: (body) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  },
  categories: {
    list: () => request('/categories'),
    create: (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  },
  brands: {
    list: () => request('/brands'),
    create: (body) => request('/brands', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/brands/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/brands/${id}`, { method: 'DELETE' }),
  },
  cart: {
    get: () => request('/cart'),
    add: (body) => request('/cart', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/cart/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    remove: (id) => request(`/cart/${id}`, { method: 'DELETE' }),
    clear: () => request('/cart', { method: 'DELETE' }),
  },
  wishlist: {
    get: () => request('/wishlist'),
    add: (body) => request('/wishlist', { method: 'POST', body: JSON.stringify(body) }),
    remove: (id) => request(`/wishlist/${id}`, { method: 'DELETE' }),
  },
  orders: {
    create: (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) }),
    list: () => request('/orders'),
    get: (id) => request(`/orders/${id}`),
  },
  sell: {
    submit: (body) => request('/sell', { method: 'POST', body: JSON.stringify(body) }),
    list: () => request('/sell'),
  },
  reviews: {
    create: (body) => request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
    byProduct: (id) => request(`/reviews/product/${id}`),
  },
  paymentConfig: {
    list: () => request('/payment-config'),
    update: (method, body) => request(`/payment-config/${method}`, { method: 'PUT', body: JSON.stringify(body) }),
  },
  coupons: {
    list: () => request('/coupons'),
    validate: (body) => request('/coupons/validate', { method: 'POST', body: JSON.stringify(body) }),
    create: (body) => request('/coupons', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => request(`/coupons/${id}`, { method: 'DELETE' }),
  },
  admin: {
    dashboard: () => request('/admin/dashboard'),
    orders: (params) => request('/admin/orders?' + new URLSearchParams(params)),
    updateOrder: (id, body) => request(`/admin/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
    users: () => request('/admin/users'),
    updateUserStatus: (id, body) => request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
    products: () => request('/admin/products'),
    sellRequests: () => request('/admin/sell-requests'),
    updateSellRequest: (id, body) => request(`/admin/sell-requests/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    logs: () => request('/admin/logs'),
  },
};
