const mongoose = require('mongoose');

const redeemedPurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true }, // puntos canjeados en esa compra puntual
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RedeemedPurchase', redeemedPurchaseSchema);
