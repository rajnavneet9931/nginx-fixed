const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getWishlist, toggleWishlist, checkWishlist } = require('../controllers/wishlistController');

router.use(protect);

router.get('/', getWishlist);
router.get('/check/:productId', checkWishlist);
router.post('/:productId', toggleWishlist);

module.exports = router;
