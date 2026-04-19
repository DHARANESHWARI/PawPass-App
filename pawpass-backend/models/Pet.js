const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  species: { type: String, required: true },
  breed: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required:true }, // <-- UPDATED: Explicit gender field
  vaccinationStatus: { type: String, default: 'Up to date' },
  allergies: { type: String, default: 'None' },
  afraidOf: { type: String, default: 'None' },
  isFriendly: { type: String, default: 'Yes' },
  isDeleted: { type: Boolean, default: false }, 
  dateAdded: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pet', PetSchema);