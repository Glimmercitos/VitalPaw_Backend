const Appointment = require('../models/Appointment'); 
const Pet = require('../models/Pet'); 
const User = require('../models/User'); 
const admin = require('../config/firebaseAdmin'); 


// Crear una cita como cliente
const createAppointmentByClient = async (req, res) => {
    try {
        // Verificar autenticación
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            return res.status(401).json({ message: 'Valor de autenticación ausente' });
        }

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario autenticado
        const user = await User.findOne({ firebaseUid });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado." });
        }

        if (user.role !== 'cliente') {
            return res.status(403).json({ message: "Acceso denegado. Solo los clientes pueden crear citas." });
        }

        // Extraer y validar los datos del cuerpo
        const { service, description, date, time, petId } = req.body;

        if (!service || !description || !date || !time || !petId) {
            return res.status(400).json({ message: "Faltan datos para crear la cita." });
        }

        // Verificar que la mascota pertenezca al usuario
        const pet = await Pet.findOne({ _id: petId, owner: user._id });
        if (!pet) {
            return res.status(404).json({ message: "La mascota no existe o no te pertenece." });
        }

        // Obtener veterinarios disponibles
        const veterinarians = await User.find({ role: 'veterinario' });
        if (veterinarians.length === 0) {
            return res.status(400).json({ message: "No hay veterinarios disponibles para asignar la cita." });
        }

        // Calcular la carga de citas por veterinario
        const appointmentCounts = await Appointment.aggregate([
            { $match: { veterinarian: { $in: veterinarians.map(vet => vet._id) } } },
            { $group: { _id: "$veterinarian", count: { $sum: 1 } } }
        ]);

        const vetAssignmentMap = new Map();
        veterinarians.forEach(vet => {
            const vetCount = appointmentCounts.find(ac => String(ac._id) === String(vet._id))?.count || 0;
            vetAssignmentMap.set(vet._id, vetCount);
        });

        // Seleccionar veterinario con menos citas
        const selectedVet = [...vetAssignmentMap.entries()].sort((a, b) => a[1] - b[1])[0][0];

        // Crear y guardar la cita
        const appointment = new Appointment({ 
            owner: user._id,
            pet: pet._id,
            petName: pet.name,
            service,
            description,
            date,
            time,
            veterinarian: selectedVet
        });

        await appointment.save();

        // Populate antes de enviar al cliente (muy importante)
        const populatedAppointment = await Appointment.findById(appointment._id)
            .populate('owner', 'name email')
            .populate('pet', 'name species')
        res.status(201).json({
            message: "Cita creada correctamente.",
            appointment: populatedAppointment
        });

    } catch (error) {
        console.error("Error al crear la cita:", error);
        res.status(500).json({ message: 'Error al crear la cita!', error: error.message });
    }
};

const getAppointments = async (req, res) => {
    try {
        // Verificar autenticacion
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'admin') {
            return res.status(403).json({ message: "Acceso denegado. Sólo el administrador puede acceder." });
        }

        const appointments = await Appointment.find().populate('owner', 'name email').populate('pet', 'name species imageUrl');
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las citas!', error: error.message });
    }
};

const getAppointmentsByUserId = async (req, res) => {
    const { userId } = req.params;

    try {
        // Verificar autenticacion
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario autenticado
        const authUser = await User.findOne({ firebaseUid });
        if (!authUser) return res.status(404).json({ message: "Usuario no encontrado." });

        if (authUser.role !== 'admin') {
            return res.status(403).json({ message: "Acceso denegado." });
        }

        const appointments = await Appointment.find({ owner: userId })
            .populate("owner", "name email");

        if (!appointments.length) {
            return res.status(404).json({ message: "No se encontraron citas para este usuario." });
        }

        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las citas!', error: error.message });
    }
};

const getAppointmentsForVet = async (req, res) => {
    try {
        // Verificar autenticacion
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'veterinario') {
            return res.status(403).json({ message: "Acceso denegado." });
        }

        const appointments = await Appointment.find({ veterinarian: user._id })
            .populate('owner', 'name email')
            .populate('pet', 'name species imageUrl')
            .sort({ date: 1, time: 1 });

        res.status(200).json({ message: "Citas obtenidas correctamente.", appointments });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener las citas!', error: error.message });
    }
};

const deleteAppointment = async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar autenticacion
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'admin') {
            return res.status(403).json({ message: "Acceso denegado." });
        }

        const deleted = await Appointment.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Cita no encontrada." });
        }

        res.status(200).json({ message: "Cita eliminada correctamente.", appointment: deleted });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la cita!', error: error.message });
    }
};

const deleteVetAppointmentById = async (req, res) => {
    try {
        // Verificar autenticacion
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'veterinario') {
            return res.status(403).json({ message: "Acceso denegado." });
        }

        const { id } = req.params;

        const deleted = await Appointment.findOneAndDelete({ _id: id, veterinarian: user._id });
        if (!deleted) {
            return res.status(404).json({ message: "Cita no encontrada o no está asignada a este veterinario." });
        }

        res.status(200).json({ message: "Cita eliminada correctamente.", appointment: deleted });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la cita.", error: error.message });
    }
};

const editVetAppointment = async (req, res) => {
    try {
        // Verificar autenticacion
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'veterinario') {
            return res.status(403).json({ message: "Acceso denegado." });
        }

        const { id: appointmentId } = req.params;

        const { service, description, date, time } = req.body;

        if (!service || !description || !date || !time) {
            return res.status(400).json({ message: "Faltan datos para editable la cita." });
        }

        const existing = await Appointment.findOne({ _id: appointmentId, veterinarian: user._id });
        if (!existing) {
            return res.status(404).json({ message: "Cita no encontrada o no está asignada a este veterinario." });
        }

        existing.service = service;
        existing.description = description;
        existing.date = date;
        existing.time = time;

        await existing.save();

        const populatedAppointment = await Appointment.findById(existing._id)

        .populate('owner', 'id role')
         .populate('pet', 'name species');;

        res.status(200).json({ message: "Cita actualizada correctamente.", appointment: populatedAppointment });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la cita.", error: error.message });
    }
};
const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('owner', 'name email')
      .populate('pet', 'name species breed age unitAge gender weight imageUrl');
    if (!appointment) return res.status(404).json({ message: 'Cita no encontrada' });
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
};

const getAppointmentsForClient = async (req, res) => {
    try {
        // Verificar autenticación
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario autenticado
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'cliente') {
            return res.status(403).json({ message: "Acceso denegado. Solo los clientes pueden acceder a sus citas." });
        }

        // Buscar citas asociadas al cliente autenticado
        const appointments = await Appointment.find({ owner: user._id })
            .populate('owner', 'name email') // 🔽 esto incluye los datos del usuario
            .populate('pet', 'name species breed age unitAge gender weight imageUrl')
            .sort({ date: 1, time: 1 });

        res.status(200).json(
            appointments
        );

    } catch (error) {
        console.error("Error al obtener citas del cliente:", error);
        res.status(500).json({ message: 'Error al obtener las citas.', error: error.message });
    }
};

const deleteClientAppointment = async (req, res) => {
    try {
        // Verificar autenticación
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario autenticado
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'cliente') {
            return res.status(403).json({ message: "Acceso denegado. Solo los clientes pueden eliminar sus citas." });
        }

        const { id } = req.params;

        // Verificar que la cita le pertenezca al usuario
        const appointment = await Appointment.findOne({ _id: id, owner: user._id });
        if (!appointment) {
            return res.status(404).json({ message: "Cita no encontrada o no te pertenece." });
        }

        await Appointment.findByIdAndDelete(id);

        res.status(200).json({ message: "Cita eliminada correctamente." });

    } catch (error) {
        console.error("Error al eliminar la cita del cliente:", error);
        res.status(500).json({ message: "Error al eliminar la cita.", error: error.message });
    }
};

module.exports = {
    createAppointmentByClient,
    getAppointments,
    deleteAppointment,
    getAppointmentsByUserId,
    getAppointmentsForVet,
    deleteVetAppointmentById,
    editVetAppointment,
    getAppointmentById,
    getAppointmentsForClient,
    deleteClientAppointment
};

