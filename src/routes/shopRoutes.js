const express = require('express');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const { getCatalog, getProductById,getCart, addToCart, removeFromCart, checkout, updateCartItem } = require('../controllers/shopController');
const router = express.Router();

router.get('/catalog', getCatalog);
router.get('/catalog/:id', getProductById);

router.get('/cart', getCart);
router.post('/cart', addToCart);
router.delete('/cart/:productId', removeFromCart);
router.put('/cart/:productId', updateCartItem);

router.post('/checkout', checkout);

module.exports = router;