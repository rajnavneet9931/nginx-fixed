const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: [true, 'Description is required'] },
    shortDescription: { type: String },
    ingredients: { type: String },
    benefits: [{ type: String }],
    howToUse: { type: String },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['serum', 'face-wash', 'moisturizer', 'toner', 'sunscreen', 'mask', 'eye-care', 'body-care', 'lip-care', 'other'],
    },
    skinType: [{ type: String, enum: ['all', 'oily', 'dry', 'combination', 'sensitive', 'normal'] }],
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    discountPrice: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    images: [{ type: String }],
    stock: { type: Number, required: true, default: 0, min: 0 },
    minOrderQty: { type: Number, default: 1 },
    maxOrderQty: { type: Number, default: 10 },
    weight: { type: String },
    volume: { type: String },
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    reviews: [reviewSchema],
    numReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate slug
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();
  }
  // Calculate discount percent
  if (this.discountPrice && this.price > 0) {
    this.discountPercent = Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  // Calculate average rating
  if (this.reviews.length > 0) {
    this.averageRating = this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
    this.numReviews = this.reviews.length;
  }
  next();
});

// Virtual for effective price
productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice || this.price;
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
