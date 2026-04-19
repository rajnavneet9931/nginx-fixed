const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { subscribeStockNotification } = require('../controllers/notificationController');

router.post('/stock/:productId', optionalAuth, subscribeStockNotification);

module.exports = router;
