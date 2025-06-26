const User = require('../models/User'); 
const admin = require('../config/firebaseAdmin');

async function createAdminIfNotExist() {
  try {
    const adminEmail = "vitalpetvef@gmail.com";

    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      admin = new User({ 
        firebaseUid: "LFx8JzZJgheD3MMbArE7KOH5QWW2", // el UID que encuentres o que tu admin tenga en Firebase
        name: "Administrador",
        email: adminEmail,
        gender: "Male",
        role: "admin"
      });

      await admin.save();

      console.log("Usuario administrador creado automáticamente.");
    } else {
      console.log("Usuario administrador ya existe.");
    }
  } catch (error) {
    console.error("Error al crear el administrador.", error);
  }
}
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

    const { name, email, gender, role } = req.body;
    user = new User({ firebaseUid, name, email, gender, role });
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
    console.log('ID Token recibido:', idToken);
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


const changeUserRole = async (req, res) => {
  const { id } = req.params;  // id del usuario a modificar
  const { role } = req.body;  // nuevo rol

  // Solo admin puede cambiar roles
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden cambiar roles.' });
  }

  // Validar rol permitido
  const allowedRoles = ['admin', 'veterinario', 'cliente'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Rol inválido.' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json({ message: 'Rol actualizado correctamente.', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar el rol del usuario', error: error.message });
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

module.exports = { register, login, changeUserRole, getUser, createAdminIfNotExist };
