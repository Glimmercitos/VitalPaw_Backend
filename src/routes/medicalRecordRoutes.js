const express = require('express'); 
const router = express.Router();

const medicalRecordController = require('../controllers/medicalRecordController');
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");

router.post('/:id', verifyFirebaseToken, medicalRecordController.addMedicalRecord);

router.get('/get', verifyFirebaseToken, medicalRecordController.getMedicalRecords);

router.get('/getPet/:petId', verifyFirebaseToken, medicalRecordController.getMedicalRecordsByPetId);

router.get('/getPet/:petId/:medicalRecordId', verifyFirebaseToken, medicalRecordController.getMedicalRecordById);

module.exports = router;
