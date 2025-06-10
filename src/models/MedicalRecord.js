const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
    notes: { type: String, required: true },
    treatment: { type: String, required: true },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: false },
    service: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);