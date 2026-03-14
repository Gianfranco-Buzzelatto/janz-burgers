const express = require('express');
const router = express.Router();
const Config = require('../models/Config');
const { Product, Recipe } = require('../models/Product');
const Ingredient = require('../models/Ingredient');
const { auth, adminOnly } = require('../middleware/auth');

// GET config actual
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const configs = await Config.find();
    const result = {};
    configs.forEach(c => result[c.key] = c.value);
    // Defaults si no existen
    if (!result.indirectCosts) result.indirectCosts = { luz: 5, gas: 3, packaging: 4, otros: 3 };
    if (!result.desiredMargin) result.desiredMargin = 300;
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT actualizar config
router.put('/', auth, adminOnly, async (req, res) => {
  try {
    const { indirectCosts, desiredMargin } = req.body;
    if (indirectCosts !== undefined) {
      await Config.findOneAndUpdate(
        { key: 'indirectCosts' },
        { key: 'indirectCosts', value: indirectCosts, label: 'Costos Indirectos (%)' },
        { upsert: true, new: true }
      );
    }
    if (desiredMargin !== undefined) {
      await Config.findOneAndUpdate(
        { key: 'desiredMargin' },
        { key: 'desiredMargin', value: Number(desiredMargin), label: 'Margen Deseado (%)' },
        { upsert: true, new: true }
      );
    }

    // Recalcular todos los productos con nueva config
    await recalcAllProducts(indirectCosts, desiredMargin);

    res.json({ message: 'Configuración actualizada y productos recalculados' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function recalcAllProducts(indirectCosts, desiredMargin) {
  // Obtener config actual si no se pasa
  if (!indirectCosts) {
    const cfg = await Config.findOne({ key: 'indirectCosts' });
    indirectCosts = cfg?.value || { luz: 5, gas: 3, packaging: 4, otros: 3 };
  }
  if (!desiredMargin) {
    const cfg = await Config.findOne({ key: 'desiredMargin' });
    desiredMargin = cfg?.value || 300;
  }

  const totalIndirectPct = Object.values(indirectCosts).reduce((s, v) => s + Number(v), 0);
  const products = await Product.find({ active: true }).populate({
    path: 'recipe',
    populate: { path: 'ingredients.ingredient' }
  });

  for (const product of products) {
    if (!product.recipe) continue;
    let ingredientCost = 0;
    for (const ri of product.recipe.ingredients) {
      if (ri.ingredient) ingredientCost += (ri.ingredient.costPerUnit || 0) * ri.quantity;
    }
    const indirectAmount = Math.round(ingredientCost * totalIndirectPct / 100);
    const totalCost = Math.round(ingredientCost + indirectAmount);
    const profit = product.salePrice - totalCost;
    const margin = product.salePrice > 0 ? Math.round((profit / product.salePrice) * 100) : 0;
    // Precio sugerido basado en margen deseado: precio = costo / (1 - margen/100)
    const suggestedPrice = Math.round(totalCost * (1 + desiredMargin / 100));

    await Product.findByIdAndUpdate(product._id, {
      totalCost,
      profit,
      margin,
      suggestedPrice,
      ingredientCost: Math.round(ingredientCost),
      indirectCost: indirectAmount
    });
  }
}

module.exports = router;
module.exports.recalcAllProducts = recalcAllProducts;
