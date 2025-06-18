require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require("./src/routes/userRoutes");
const petRoutes = require("./src/routes/petRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
const medicalRecordRoutes = require("./src/routes/medicalRecordRoutes");
const { createAdminIfNotExist } = require("./src/controllers/userController");
const shopRoutes = require("./src/routes/shopRoutes")
const seedProductsIfNeeded = require("./seedProducts")

const app = express();

app.use(cors()); 
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB conectado");

    await createAdminIfNotExist();

    seedProductsIfNeeded();

    console.log("Comienza el server.");

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

  })
  .catch((err) => console.error("Error al conectar MongoDB:", err));

app.use('/api/users', userRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/appointments', appointmentRoutes)
app.use('/api/medicalRecords', medicalRecordRoutes);
app.use('/api/shop', shopRoutes);