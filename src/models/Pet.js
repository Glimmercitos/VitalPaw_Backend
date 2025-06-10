const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  species: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  breed: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  gender: {
    type: Boolean,
    required: true,
  },
  unitAge: {
    type: String,
    enum: ['months', 'years'],
    required: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Pet', petSchema);