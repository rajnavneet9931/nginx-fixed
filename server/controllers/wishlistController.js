const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

// @desc    Get wishlist
// @route   GET /api/wishlist
const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate('products', 'name images price discountPrice averageRating stock isActive');

    if (!wishlist) {
      return res.json({ success: true, wishlist: { products: [] } });
    }

    // Filter out inactive products
    wishlist.products = wishlist.products.filter(p => p && p.isActive);

    res.json({ success: true, wishlist });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle product in wishlist
// @route   POST /api/wishlist/:productId
const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [productId] });
      return res.json({ success: true, message: 'Added to wishlist', inWishlist: true, wishlist });
    }

    const index = wishlist.products.findIndex(p => p.toString() === productId);

    if (index > -1) {
      wishlist.products.splice(index, 1);
      await wishlist.save();
      return res.json({ success: true, message: 'Removed from wishlist', inWishlist: false, wishlist });
    } else {
      wishlist.products.push(productId);
      await wishlist.save();
      return res.json({ success: true, message: 'Added to wishlist', inWishlist: true, wishlist });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
const checkWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const inWishlist = wishlist ? wishlist.products.some(p => p.toString() === req.params.productId) : false;
    res.json({ success: true, inWishlist });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWishlist, toggleWishlist, checkWishlist };
