const User = require('../models/User'); 
const admin = require('../config/firebaseAdmin');

const register = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    let user = await User.findOne({ firebaseUid });
    if (user) {
      return res.status(400).json({ message: 'Usuario ya registrado' });
    }

    const { name, email, phone, role } = req.body;
    user = new User({ firebaseUid, name, email, phone, role });
    await user.save();

    res.status(201).json({ message: 'Usuario registrado', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registrando usuario' });
  }
};

const login = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    const user = await User.findOne({ firebaseUid });
    console.log('Usuario encontrado:', user);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario autenticado', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error autenticando usuario' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requesterUid = decodedToken.uid;

    const requester = await User.findOne({ firebaseUid: requesterUid });
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const { userId, newRole } = req.body;
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) return res.status(404).json({ message: 'Usuario no encontrado' });

    userToUpdate.role = newRole;
    await userToUpdate.save();

    res.status(200).json({ message: 'Rol actualizado', user: userToUpdate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error actualizando rol' });
  }
};
const getUser = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    const user = await User.findOne({ firebaseUid });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo el usuario' });
  }
};

module.exports = { register, login, updateUserRole, getUser };
