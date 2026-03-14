/**
 * fix-available.js
 * Marca todos los productos activos como disponibles (available: true)
 * Uso: node src/config/fix-available.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/janzburgers';

async function fixAvailable() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado a MongoDB...');

  const result = await Product.updateMany(
    { active: true },
    { $set: { available: true } }
  );

  console.log(`✅ ${result.modifiedCount} productos marcados como disponibles`);
  await mongoose.disconnect();
}

fixAvailable().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
