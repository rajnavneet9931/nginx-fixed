const mongoose = require('mongoose');

const bulkOrderSchema = new mongoose.Schema(
  {
    inquiryNumber: { type: String, unique: true },
    companyName: { type: String, trim: true },
    contactName: { type: String, required: [true, 'Contact name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'] },
    mobile: { type: String, required: [true, 'Mobile is required'] },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 10 },
        notes: { type: String },
      },
    ],
    totalEstimatedQty: { type: Number },
    message: { type: String },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'quoted', 'advance_paid', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    quotedPrice: { type: Number },
    advanceRequired: { type: Number },
    advancePaid: { type: Number, default: 0 },
    advancePaymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'partial', 'paid'],
      default: 'not_required',
    },
    advanceTransactionId: { type: String },
    adminNotes: { type: String },
    estimatedDelivery: { type: Date },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

bulkOrderSchema.pre('save', async function (next) {
  if (!this.inquiryNumber) {
    const count = await mongoose.model('BulkOrder').countDocuments();
    this.inquiryNumber = 'BLK' + String(count + 1).padStart(5, '0');
  }
  if (this.products && this.products.length > 0) {
    this.totalEstimatedQty = this.products.reduce((sum, p) => sum + p.quantity, 0);
  }
  next();
});

module.exports = mongoose.model('BulkOrder', bulkOrderSchema);
