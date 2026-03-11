const express = require('express');
const router = express.Router();
const Ingredient = require('../models/Ingredient');
const { auth, adminOnly } = require('../middleware/auth');
const { recalculateProductCosts } = require('../services/stock.service');

// Get all ingredients
router.get('/', auth, async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ active: true }).sort('category name');
    res.json(ingredients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create ingredient
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const ingredient = new Ingredient(req.body);
    await ingredient.save();
    res.status(201).json(ingredient);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update ingredient (triggers price recalculation if cost changes)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const costChanged = req.body.packageCost !== undefined;
    
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient) return res.status(404).json({ message: 'Ingrediente no encontrado' });

    Object.assign(ingredient, req.body);
    // Recalculate costPerUnit
    if (ingredient.quantityPerPackage > 0) {
      ingredient.costPerUnit = ingredient.packageCost / ingredient.quantityPerPackage;
    }
    await ingredient.save();

    let affectedProducts = [];
    if (costChanged) {
      // Cascade recalculation across all products using this ingredient
      affectedProducts = await recalculateProductCosts(ingredient._id);
    }

    res.json({ ingredient, affectedProducts, pricesRecalculated: costChanged });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete (soft delete)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Ingredient.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Ingrediente eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
