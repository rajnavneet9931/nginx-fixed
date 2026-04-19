const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

// @desc    Initiate Razorpay order (mock)
// @route   POST /api/payment/create-order
const createPaymentOrder = async (req, res, next) => {
  try {
    const { orderId, amount } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Mock Razorpay order creation
    const mockRazorpayOrderId = 'order_' + crypto.randomBytes(10).toString('hex');

    const payment = await Payment.create({
      order: orderId,
      user: req.user._id,
      method: order.paymentMethod,
      amount: order.totalAmount,
      status: 'initiated',
      razorpayOrderId: mockRazorpayOrderId,
    });

    res.json({
      success: true,
      paymentOrder: {
        id: mockRazorpayOrderId,
        amount: order.totalAmount * 100,
        currency: 'INR',
        paymentId: payment._id,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    // Mock: accept any signature in dev
    const isValid = true;

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId, order: orderId },
      {
        razorpayPaymentId,
        razorpaySignature,
        status: 'success',
        paidAt: new Date(),
      },
      { new: true }
    );

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      $push: { statusHistory: { status: 'confirmed', note: 'Payment received' } },
      orderStatus: 'confirmed',
    });

    res.json({ success: true, message: 'Payment verified successfully', payment });
  } catch (error) {
    next(error);
  }
};

// @desc    COD payment confirmation
// @route   POST /api/payment/cod
const confirmCOD = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const payment = await Payment.create({
      order: orderId,
      user: req.user._id,
      method: 'cod',
      amount: order.totalAmount,
      status: 'pending',
      transactionId: 'COD-' + orderId,
    });

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'pending',
      orderStatus: 'confirmed',
      $push: { statusHistory: { status: 'confirmed', note: 'COD order confirmed' } },
    });

    res.json({ success: true, message: 'COD order confirmed', payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate UPI payment session (Google Pay / PhonePe)
// @route   POST /api/payment/upi
const initiateUPI = async (req, res, next) => {
  try {
    const { orderId, upiMethod } = req.body; // 'googlepay' | 'phonepe'

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const upiId = 'happigums@paytm';
    const merchantName = 'BareSober by Happi Gums';
    const amount = order.totalAmount;
    const orderNumber = order.orderNumber;
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=Order${orderNumber}`;

    const payment = await Payment.create({
      order: orderId,
      user: req.user._id,
      method: upiMethod,
      amount,
      status: 'initiated',
      transactionId: 'UPI-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex'),
      qrImage: '/img/qr.png', // Hardcoded manual QR path
    });

    // Session expires in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    res.json({
      success: true,
      paymentSession: {
        paymentId: payment._id,
        orderId: order._id,
        orderNumber,
        method: upiMethod,
        methodName: upiMethod === 'googlepay' ? 'Google Pay' : 'PhonePe',
        amount,
        currency: 'INR',
        merchantName,
        upiId,
        upiLink,
        expiresAt,
        qrImage: '/img/qr.png',
        qrData: upiLink, // Fallback data
      },
      message: `${upiMethod === 'googlepay' ? 'Google Pay' : 'PhonePe'} payment session created`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm UPI payment (user clicks "I Have Paid")
// @route   POST /api/payment/upi/confirm
const confirmUPI = async (req, res, next) => {
  try {
    const { paymentId, utr } = req.body;

    if (!utr || !/^\d{12}$/.test(utr.trim())) {
      return res.status(400).json({ success: false, message: 'Valid 12-digit UTR / Transaction Reference is required' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment session not found' });
    }

    if (payment.status === 'expired') {
      return res.status(400).json({ success: false, message: 'Payment session has expired. Please try again.' });
    }

    if (payment.status === 'success') {
      return res.status(400).json({ success: false, message: 'Payment already confirmed.' });
    }

    payment.upiTransactionRef = utr.trim();
    payment.status = 'success';
    payment.paidAt = new Date();
    await payment.save();

    await Order.findByIdAndUpdate(payment.order, {
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      $push: { statusHistory: { status: 'confirmed', note: `UPI payment verified manually (UTR: ${utr.trim()})` } },
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment,
      utr: utr.trim(),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Expire a UPI payment session
// @route   POST /api/payment/upi/expire
const expireUPI = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Only expire if still initiated
    if (payment.status === 'initiated') {
      payment.status = 'expired';
      payment.failureReason = 'Payment session timed out';
      await payment.save();

      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        $push: { statusHistory: { status: 'cancelled', note: 'Payment session expired' } },
      });
    }

    res.json({ success: true, message: 'Payment session expired' });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a UPI payment session
// @route   POST /api/payment/upi/cancel
const cancelUPI = async (req, res, next) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status === 'initiated') {
      payment.status = 'failed';
      payment.failureReason = 'Cancelled by user';
      await payment.save();

      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: 'failed',
        orderStatus: 'cancelled',
        $push: { statusHistory: { status: 'cancelled', note: 'Payment cancelled by user' } },
      });
    }

    res.json({ success: true, message: 'Payment cancelled' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment details for order
// @route   GET /api/payment/:orderId
const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId, user: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

module.exports = { createPaymentOrder, verifyPayment, confirmCOD, initiateUPI, confirmUPI, expireUPI, cancelUPI, getPayment };
