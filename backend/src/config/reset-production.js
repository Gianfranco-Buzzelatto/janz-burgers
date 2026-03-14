/**
 * reset-production.js
 * 
 * Script de reset para arrancar en producción.
 * 
 * ✅ CONSERVA: Usuarios, precios de venta de productos existentes
 * 🔄 RECREA:   Ingredientes, stock, recetas, productos (con costos correctos por variante)
 * 🗑️ BORRA:    Pedidos, clientes, adicionales de prueba
 * 
 * Uso: node src/config/reset-production.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');
const Stock = require('../models/Stock');
const { Recipe, Product } = require('../models/Product');
const { Client, Order } = require('../models/Order');
const Additional = require('../models/Additional');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/janzburgers';

async function resetProduction() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Conectado a MongoDB...');

  // ── Guardar precios de venta actuales ──────────────────────────────
  const existingProducts = await Product.find({});
  const savedPrices = {};
  for (const p of existingProducts) {
    savedPrices[`${p.name}__${p.variant}`] = p.salePrice;
  }
  console.log(`💾 Precios guardados: ${Object.keys(savedPrices).length} productos`);

  // ── Borrar datos de prueba (NO usuarios) ───────────────────────────
  await Promise.all([
    Ingredient.deleteMany({}),
    Stock.deleteMany({}),
    Recipe.deleteMany({}),
    Product.deleteMany({}),
    Additional.deleteMany({}),
    Order.deleteMany({}),
    Client.deleteMany({})
  ]);
  console.log('🗑️  Datos de prueba eliminados (usuarios conservados)');

  // ── Ingredientes ───────────────────────────────────────────────────
  const ingredientsData = [
    { name: 'Carne picada', unit: 'g', packageUnit: 'kg', quantityPerPackage: 1000, packageCost: 13000, category: 'Proteína', perishable: true, priority: 'A' },
    { name: 'Panceta', unit: 'g', packageUnit: '100g', quantityPerPackage: 100, packageCost: 2000, category: 'Proteína', perishable: true, priority: 'A' },
    { name: 'Huevo', unit: 'unidad', packageUnit: 'maple x30', quantityPerPackage: 30, packageCost: 4000, category: 'Proteína', perishable: true, priority: 'A' },
    { name: 'Cheddar en fetas', unit: 'feta', packageUnit: 'barra x192', quantityPerPackage: 192, packageCost: 38000, category: 'Lácteos', perishable: true, priority: 'A' },
    { name: 'Cheddar líquido', unit: 'g', packageUnit: 'pote 1.5kg', quantityPerPackage: 1500, packageCost: 20000, category: 'Lácteos', perishable: true, priority: 'A' },
    { name: 'Leche en polvo', unit: 'g', packageUnit: 'bolsa 800g', quantityPerPackage: 800, packageCost: 13000, category: 'Lácteos', perishable: false, priority: 'B' },
    { name: 'Manteca', unit: 'g', packageUnit: '200g', quantityPerPackage: 200, packageCost: 3000, category: 'Lácteos', perishable: true, priority: 'B' },
    { name: 'Tomate', unit: 'unidad', packageUnit: 'unidad', quantityPerPackage: 1, packageCost: 0, category: 'Verduras', perishable: true, priority: 'A' },
    { name: 'Cebolla', unit: 'unidad', packageUnit: 'unidad', quantityPerPackage: 1, packageCost: 0, category: 'Verduras', perishable: true, priority: 'A' },
    { name: 'Lechuga', unit: 'planta', packageUnit: 'planta', quantityPerPackage: 1, packageCost: 0, category: 'Verduras', perishable: true, priority: 'A' },
    { name: 'Papas fritas', unit: 'g', packageUnit: 'bolsa 15kg', quantityPerPackage: 15000, packageCost: 60000, category: 'Almacén', perishable: false, priority: 'A' },
    { name: 'Aceite', unit: 'ml', packageUnit: 'bidón 5L', quantityPerPackage: 5000, packageCost: 17000, category: 'Almacén', perishable: false, priority: 'B' },
    { name: 'Harina', unit: 'g', packageUnit: 'kg', quantityPerPackage: 1000, packageCost: 1200, category: 'Almacén', perishable: false, priority: 'B' },
    { name: 'Azúcar', unit: 'g', packageUnit: 'kg', quantityPerPackage: 1000, packageCost: 1200, category: 'Almacén', perishable: false, priority: 'C' },
    { name: 'Sal', unit: 'g', packageUnit: 'kg', quantityPerPackage: 1000, packageCost: 700, category: 'Almacén', perishable: false, priority: 'C' },
    { name: 'Puré de papa', unit: 'sobre', packageUnit: 'sobre', quantityPerPackage: 1, packageCost: 500, category: 'Almacén', perishable: false, priority: 'B' },
    { name: 'Levadura seca', unit: 'g', packageUnit: 'sobre 20g', quantityPerPackage: 20, packageCost: 1000, category: 'Almacén', perishable: false, priority: 'B' },
    { name: 'Mayonesa', unit: 'unidad', packageUnit: 'unidad', quantityPerPackage: 1, packageCost: 1500, category: 'Salsas', perishable: false, priority: 'B' },
    { name: 'Ketchup', unit: 'unidad', packageUnit: 'unidad', quantityPerPackage: 1, packageCost: 1500, category: 'Salsas', perishable: false, priority: 'B' },
    { name: 'Mostaza', unit: 'unidad', packageUnit: 'unidad', quantityPerPackage: 1, packageCost: 1500, category: 'Salsas', perishable: false, priority: 'B' },
    { name: 'Bolsas', unit: 'unidad', packageUnit: 'paquete x50', quantityPerPackage: 50, packageCost: 6000, category: 'Descartables', perishable: false, priority: 'C' },
    { name: 'Bandejitas papas', unit: 'unidad', packageUnit: 'paquete x100', quantityPerPackage: 100, packageCost: 6000, category: 'Descartables', perishable: false, priority: 'C' },
    { name: 'Papel aluminio', unit: 'uso', packageUnit: 'rollo', quantityPerPackage: 100, packageCost: 2000, category: 'Descartables', perishable: false, priority: 'C' }
  ];

  const ingredients = [];
  for (const data of ingredientsData) {
    const ing = new Ingredient(data);
    await ing.save();
    ingredients.push(ing);
  }
  console.log(`✅ ${ingredients.length} ingredientes creados`);

  const findIng = (name) => ingredients.find(i => i.name === name);

  // ── Stock inicial en cero (listo para cargar real) ─────────────────
  const stockData = [
    { ingredient: findIng('Carne picada'), currentStock: 0, minimumStock: 3600, unit: 'g' },
    { ingredient: findIng('Cheddar en fetas'), currentStock: 0, minimumStock: 60, unit: 'fetas' },
    { ingredient: findIng('Cheddar líquido'), currentStock: 0, minimumStock: 200, unit: 'g' },
    { ingredient: findIng('Papas fritas'), currentStock: 0, minimumStock: 6000, unit: 'g' },
    { ingredient: findIng('Huevo'), currentStock: 0, minimumStock: 5, unit: 'unidades' },
    { ingredient: findIng('Panceta'), currentStock: 0, minimumStock: 200, unit: 'g' },
    { ingredient: findIng('Harina'), currentStock: 0, minimumStock: 2600, unit: 'g' },
    { ingredient: findIng('Manteca'), currentStock: 0, minimumStock: 200, unit: 'g' },
    { ingredient: findIng('Levadura seca'), currentStock: 0, minimumStock: 20, unit: 'g' },
    { ingredient: findIng('Puré de papa'), currentStock: 0, minimumStock: 2, unit: 'sobres' },
    { ingredient: findIng('Leche en polvo'), currentStock: 0, minimumStock: 100, unit: 'g' },
    { ingredient: findIng('Azúcar'), currentStock: 0, minimumStock: 100, unit: 'g' },
    { ingredient: findIng('Sal'), currentStock: 0, minimumStock: 50, unit: 'g' },
    { ingredient: findIng('Mayonesa'), currentStock: 0, minimumStock: 1, unit: 'unidades' },
    { ingredient: findIng('Ketchup'), currentStock: 0, minimumStock: 1, unit: 'unidades' },
    { ingredient: findIng('Mostaza'), currentStock: 0, minimumStock: 1, unit: 'unidades' },
    { ingredient: findIng('Bolsas'), currentStock: 0, minimumStock: 35, unit: 'unidades' },
    { ingredient: findIng('Tomate'), currentStock: 0, minimumStock: 2, unit: 'unidades' },
    { ingredient: findIng('Cebolla'), currentStock: 0, minimumStock: 4, unit: 'unidades' },
    { ingredient: findIng('Lechuga'), currentStock: 0, minimumStock: 1, unit: 'plantas' },
    { ingredient: findIng('Aceite'), currentStock: 0, minimumStock: 500, unit: 'ml' },
    { ingredient: findIng('Bandejitas papas'), currentStock: 0, minimumStock: 35, unit: 'unidades' },
    { ingredient: findIng('Papel aluminio'), currentStock: 0, minimumStock: 35, unit: 'usos aprox' }
  ];

  for (const sd of stockData) {
    if (!sd.ingredient) continue;
    const stock = new Stock({ ingredient: sd.ingredient._id, ...sd });
    await stock.save();
  }
  console.log('✅ Stock inicial en cero cargado');

  // ── Receta de pan (costo por unidad) ──────────────────────────────
  const panRecipe = new Recipe({
    name: 'Pan Casero (x24 panes)',
    ingredients: [
      { ingredient: findIng('Harina')._id, quantity: 1300, unit: 'g' },
      { ingredient: findIng('Manteca')._id, quantity: 100, unit: 'g' },
      { ingredient: findIng('Levadura seca')._id, quantity: 10, unit: 'g' },
      { ingredient: findIng('Azúcar')._id, quantity: 50, unit: 'g' },
      { ingredient: findIng('Sal')._id, quantity: 25, unit: 'g' },
      { ingredient: findIng('Puré de papa')._id, quantity: 1, unit: 'sobre' },
      { ingredient: findIng('Leche en polvo')._id, quantity: 50, unit: 'g' },
      { ingredient: findIng('Huevo')._id, quantity: 1, unit: 'unidad' }
    ]
  });
  let panCost = 0;
  for (const ri of panRecipe.ingredients) {
    const ing = ingredients.find(i => i._id.toString() === ri.ingredient.toString());
    if (ing) panCost += (ing.costPerUnit || 0) * ri.quantity;
  }
  panRecipe.totalCost = Math.round(panCost / 24);
  await panRecipe.save();

  const papasCost = Math.round(findIng('Papas fritas').costPerUnit * 200);

  // ── Recetas base por burger (por medallón) ────────────────────────
  const baseRecipes = {
    cheeseburger: [
      { ingredient: findIng('Carne picada')._id, quantity: 110, unit: 'g' },
      { ingredient: findIng('Cheddar en fetas')._id, quantity: 2, unit: 'fetas' }
    ],
    clasicona: [
      { ingredient: findIng('Carne picada')._id, quantity: 110, unit: 'g' },
      { ingredient: findIng('Cheddar en fetas')._id, quantity: 2, unit: 'fetas' },
      { ingredient: findIng('Lechuga')._id, quantity: 0.33, unit: 'planta' },
      { ingredient: findIng('Tomate')._id, quantity: 0.25, unit: 'unidad' }
    ],
    janz: [
      { ingredient: findIng('Carne picada')._id, quantity: 110, unit: 'g' },
      { ingredient: findIng('Cheddar en fetas')._id, quantity: 2, unit: 'fetas' },
      { ingredient: findIng('Cebolla')._id, quantity: 0.25, unit: 'unidad' },
      { ingredient: findIng('Harina')._id, quantity: 30, unit: 'g' },
      { ingredient: findIng('Aceite')._id, quantity: 50, unit: 'ml' }
    ],
    cava: [
      { ingredient: findIng('Carne picada')._id, quantity: 110, unit: 'g' },
      { ingredient: findIng('Cheddar en fetas')._id, quantity: 2, unit: 'fetas' },
      { ingredient: findIng('Panceta')._id, quantity: 50, unit: 'g' },
      { ingredient: findIng('Huevo')._id, quantity: 1, unit: 'unidad' }
    ],
    smashOnion: [
      { ingredient: findIng('Carne picada')._id, quantity: 110, unit: 'g' },
      { ingredient: findIng('Cheddar en fetas')._id, quantity: 2, unit: 'fetas' },
      { ingredient: findIng('Cebolla')._id, quantity: 0.25, unit: 'unidad' }
    ]
  };

  const burgerNames = {
    cheeseburger: 'Cheeseburger',
    clasicona: 'Clasicona',
    janz: 'Janz',
    cava: 'Cava',
    smashOnion: 'Smash Onion'
  };

  const variantMultiplier = { x1: 1, x2: 2, x3: 3 };

  // Precios por defecto si no hay precio guardado
  const defaultPrices = {
    'Cheeseburger__x1': 10000, 'Cheeseburger__x2': 12000, 'Cheeseburger__x3': 14000,
    'Clasicona__x1': 11000, 'Clasicona__x2': 13000, 'Clasicona__x3': 15000,
    'Janz__x1': 11000, 'Janz__x2': 13000, 'Janz__x3': 16000,
    'Cava__x1': 13000, 'Cava__x2': 16000, 'Cava__x3': 19000,
    'Smash Onion__x1': 12000, 'Smash Onion__x2': 14000, 'Smash Onion__x3': 16000
  };

  // ── Crear recetas y productos por variante ────────────────────────
  let productCount = 0;
  for (const [key, baseIngredients] of Object.entries(baseRecipes)) {
    for (const [variant, multiplier] of Object.entries(variantMultiplier)) {
      const scaledIngredients = baseIngredients.map(ri => ({
        ...ri,
        quantity: ri.quantity * multiplier
      }));

      let cost = panRecipe.totalCost + papasCost;
      for (const ri of scaledIngredients) {
        const ing = ingredients.find(i => i._id.toString() === ri.ingredient.toString());
        if (ing) cost += (ing.costPerUnit || 0) * ri.quantity;
      }

      const recipe = new Recipe({
        name: `Receta ${burgerNames[key]} ${variant}`,
        ingredients: scaledIngredients,
        totalCost: Math.round(cost)
      });
      await recipe.save();

      const productKey = `${burgerNames[key]}__${variant}`;
      // Usar precio guardado si existe, sino el default
      const salePrice = savedPrices[productKey] || defaultPrices[productKey] || 10000;
      const totalCost = Math.round(cost);
      const profit = salePrice - totalCost;
      const margin = salePrice > 0 ? Math.round((profit / salePrice) * 100) : 0;

      const product = new Product({
        name: burgerNames[key],
        variant,
        salePrice,
        recipe: recipe._id,
        totalCost,
        profit,
        margin
      });
      await product.save();
      productCount++;
    }
  }
  console.log(`✅ ${productCount} productos recreados con precios conservados`);

  // ── Adicionales ───────────────────────────────────────────────────
  const additionalsData = [
    { name: 'Panceta extra', description: '50g de panceta crocante', price: 2500, emoji: '🥓' },
    { name: 'Huevo frito', description: 'Huevo frito a punto', price: 1500, emoji: '🍳' },
    { name: 'Cheddar extra', description: '2 fetas de cheddar', price: 1500, emoji: '🧀' },
    { name: 'Cheddar líquido', description: 'Salsa de cheddar', price: 1200, emoji: '🫕' },
    { name: 'Cebolla caramelizada', description: 'Cebolla pochada al vino', price: 1000, emoji: '🧅' },
    { name: 'Papas fritas extra', description: 'Porción adicional de papas', price: 3000, emoji: '🍟' }
  ];
  for (const ad of additionalsData) {
    await new Additional(ad).save();
  }
  console.log(`✅ ${additionalsData.length} adicionales cargados`);

  console.log('\n🎉 Reset de producción completado!');
  console.log('📦 Stock en cero — cargalo desde el panel antes de abrir');
  console.log('💰 Precios de venta conservados — modificalos desde Escandallo');
  console.log('👥 Usuarios sin cambios');

  await mongoose.disconnect();
}

resetProduction().catch(err => {
  console.error('❌ Error en reset:', err);
  process.exit(1);
});
