const StockNotification = require('../models/StockNotification');
const Product = require('../models/Product');

// @desc    Subscribe to stock notification
// @route   POST /api/notifications/stock/:productId
const subscribeStockNotification = async (req, res, next) => {
  try {
    const { email, mobile } = req.body;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock > 0) {
      return res.status(400).json({ success: false, message: 'Product is currently in stock!' });
    }

    const query = { product: productId, notified: false };
    if (req.user) query.user = req.user._id;
    else if (email) query.email = email;
    else if (mobile) query.mobile = mobile;

    const existing = await StockNotification.findOne(query);
    if (existing) {
      return res.json({ success: true, message: 'You are already subscribed to this notification' });
    }

    await StockNotification.create({
      product: productId,
      user: req.user ? req.user._id : undefined,
      email,
      mobile,
    });

    res.status(201).json({ success: true, message: 'You will be notified when this product is back in stock!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all stock notifications
// @route   GET /api/admin/notifications/stock
const getStockNotifications = async (req, res, next) => {
  try {
    const { notified = 'false', page = 1, limit = 20 } = req.query;
    const query = { notified: notified === 'true' };

    const notifications = await StockNotification.find(query)
      .populate('product', 'name stock')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await StockNotification.countDocuments(query);

    res.json({ success: true, notifications, total });
  } catch (error) {
    next(error);
  }
};

module.exports = { subscribeStockNotification, getStockNotifications };
