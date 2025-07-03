const User = require('../models/User'); 
const Appointment = require('../models/Appointment');
const admin = require('../config/firebaseAdmin');
const { get } = require('mongoose');

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
    const userToUpdate = await User.findById(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const originalRole = userToUpdate.role;
    userToUpdate.role = role;
    await userToUpdate.save();

    //Si era veterinario y se convierte en cliente, redistribuir citas
    if (originalRole === 'veterinario' && role === 'cliente') {
      const appointments = await Appointment.find({ veterinarian: userToUpdate._id });

      if (appointments.length > 0) {
        const otherVeterinarians = await User.find({ role: 'veterinario', _id: { $ne: userToUpdate._id } });

        if (otherVeterinarians.length === 0) {
          return res.status(400).json({ message: 'No hay otros veterinarios disponibles para reasignar las citas.' });
        }

        // Calcular carga de trabajo actual
        const appointmentCounts = await Appointment.aggregate([
          { $match: { veterinarian: { $in: otherVeterinarians.map(vet => vet._id) } } },
          { $group: { _id: "$veterinarian", count: { $sum: 1 } } }
        ]);

        const vetAssignmentMap = new Map();
        otherVeterinarians.forEach(vet => {
          const vetCount = appointmentCounts.find(ac => String(ac._id) === String(vet._id))?.count || 0;
          vetAssignmentMap.set(vet._id.toString(), vetCount);
        });

        // Reasignar cada cita
        for (const appointment of appointments) {
          // Obtener veterinario con menor carga
          const selectedVet = [...vetAssignmentMap.entries()].sort((a, b) => a[1] - b[1])[0][0];
          appointment.veterinarian = selectedVet;
          await appointment.save();

          // Aumentar carga
          vetAssignmentMap.set(selectedVet, vetAssignmentMap.get(selectedVet) + 1);
        }
      }
    }

    res.status(200).json( userToUpdate );
  }catch (error) {
    res.status(500).json({ message: 'Error al cambiar el rol del usuario', error: error.message });
  }
};

const updateUserVitalCoin = async (req, res) => {  
  try {
    const { id } = req.params;  // id del usuario a modificar
    const { vitalCoins } = req.body;  // cantidad a agregar

    // Solo admin puede cambiar roles
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden agregar VitalCoins.' });
    }

    if (typeof vitalCoins !== 'number' || vitalCoins <= 0) {
      return res.status(400).json({ message: 'Cantidad inválida. Debe ser un número positivo.' });
    }
    
    // Incrementar VitalCoins
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $inc: { vitalCoins: vitalCoins } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json({ message: 'VitalCoins agregados correctamente.', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar VitalCoins', error: error.message });
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

const searchClients = async (req, res) => {
  try {
    const query = req.query.email?.toLowerCase() || '';
    if (!query) return res.status(400).json({ message: 'Debe proporcionar un correo para buscar' });

    const users = await User.find({
      email: { $regex: query, $options: 'i' },
      role: 'cliente',
    });

    res.status(200).json(users);
  } catch (error) {
    console.error('Error buscando clientes:', error);
    res.status(500).json({ message: 'Error interno al buscar clientes' });
  }
};

const getVeterinarians = async (req, res) => {
  try {
    // 1. Obtener token de encabezado
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // 2. Verificar token con Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    // 3. Buscar usuario en la base de datos
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 4. Verificar que sea admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Solo administradores pueden ver esta información.' });
    }

    // 5. Obtener veterinarios
    const veterinarians = await User.find({ role: 'veterinario' });
    res.status(200).json(veterinarians);

  } catch (error) {
    console.error('Error en getVeterinarians:', error);
    res.status(500).json({ message: 'Error interno al obtener veterinarios' });
  }
};

const getUserById = async (req, res) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) return res.status(401).json({ message: 'Token no proporcionado' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    // Buscamos el usuario que hace la petición para validar permisos si quieres:
    const requestingUser = await User.findOne({ firebaseUid });
    if (!requestingUser) return res.status(404).json({ message: 'Usuario solicitante no encontrado' });

    // Si quieres, puedes permitir que sólo admin o veterinarios puedan ver otros usuarios
    if (requestingUser.role !== 'admin' && requestingUser.role !== 'veterinario') {
      return res.status(403).json({ message: 'Acceso denegado.' });
    }

    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    res.status(200).json(user);
  } catch (error) {
    console.error('Error obteniendo usuario por ID:', error);
    res.status(500).json({ message: 'Error interno al obtener usuario' });
  }
};


module.exports = { register, login, changeUserRole, getUser, createAdminIfNotExist, updateUserVitalCoin, searchClients, getVeterinarians, getUserById };
