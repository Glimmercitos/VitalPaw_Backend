const Product = require('../models/Product');
const User = require('../models/User');
const RedeemedPurchase = require('../models/redeemPurchase');
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
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el producto' });
  }
};

// Supongamos que el esquema User tiene cart: [{ productId: ObjectId, quantity: Number }]
const getCart = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });
    
    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    // Buscar usuario y popular los productos dentro del carrito
    const user = await User.findOne({ firebaseUid }).populate('cart.productId');

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Mapear carrito con datos completos de producto
    const cart = user.cart.map(item => ({
      _id: item._id,
      product: item.productId,  // ya populated
      quantity: item.quantity,
      subtotal: item.quantity * item.productId.priceInVitalCoins
    }));

    res.json({ vitalCoins: user.vitalCoins, cart });
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

      // Crear registro individual de compra
    const purchase = new RedeemedPurchase({
      userId: user._id,
      points: total
    });
    await purchase.save();

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

const getLastRedeemedPurchases = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Obtener últimas compras con usuario poblado (nombre)
    const purchases = await RedeemedPurchase.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'name'); // solo traer nombre del usuario

    // Mapear respuesta para frontend: solo nombre y puntos
    const response = purchases.map(p => ({
      userName: p.userId.name,
      points: p.points,
      date: p.createdAt
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error('Error obteniendo últimas compras:', error);
    res.status(500).json({ message: 'Error interno al obtener últimas compras' });
  }
};

const getTotalRedeemedPoints = async (req, res) => {
  try {
    // Sumar todos los puntos en la colección RedeemedPurchase
    const result = await RedeemedPurchase.aggregate([
      {
        $group: {
          _id: null,
          totalRedeemed: { $sum: "$points" }
        }
      }
    ]);

    const totalRedeemed = (result[0]?.totalRedeemed) || 0;
    console.log('Total canjeado:', totalRedeemed);

    res.status(200).json({ totalRedeemed });
  } catch (error) {
    console.error('Error obteniendo total canjeado:', error);
    res.status(500).json({ message: 'Error interno al obtener total canjeado' });
  }
};






module.exports = {
  getCatalog,
  getProductById,
  getCart,
  addToCart,
  removeFromCart,
  checkout,
  updateCartItem,
  getLastRedeemedPurchases,
  getTotalRedeemedPoints
};
