const Product = require('../models/Product');
const StockNotification = require('../models/StockNotification');

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = 'desc',
      search,
      skinType,
      featured,
      bestSeller,
      inStock,
    } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;
    if (skinType) query.skinType = { $in: skinType.split(',') };
    if (featured === 'true') query.isFeatured = true;
    if (bestSeller === 'true') query.isBestSeller = true;
    if (inStock === 'true') query.stock = { $gt: 0 };

    if (minPrice || maxPrice) {
      query.$or = [
        { discountPrice: { $gte: minPrice || 0, $lte: maxPrice || Infinity } },
        { price: { $gte: minPrice || 0, $lte: maxPrice || Infinity } },
      ];
    }

    if (search) {
      query.$text = { $search: search };
    }

    const sortObj = {};
    if (sortBy === 'price') {
      sortObj['discountPrice'] = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'rating') {
      sortObj['averageRating'] = order === 'asc' ? 1 : -1;
    } else if (sortBy === 'popular') {
      sortObj['totalSold'] = -1;
    } else {
      sortObj[sortBy] = order === 'asc' ? 1 : -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-reviews');

    res.json({
      success: true,
      count: products.length,
      total: totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      currentPage: parseInt(page),
      products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      $and: [
        { isActive: true },
        {
          $or: [
            { _id: req.params.id.match(/^[a-fA-F0-9]{24}$/) ? req.params.id : null },
            { slug: req.params.id },
          ],
        },
      ],
    }).populate('reviews.user', 'name avatar');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Increment view count (non-blocking)
    Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } }).exec();

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product review
// @route   POST /api/products/:id/reviews
const addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    product.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
    await product.save();

    res.status(201).json({ success: true, message: 'Review added' });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create product
// @route   POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    // Handle uploaded images
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map((f) => `/uploads/${f.filename}`);
    }

    // Parse arrays/objects if sent as strings (multipart/form-data)
    if (typeof productData.benefits === 'string') {
      productData.benefits = productData.benefits.split(',').map((b) => b.trim());
    }
    if (typeof productData.skinType === 'string') {
      productData.skinType = productData.skinType.split(',').map((s) => s.trim());
    }
    if (typeof productData.tags === 'string') {
      productData.tags = productData.tags.split(',').map((t) => t.trim());
    }

    const product = await Product.create(productData);

    res.status(201).json({ success: true, message: 'Product created', product });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update product
// @route   PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (req.files && req.files.length > 0) {
      updates.images = req.files.map((f) => `/uploads/${f.filename}`);
    }

    if (typeof updates.benefits === 'string') {
      updates.benefits = updates.benefits.split(',').map((b) => b.trim());
    }
    if (typeof updates.skinType === 'string') {
      updates.skinType = updates.skinType.split(',').map((s) => s.trim());
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // If stock was updated to > 0, notify subscribers
    if (updates.stock && parseInt(updates.stock) > 0) {
      notifyStockSubscribers(product).catch(console.error);
    }

    res.json({ success: true, message: 'Product updated', product });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete product (soft delete)
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
};

// Helper: Notify stock subscribers
const notifyStockSubscribers = async (product) => {
  const { sendEmail, emailTemplates } = require('../utils/sendEmail');
  const notifications = await StockNotification.find({ product: product._id, notified: false });

  for (const notif of notifications) {
    if (notif.email) {
      const tmpl = emailTemplates.stockNotification(product, notif.email);
      await sendEmail({ to: notif.email, ...tmpl });
    }
    notif.notified = true;
    notif.notifiedAt = new Date();
    await notif.save();
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
const getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true, stock: { $gt: 0 } })
      .select('-reviews')
      .limit(8);
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// @desc    Get best sellers
// @route   GET /api/products/bestsellers
const getBestSellers = async (req, res, next) => {
  try {
    const products = await Product.find({ isBestSeller: true, isActive: true })
      .select('-reviews')
      .sort({ totalSold: -1 })
      .limit(8);
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProduct,
  addReview,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getBestSellers,
};
