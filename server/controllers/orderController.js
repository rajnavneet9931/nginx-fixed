const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// @desc    Place order
// @route   POST /api/orders
const placeOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, items, notes } = req.body;

    let orderItems = [];
    let subtotal = 0;

    if (items && items.length > 0) {
      // Order from provided items (buy now)
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product || !product.isActive) {
          return res.status(400).json({ success: false, message: `Product not available: ${item.productId}` });
        }
        if (product.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
        }
        const price = product.discountPrice || product.price;
        orderItems.push({ product: product._id, name: product.name, image: product.images[0], price, quantity: item.quantity });
        subtotal += price * item.quantity;
      }
    } else {
      // Order from cart
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart is empty' });
      }

      for (const item of cart.items) {
        if (!item.product || !item.product.isActive) continue;
        if (item.product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}`,
          });
        }
        orderItems.push({
          product: item.product._id,
          name: item.product.name,
          image: item.product.images[0],
          price: item.price,
          quantity: item.quantity,
        });
        subtotal += item.price * item.quantity;
      }
    }

    const shippingCost = subtotal >= 499 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const totalAmount = subtotal + shippingCost + tax;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      notes,
      statusHistory: [{ status: 'placed', note: 'Order placed successfully' }],
    });

    // Decrement stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, totalSold: item.quantity },
      });
    }

    // Clear cart if ordered from cart
    if (!items || items.length === 0) {
      await Cart.findOneAndDelete({ user: req.user._id });
    }

    // Send confirmation email
    if (req.user.email) {
      const tmpl = emailTemplates.orderConfirmation(order);
      sendEmail({ to: req.user.email, ...tmpl }).catch(console.error);
    }

    res.status(201).json({ success: true, message: 'Order placed successfully', order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };
    if (status) query.orderStatus = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({ success: true, orders, total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const cancellableStatuses = ['placed', 'confirmed'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.orderStatus}`,
      });
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason;
    order.statusHistory.push({ status: 'cancelled', note: `Cancelled by user: ${reason}` });
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, totalSold: -item.quantity },
      });
    }

    res.json({ success: true, message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};

// ========== ADMIN ==========

// @desc    Admin: Get all orders
// @route   GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentStatus } = req.query;
    const query = {};
    if (status) query.orderStatus = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({ success: true, orders, total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update order status
// @route   PUT /api/admin/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note, trackingNumber, estimatedDelivery } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
    order.statusHistory.push({ status, note: note || `Status updated to ${status}` });

    if (status === 'delivered') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

module.exports = { placeOrder, getMyOrders, getOrder, cancelOrder, getAllOrders, updateOrderStatus };
