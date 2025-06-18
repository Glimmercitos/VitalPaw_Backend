const Product = require('../models/Product');
const User = require('../models/User');
const admin = require('../config/firebaseAdmin');

const getCatalog = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los productos' });
  }
};

const getCart = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });
    
    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;
    
    const user = await User.findOne({ firebaseUid }).populate('cart.productId');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json({
      vitalCoins: user.vitalCoins,
      cart: user.cart.map(item => ({
        _id: item._id,
        productId: item.productId._id,
        name: item.productId.name,
        image: item.productId.image,
        priceInVitalCoins: item.productId.priceInVitalCoins,
        quantity: item.quantity,
        subtotal: item.quantity * item.productId.priceInVitalCoins
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el carrito' });
  }
};

const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });
    
    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const index = user.cart.findIndex(item => item.productId.toString() === productId);

    if (index !== -1) {
      user.cart[index].quantity += quantity;
    } else {
      user.cart.push({ productId, quantity });
    }

    await user.save();
    res.status(200).json({ message: 'Producto agregado al carrito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar producto al carrito' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });
    
    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.cart = user.cart.filter(item => item.productId.toString() !== req.params.productId);
    await user.save();

    res.status(200).json({ message: 'Producto eliminado del carrito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el producto del carrito' });
  }
};

const checkout = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });
    
    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    const user = await User.findOne({ firebaseUid }).populate('cart.productId');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const total = user.cart.reduce((sum, item) =>
      sum + item.quantity * item.productId.priceInVitalCoins, 0
    );

    if (user.vitalCoins < total) {
      return res.status(400).json({ message: 'No tienes suficientes VitalCoins' });
    }

    user.vitalCoins -= total;
    user.cart = [];
    await user.save();

    res.status(200).json({
      message: 'Compra exitosa',
      totalGastado: total,
      vitalCoinsRestantes: user.vitalCoins
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar la compra' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    const { quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ message: 'Cantidad inválida' });

    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const index = user.cart.findIndex(item => item.productId.toString() === req.params.productId);
    if (index === -1) return res.status(404).json({ message: 'Producto no encontrado en el carrito' });

    user.cart[index].quantity = quantity;
    await user.save();

    res.status(200).json({ message: 'Cantidad actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la cantidad del producto' });
  }
};


module.exports = {
  getCatalog,
  getCart,
  addToCart,
  removeFromCart,
  checkout,
  updateCartItem
};
