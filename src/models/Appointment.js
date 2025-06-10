const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: true,
    },
    petName: {
        type: String,
        required: true,
    },
    service: {
        type: String,
        enum: ['grooming', 'consulta médica', 'emergencias'],
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    veterinarian: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
