const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    method: {
      type: String,
      required: true,
      enum: ['cod', 'razorpay', 'googlepay', 'phonepe'],
    },
    status: {
      type: String,
      enum: ['pending', 'initiated', 'success', 'failed', 'refunded', 'expired'],
      default: 'pending',
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    transactionId: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    upiTransactionRef: { type: String },
    qrImage: { type: String },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    refundId: { type: String },
    refundAmount: { type: Number },
    refundStatus: { type: String },
    paidAt: { type: Date },
    failureReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
