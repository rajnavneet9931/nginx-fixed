const BulkOrder = require('../models/BulkOrder');

// @desc    Submit bulk order inquiry
// @route   POST /api/bulk-orders
const createBulkOrder = async (req, res, next) => {
  try {
    const { companyName, contactName, email, mobile, products, message } = req.body;

    const bulkOrder = await BulkOrder.create({
      companyName,
      contactName,
      email,
      mobile,
      products,
      message,
      user: req.user ? req.user._id : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Bulk order inquiry submitted successfully. Our team will contact you within 24 hours.',
      inquiry: bulkOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's bulk orders
// @route   GET /api/bulk-orders
const getMyBulkOrders = async (req, res, next) => {
  try {
    const bulkOrders = await BulkOrder.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, bulkOrders });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all bulk orders
// @route   GET /api/admin/bulk-orders
const getAllBulkOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};

    const bulkOrders = await BulkOrder.find(query)
      .populate('products.product', 'name price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await BulkOrder.countDocuments(query);

    res.json({ success: true, bulkOrders, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update bulk order
// @route   PUT /api/admin/bulk-orders/:id
const updateBulkOrder = async (req, res, next) => {
  try {
    const updates = req.body;
    const bulkOrder = await BulkOrder.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    if (!bulkOrder) {
      return res.status(404).json({ success: false, message: 'Bulk order not found' });
    }

    res.json({ success: true, message: 'Bulk order updated', bulkOrder });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBulkOrder, getMyBulkOrders, getAllBulkOrders, updateBulkOrder };
