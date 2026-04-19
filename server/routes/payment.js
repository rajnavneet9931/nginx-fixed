const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPaymentOrder, verifyPayment, confirmCOD, initiateUPI, confirmUPI, expireUPI, cancelUPI, getPayment } = require('../controllers/paymentController');

router.use(protect);

router.post('/create-order', createPaymentOrder);
router.post('/verify', verifyPayment);
router.post('/cod', confirmCOD);
router.post('/upi', initiateUPI);
router.post('/upi/confirm', confirmUPI);
router.post('/upi/expire', expireUPI);
router.post('/upi/cancel', cancelUPI);
router.get('/:orderId', getPayment);

module.exports = router;
