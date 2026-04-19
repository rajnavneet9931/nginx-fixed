const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');
const { createBulkOrder, getMyBulkOrders } = require('../controllers/bulkOrderController');

router.post('/', optionalAuth, createBulkOrder);
router.get('/', protect, getMyBulkOrders);

module.exports = router;
