/**
 * BareSober — Centralized API Client
 */

const API_BASE = '/api';

const request = async (method, endpoint, data = null, isFormData = false) => {
  const token = localStorage.getItem('bs_token');
  const headers = {};

  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (data) options.body = isFormData ? data : JSON.stringify(data);

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'Something went wrong');
  }

  return json;
};

const api = {
  get:    (url)          => request('GET', url),
  post:   (url, data)    => request('POST', url, data),
  put:    (url, data)    => request('PUT', url, data),
  delete: (url)          => request('DELETE', url),
  upload: (url, formData) => request('POST', url, formData, true),
  uploadPut: (url, formData) => request('PUT', url, formData, true),
};

// ─── Auth ───
const Auth = {
  signup:         (data) => api.post('/auth/signup', data),
  login:          (data) => api.post('/auth/login', data),
  sendOTP:        (data) => api.post('/auth/send-otp', data),
  verifyOTP:      (data) => api.post('/auth/verify-otp', data),
  getMe:          ()     => api.get('/auth/me'),
  updateProfile:  (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ─── Products ───
const Products = {
  getAll:        (params = '') => api.get(`/products?${params}`),
  getOne:        (id)          => api.get(`/products/${id}`),
  getFeatured:   ()            => api.get('/products/featured'),
  getBestSellers:()            => api.get('/products/bestsellers'),
  addReview:     (id, data)    => api.post(`/products/${id}/reviews`, data),
  create:        (formData)    => api.upload('/products', formData),
  update:        (id, formData) => api.uploadPut(`/products/${id}`, formData),
  delete:        (id)          => api.delete(`/products/${id}`),
};

// ─── Cart ───
const Cart = {
  get:    ()                      => api.get('/cart'),
  add:    (data)                  => api.post('/cart', data),
  update: (productId, data)       => api.put(`/cart/${productId}`, data),
  remove: (productId)             => api.delete(`/cart/${productId}`),
  clear:  ()                      => api.delete('/cart'),
};

// ─── Wishlist ───
const Wishlist = {
  get:    ()          => api.get('/wishlist'),
  toggle: (productId) => api.post(`/wishlist/${productId}`),
  check:  (productId) => api.get(`/wishlist/check/${productId}`),
};

// ─── Orders ───
const Orders = {
  place:     (data) => api.post('/orders', data),
  getAll:    (params = '') => api.get(`/orders?${params}`),
  getOne:    (id)   => api.get(`/orders/${id}`),
  cancel:    (id, data) => api.put(`/orders/${id}/cancel`, data),
};

// ─── Payment ───
const Payment = {
  createOrder:  (data) => api.post('/payment/create-order', data),
  verify:       (data) => api.post('/payment/verify', data),
  cod:          (data) => api.post('/payment/cod', data),
  initiateUPI:  (data) => api.post('/payment/upi', data),
  confirmUPI:   (data) => api.post('/payment/upi/confirm', data),
  expireUPI:    (data) => api.post('/payment/upi/expire', data),
  cancelUPI:    (data) => api.post('/payment/upi/cancel', data),
  getByOrder:   (orderId) => api.get(`/payment/${orderId}`),
};

// ─── Bulk Orders ───
const BulkOrders = {
  create: (data) => api.post('/bulk-orders', data),
  getAll: ()     => api.get('/bulk-orders'),
};

// ─── Notifications ───
const Notifications = {
  stockSubscribe: (productId, data) => api.post(`/notifications/stock/${productId}`, data),
};

// ─── Admin ───
const Admin = {
  dashboard:        ()         => api.get('/admin/dashboard'),
  getUsers:         (params='')=> api.get(`/admin/users?${params}`),
  toggleUser:       (id)       => api.put(`/admin/users/${id}/toggle`),
  getOrders:        (params='')=> api.get(`/admin/orders?${params}`),
  updateOrderStatus:(id, data) => api.put(`/admin/orders/${id}/status`, data),
  getInventory:     (params='')=> api.get(`/admin/inventory?${params}`),
  getBulkOrders:    (params='')=> api.get(`/admin/bulk-orders?${params}`),
  updateBulkOrder:  (id, data) => api.put(`/admin/bulk-orders/${id}`, data),
  getStockNotifs:   (params='')=> api.get(`/admin/notifications/stock?${params}`),
};

window.API = { Auth, Products, Cart, Wishlist, Orders, Payment, BulkOrders, Notifications, Admin };
