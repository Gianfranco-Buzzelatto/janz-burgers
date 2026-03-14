require('dotenv').config();
const mongoose = require('mongoose');
const { Product } = require('../models/Product');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/janzburgers';

async function fixAvailable() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado...');
  const result = await Product.updateMany({ active: true }, { $set: { available: true } });
  console.log(`${result.modifiedCount} productos actualizados`);
  await mongoose.disconnect();
}

fixAvailable().catch(console.error);