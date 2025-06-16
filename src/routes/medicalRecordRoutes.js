const express = require('express'); 
const router = express.Router();

const medicalRecordController = require('../controllers/medicalRecordController');
const verifyFirebaseToken = require("../middlewares/verifyFirebaseToken");

router.post('/:id', verifyFirebaseToken, medicalRecordController.addMedicalRecord);

router.get('/get', verifyFirebaseToken, medicalRecordController.getMedicalRecords);

module.exports = router;
