const express = require('express');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const { getCatalog, getProductById,getCart, addToCart, removeFromCart, checkout, updateCartItem, getLastRedeemedPurchases, getTotalRedeemedPoints } = require('../controllers/shopController');
const router = express.Router();

router.get('/catalog', getCatalog);
router.get('/catalog/:id', getProductById);

router.get('/cart', getCart);
router.post('/cart', addToCart);
router.delete('/cart/:productId', removeFromCart);
router.put('/cart/:productId', updateCartItem);

router.post('/checkout', checkout);

// Obtener últimas compras canjeadas (default 5)
router.get('/redeemed-purchases', getLastRedeemedPurchases);

// Obtener resumen total canjeado
router.get('/redeemed-summary', getTotalRedeemedPoints);


module.exports = router;