const Pet = require("../models/Pet"); 
const User = require("../models/User"); 
const admin = require("../config/firebaseAdmin");
const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");

const getAllPets = async (req, res) => {
    try {
        // Verificar que el token esté incluido
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) return res.status(401).json({ message: "Token no proporcionado." });

        // Decodificar el token de Firebase
        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar el usuario en nuestra base de datos
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (user.role !== "admin") {
            return res.status(403).json({ message: "Acceso denegado. Único el administrador puede acceder." });
        }

        const pets = await Pet.find();

        res.status(200).json(pets);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las mascotas.", error: error.message });
    }
};

const getUserPets = async (req, res) => {
    try {
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) return res.status(401).json({ message: "Token no proporcionado." });

        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        const pets = await Pet.find({ owner: user._id });

        res.status(200).json(pets);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las mascotas del usuario.", error: error.message });
    }
};

const createPet = async (req, res) => {
    try {
        // Verificar que el token esté incluido
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) return res.status(401).json({ message: "Token no proporcionado." });

        // Decodificar el token de Firebase
        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar el usuario en nuestra base de datos
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        if (!["admin", "cliente"].includes(user.role)) {
            return res.status(403).json({ message: "Acceso denegado. Único el administrador o el cliente puede crear." });
        }

        const { name, species, breed, gender, age, weight, unitAge } = req.body;

        if (!name || !species || !breed || gender === undefined ||
            !age || !weight) {
            return res.status(400).json({ message: "Faltan datos para crear la mascota." });
        }

        let imageUrl = "";
        let imagePublicId = "";
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "vitalpaw/pets",
                public_id: `pet_${Date.now()}_${user._id}`,
            });
            imageUrl = result.secure_url;
            imagePublicId = result.public_id;
            fs.unlinkSync(req.file.path);
        }


        const newPet = new Pet({ 
            name, 
            species, 
            breed, 
            gender, 
            age, 
            weight, 
            unitAge, 
            owner: user._id,
            imageUrl,
            imagePublicId
        });

        await newPet.save();

        res.status(201).json({ message: "Mascota creada.", pet: newPet });
    } catch (error) {
        res.status(500).json({ message: "Error al crear la mascota.", error: error.message });
    }
};

const deletePet = async (req, res) => {
    try {
        // Verificar que el token esté incluido
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) return res.status(401).json({ message: "Token no proporcionado." });

        // Decodificar el token de Firebase
        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar el usuario en nuestra base de datos
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        // Validar que el usuario pueda eliminar
        const pet = await Pet.findById(req.params.id);
        if (!pet) return res.status(404).json({ message: "Mascota no encontrada." });

        if (user.role !== "admin" &&
            pet.owner.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Acceso denegado." });
        }

        if (pet.imagePublicId) {
            await cloudinary.uploader.destroy(pet.imagePublicId);
        }

        await Appointment.deleteMany({ pet: pet._id} );

        await MedicalRecord.deleteMany({ pet: pet._id} );

        await Pet.findByIdAndDelete({ pet: pet._id} );

        res.status(200).json({ message: "Mascota eliminada correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la mascota.", error: error.message });
    }
};

const deleteUserPet = async (req, res) => {
    try {
        // Verificar que el token esté incluido
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (!idToken) return res.status(401).json({ message: "Token no proporcionado." });

        // Decodificar el token de Firebase
        const decoded = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decoded.uid;

        // Buscar el usuario en nuestra base de datos
        const user = await User.findOne({ firebaseUid });
        if (!user) return res.status(404).json({ message: "Usuario no encontrado." });

        // Validar que el usuario pueda eliminar
        const pet = await Pet.findById(req.params.id);
        if (!pet) return res.status(404).json({ message: "Mascota no encontrada." });

        if (pet.owner.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Acceso denegado." });
        }

        if (pet.imagePublicId) {
            await cloudinary.uploader.destroy(pet.imagePublicId);
        }

        await Appointment.deleteMany({ pet: pet._id} );

        await MedicalRecord.deleteMany({ pet: pet._id} );

        await Pet.findByIdAndDelete({ pet: pet._id} );

        res.status(200).json({ message: "Mascota eliminada correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la mascota.", error: error.message });
    }
};

module.exports = {
    getAllPets,
    createPet,
    deletePet,
    getUserPets,
    deleteUserPet,
};

