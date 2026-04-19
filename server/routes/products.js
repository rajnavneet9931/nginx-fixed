const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const upload = require('../config/multer');
const {
  getProducts, getProduct, addReview, createProduct, updateProduct, deleteProduct,
  getFeaturedProducts, getBestSellers,
} = require('../controllers/productController');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/bestsellers', getBestSellers);
router.get('/:id', getProduct);

// User routes
router.post('/:id/reviews', protect, addReview);

// Admin routes
router.post('/', protect, adminOnly, upload.array('images', 5), createProduct);
router.put('/:id', protect, adminOnly, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
