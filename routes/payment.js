const express = require('express');
const { completePurchase , verifyPayment , createOrder , webhook } = require('../controllers/razorpay'); 
const { isAuthenticated } = require('../middleware/middleware');

const router = express.Router();

router.post('/complete', completePurchase); 
router.post('/verify', verifyPayment);  
router.post('/order', createOrder );
router.post('/webhook' , webhook )

module.exports = router;
