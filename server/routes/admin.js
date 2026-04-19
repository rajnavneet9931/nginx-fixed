const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { getDashboardStats, getAllUsers, toggleUserStatus, getInventory } = require('../controllers/adminController');
const { getAllOrders, updateOrderStatus } = require('../controllers/orderController');
const { getAllBulkOrders, updateBulkOrder } = require('../controllers/bulkOrderController');
const { getStockNotifications } = require('../controllers/notificationController');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Inventory
router.get('/inventory', getInventory);

// Bulk orders
router.get('/bulk-orders', getAllBulkOrders);
router.put('/bulk-orders/:id', updateBulkOrder);

// Notifications
router.get('/notifications/stock', getStockNotifications);

module.exports = router;
