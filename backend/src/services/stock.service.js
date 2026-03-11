const Stock = require('../models/Stock');
const { Recipe, Product } = require('../models/Product');
const Ingredient = require('../models/Ingredient');

/**
 * Deduct stock based on order items and their recipes
 * Only called when kitchen confirms an order
 */
async function deductStockForOrder(orderItems) {
  const deductions = {}; // ingredientId -> total quantity to deduct

  for (const item of orderItems) {
    const product = await Product.findById(item.product).populate('recipe');
    if (!product || !product.recipe) continue;

    const recipe = await Recipe.findById(product.recipe).populate('ingredients.ingredient');
    if (!recipe) continue;

    for (const recipeIngredient of recipe.ingredients) {
      const ingId = recipeIngredient.ingredient._id.toString();
      const totalQty = recipeIngredient.quantity * item.quantity;
      deductions[ingId] = (deductions[ingId] || 0) + totalQty;
    }
  }

  const results = [];
  for (const [ingredientId, quantity] of Object.entries(deductions)) {
    const stock = await Stock.findOne({ ingredient: ingredientId });
    if (!stock) {
      results.push({ ingredientId, status: 'not_found', quantity });
      continue;
    }

    const previousStock = stock.currentStock;
    stock.currentStock = Math.max(0, stock.currentStock - quantity);
    
    // Update status
    if (stock.currentStock <= 0) {
      stock.status = 'out';
    } else if (stock.currentStock < stock.minimumStock) {
      stock.status = 'low';
    } else {
      stock.status = 'ok';
    }
    
    stock.lastUpdated = new Date();
    await stock.save();

    results.push({
      ingredientId,
      ingredient: stock.ingredient,
      previousStock,
      newStock: stock.currentStock,
      deducted: quantity,
      status: stock.status
    });
  }

  return results;
}

/**
 * Recalculate product costs when an ingredient price changes
 * Implements the dynamic escandallo (cost sheet)
 */
async function recalculateProductCosts(ingredientId) {
  const ingredient = await Ingredient.findById(ingredientId);
  if (!ingredient) return [];

  // Find all recipes that use this ingredient
  const recipes = await Recipe.find({
    'ingredients.ingredient': ingredientId
  }).populate('ingredients.ingredient');

  const updatedProducts = [];

  for (const recipe of recipes) {
    // Recalculate recipe total cost
    let recipeCost = 0;
    for (const ri of recipe.ingredients) {
      const ing = await Ingredient.findById(ri.ingredient);
      if (ing) {
        recipeCost += ing.costPerUnit * ri.quantity;
      }
    }
    recipe.totalCost = Math.round(recipeCost);
    await recipe.save();

    // Update all products using this recipe
    const products = await Product.find({ recipe: recipe._id });
    for (const product of products) {
      const previousCost = product.totalCost;
      product.totalCost = recipe.totalCost;
      product.profit = product.salePrice - product.totalCost;
      product.margin = product.salePrice > 0 
        ? Math.round((product.profit / product.salePrice) * 100) 
        : 0;
      
      // Suggested price to maintain desired margin
      const suggestedPrice = Math.round(product.totalCost * (1 + product.desiredMargin / 100));
      
      await product.save();
      updatedProducts.push({
        productId: product._id,
        name: `${product.name} ${product.variant}`,
        previousCost,
        newCost: product.totalCost,
        currentSalePrice: product.salePrice,
        suggestedPrice,
        margin: product.margin
      });
    }
  }

  return updatedProducts;
}

/**
 * Generate prioritized shopping list (ABC methodology)
 * A = Critical perishables (meat, bread, vegetables) - buy first
 * B = Important non-perishables
 * C = Disposables and extras
 */
async function generateShoppingList() {
  const stocks = await Stock.find().populate('ingredient');
  
  const shoppingList = [];
  
  for (const stock of stocks) {
    if (!stock.ingredient) continue;
    
    if (stock.currentStock < stock.minimumStock) {
      const deficit = stock.minimumStock - stock.currentStock;
      const ingredient = stock.ingredient;
      
      // Calculate estimated cost
      const estimatedCost = ingredient.costPerUnit ? deficit * ingredient.costPerUnit : 0;
      
      shoppingList.push({
        ingredient: ingredient._id,
        name: ingredient.name,
        unit: stock.unit,
        currentStock: stock.currentStock,
        minimumStock: stock.minimumStock,
        deficit,
        estimatedCost: Math.round(estimatedCost),
        priority: ingredient.priority || 'B',
        perishable: ingredient.perishable || false,
        category: ingredient.category,
        status: stock.status
      });
    }
  }

  // Sort: A first, then B, then C; within same priority, perishables first
  shoppingList.sort((a, b) => {
    const priorityOrder = { 'A': 0, 'B': 1, 'C': 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Within same priority, perishables first
    if (a.perishable !== b.perishable) return b.perishable ? 1 : -1;
    // Then by status severity
    const statusOrder = { 'out': 0, 'low': 1, 'ok': 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const totalEstimated = shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0);
  
  return { items: shoppingList, totalEstimated };
}

module.exports = { deductStockForOrder, recalculateProductCosts, generateShoppingList };
