const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: { type: String, required: true },
    role: { type: String, default: 'cliente', enum: ['cliente', 'veterinario', 'admin'] }, 
     vitalCoins: { type: Number, default: 100 },
    cart: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);