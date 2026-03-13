const mongoose = require('mongoose');

const additionalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },   // ej: "Panceta extra"
  description: { type: String, trim: true },             // ej: "50g de panceta crocante"
  price: { type: Number, required: true, default: 0 },
  emoji: { type: String, default: '➕' },               // ícono para el menú público
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Additional', additionalSchema);
