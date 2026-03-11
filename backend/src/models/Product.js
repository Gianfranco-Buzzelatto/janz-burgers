const mongoose = require('mongoose');

// Recipe ingredient sub-schema
const recipeIngredientSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
  quantity: { type: Number, required: true }, // quantity of this ingredient used
  unit: { type: String, required: true }
}, { _id: false });

// Recipe schema
const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: [recipeIngredientSchema],
  totalCost: { type: Number, default: 0 } // auto-calculated
}, { timestamps: true });

// Product schema (burger variants)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  variant: { type: String, required: true, enum: ['x1', 'x2', 'x3'] },
  salePrice: { type: Number, required: true },
  recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  totalCost: { type: Number, default: 0 }, // auto-calculated from recipe
  profit: { type: Number, default: 0 },
  margin: { type: Number, default: 0 }, // percentage
  desiredMargin: { type: Number, default: 300 }, // 300% markup target
  active: { type: Boolean, default: true },
  image: { type: String }
}, { timestamps: true });

const Recipe = mongoose.model('Recipe', recipeSchema);
const Product = mongoose.model('Product', productSchema);

module.exports = { Recipe, Product };
