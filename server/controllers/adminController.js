const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const BulkOrder = require('../models/BulkOrder');
const StockNotification = require('../models/StockNotification');

// @desc    Admin dashboard stats
// @route   GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalBulkOrders,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      pendingNotifications,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      BulkOrder.countDocuments(),
      Order.countDocuments({ orderStatus: 'placed' }),
      Product.countDocuments({ stock: { $lte: 10, $gt: 0 }, isActive: true }),
      Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
      StockNotification.countDocuments({ notified: false }),
    ]);

    // Revenue calculation
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Monthly revenue
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;

    // Top selling products
    const topProducts = await Product.find({ isActive: true })
      .sort({ totalSold: -1 })
      .limit(5)
      .select('name totalSold averageRating stock');

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalBulkOrders,
        pendingOrders,
        lowStockProducts,
        pendingNotifications,
        totalRevenue,
        monthlyRevenue,
      },
      recentOrders,
      topProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all users
// @route   GET /api/admin/users
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ success: true, users, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate admin users' });
    }
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get inventory status
// @route   GET /api/admin/inventory
const getInventory = async (req, res, next) => {
  try {
    const { filter } = req.query; // 'low', 'out', 'all'
    let query = { isActive: true };
    if (filter === 'low') query.stock = { $gt: 0, $lte: 10 };
    if (filter === 'out') query.stock = 0;

    const products = await Product.find(query).select('name category stock price discountPrice images').sort({ stock: 1 });

    res.json({ success: true, products, count: products.length });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getAllUsers, toggleUserStatus, getInventory };
