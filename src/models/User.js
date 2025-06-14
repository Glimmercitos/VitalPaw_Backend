const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String },
    role: { type: String, default: 'cliente', enum: ['cliente', 'veterinario', 'admin'] }, 
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
