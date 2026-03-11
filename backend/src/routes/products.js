const express = require('express');
const router = express.Router();
const { Product, Recipe } = require('../models/Product');
const Ingredient = require('../models/Ingredient');
const { auth, adminOnly } = require('../middleware/auth');

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    const products = await Product.find({ active: true })
      .populate({ path: 'recipe', populate: { path: 'ingredients.ingredient' } })
      .sort('name variant');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all recipes
router.get('/recipes', auth, async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('ingredients.ingredient');
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create recipe
router.post('/recipes', auth, adminOnly, async (req, res) => {
  try {
    // Calculate total cost
    let totalCost = 0;
    for (const ri of req.body.ingredients) {
      const ing = await Ingredient.findById(ri.ingredient);
      if (ing) totalCost += (ing.costPerUnit || 0) * ri.quantity;
    }
    
    const recipe = new Recipe({ ...req.body, totalCost: Math.round(totalCost) });
    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Create product
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    let totalCost = 0;
    if (req.body.recipe) {
      const recipe = await Recipe.findById(req.body.recipe).populate('ingredients.ingredient');
      if (recipe) {
        for (const ri of recipe.ingredients) {
          totalCost += (ri.ingredient.costPerUnit || 0) * ri.quantity;
        }
      }
    }

    const product = new Product({
      ...req.body,
      totalCost: Math.round(totalCost),
      profit: req.body.salePrice - Math.round(totalCost),
      margin: req.body.salePrice > 0 
        ? Math.round(((req.body.salePrice - Math.round(totalCost)) / req.body.salePrice) * 100)
        : 0
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update product price
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete product
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
