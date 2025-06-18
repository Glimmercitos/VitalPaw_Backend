const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priceInVitalCoins: {
    type: Number,
    required: true,
  },
  image: String
}, { timestamps: true });


module.exports = mongoose.model('Product', productSchema);
