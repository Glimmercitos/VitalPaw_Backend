const Appointment = require('../models/Appointment'); 
const MedicalRecord = require('../models/MedicalRecord'); 
const User = require('../models/User'); 
const admin = require('../config/firebaseAdmin'); 


const addMedicalRecord = async (req, res) => {
    try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'veterinario') {
            return res.status(403).json({ message: "Acceso denegado. Único rol: Veterinario" });
        }

        const { id } = req.params;
        const { notes, treatment } = req.body;

        if (!notes || !treatment) {
            return res.status(400).json({ message: 'Notas y tratamiento son requeridos' });
        }

        // Buscar la cita
        const appointment = await Appointment.findById(id).populate('pet'); 
        if (!appointment) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }

        //Crear el expediente médico
        const medicalRecord = new MedicalRecord({ 
            notes,
            treatment,
            pet: appointment.pet._id,
            appointment: id,
            service: appointment.service,
            description: appointment.description,
            date: appointment.date,
            time: appointment.time,
        });

        await medicalRecord.save();

        const populatedMedicalRecord = await MedicalRecord.findById(medicalRecord._id)
            .populate('pet', 'name breed weight age unitAge gender species petImage'); 


        res.status(201).json({ message: 'Registro médico agregado correctamente!', medicalRecord: populatedMedicalRecord });
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar el expediente médico!', error: error.message });
    }
};

const getMedicalRecords = async (req, res) => {
    try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar al usuario
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'veterinario') {
            return res.status(403).json({ message: "Acceso denegado. Único rol: Veterinario." });
        }

        // Recuperar los expedientes
        const medicalRecords = await MedicalRecord.find()
            .populate('pet', 'name breed weight age unitAge gender species petImage') 
            .sort({ date: -1 }); 


        res.status(200).json({ message: 'Expedientes recuperados con éxito!', medicalRecords });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener expedientes!', error: error.message });
    }
};

const getMedicalRecordsByPetId = async (req, res) => {
    try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) return res.status(401).json({ message: 'Valor de autenticación ausente' });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== 'veterinario') {
            return res.status(403).json({ message: "Acceso denegado. Único rol: Veterinario." });
        }

        const { petId } = req.params;

        const medicalRecords = await MedicalRecord.find({ pet: petId })
            .populate('pet', 'name breed weight age unitAge gender species petImage')
            .sort({ date: -1 });

        res.status(200).json({ message: 'Expedientes de la mascota recuperados con éxito!', medicalRecords });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los expedientes de la mascota!', error: error.message });
    }
};


module.exports = { addMedicalRecord, getMedicalRecords, getMedicalRecordsByPetId };
