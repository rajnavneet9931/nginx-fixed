const mongoose = require('mongoose');

const stockNotificationSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    email: { type: String },
    mobile: { type: String },
    notified: { type: Boolean, default: false },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Ensure either user, email, or mobile
stockNotificationSchema.pre('validate', function (next) {
  if (!this.user && !this.email && !this.mobile) {
    next(new Error('Either user, email, or mobile is required for stock notification'));
  }
  next();
});

module.exports = mongoose.model('StockNotification', stockNotificationSchema);
