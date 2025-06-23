const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointmentController');
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");

router.post('/create', verifyFirebaseToken, appointmentController.createAppointmentByClient);

router.get('/all', verifyFirebaseToken, appointmentController.getAppointments);
router.delete('/delete/:id', verifyFirebaseToken, appointmentController.deleteAppointment);
router.get('/user/:userId', verifyFirebaseToken, appointmentController.getAppointmentsByUserId);

router.get('/vet', verifyFirebaseToken, appointmentController.getAppointmentsForVet);
router.get('/vet/:id', verifyFirebaseToken, appointmentController.getAppointmentById)
router.delete('/vet/delete/:id', verifyFirebaseToken, appointmentController.deleteVetAppointmentById);
router.put('/vet/edit/:id', verifyFirebaseToken, appointmentController.editVetAppointment);

module.exports = router;
