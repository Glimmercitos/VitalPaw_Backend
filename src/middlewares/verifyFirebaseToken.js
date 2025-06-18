const admin = require('../config/firebaseAdmin');
const User = require('../models/User'); // Ajusta la ruta según tu proyecto

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Token no provisto' });

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUid = decodedToken.uid;

    // Busca el usuario en tu base de datos por firebaseUid
    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Guarda el usuario completo en req.user
    req.user = user;

    next();
  } catch (error) {
    console.error('Token inválido:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};

module.exports = verifyFirebaseToken;
