require('dotenv').config();
const mongoose = require('mongoose');
const Ingredient = require('../models/Ingredient');
const Stock = require('../models/Stock');
const { Recipe, Product } = require('../models/Product');
const { Client } = require('../models/Order');
const User = require('../models/User');
const Additional = require('../models/Additional');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/janzburgers';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB...');

  // Clear existing data
  await Promise.all([
    Ingredient.deleteMany({}),
    Stock.deleteMany({}),
    Recipe.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
    Additional.deleteMany({})
  ]);

  // Create admin user
  const admin = new User({
    name: 'Admin Janz',
    email: 'admin@janzburgers.com',
    password: 'janz2024',
    role: 'admin'
  });
  await admin.save();

  const kitchen = new User({
    name: 'Cocina',
    email: 'cocina@janzburgers.com',
    password: 'cocina2024',
    role: 'kitchen'
  });
  await kitchen.save();

  console.log('✅ Usuarios creados');

  // Create ingredients from Excel data
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

  // Helper to find ingredient by name
  const findIng = (name) => ingredients.find(i => i.name === name);

  // Create stock from Excel data
  const stockData = [
    { ingredient: findIng('Carne picada'), currentStock: 0, minimumStock: 3600, unit: 'g' },
    { ingredient: findIng('Cheddar en fetas'), currentStock: 0, minimumStock: 60, unit: 'fetas' },
    { ingredient: findIng('Cheddar líquido'), currentStock: 0, minimumStock: 200, unit: 'g' },
    { ingredient: findIng('Papas fritas'), currentStock: 2000, minimumStock: 6000, unit: 'g' },
    { ingredient: findIng('Huevo'), currentStock: 30, minimumStock: 5, unit: 'unidades' },
    { ingredient: findIng('Panceta'), currentStock: 0, minimumStock: 200, unit: 'g' },
    { ingredient: findIng('Harina'), currentStock: 3000, minimumStock: 2600, unit: 'g' },
    { ingredient: findIng('Manteca'), currentStock: 300, minimumStock: 200, unit: 'g' },
    { ingredient: findIng('Levadura seca'), currentStock: 30, minimumStock: 20, unit: 'g' },
    { ingredient: findIng('Puré de papa'), currentStock: 2, minimumStock: 2, unit: 'sobres' },
    { ingredient: findIng('Leche en polvo'), currentStock: 400, minimumStock: 100, unit: 'g' },
    { ingredient: findIng('Azúcar'), currentStock: 400, minimumStock: 100, unit: 'g' },
    { ingredient: findIng('Sal'), currentStock: 0, minimumStock: 50, unit: 'g' },
    { ingredient: findIng('Mayonesa'), currentStock: 1, minimumStock: 1, unit: 'unidades' },
    { ingredient: findIng('Ketchup'), currentStock: 0, minimumStock: 1, unit: 'unidades' },
    { ingredient: findIng('Mostaza'), currentStock: 1, minimumStock: 1, unit: 'unidades' },
    { ingredient: findIng('Bolsas'), currentStock: 80, minimumStock: 35, unit: 'unidades' },
    { ingredient: findIng('Tomate'), currentStock: 1, minimumStock: 2, unit: 'unidades' },
    { ingredient: findIng('Cebolla'), currentStock: 1, minimumStock: 4, unit: 'unidades' },
    { ingredient: findIng('Lechuga'), currentStock: 1, minimumStock: 1, unit: 'plantas' },
    { ingredient: findIng('Aceite'), currentStock: 0, minimumStock: 500, unit: 'ml' },
    { ingredient: findIng('Bandejitas papas'), currentStock: 80, minimumStock: 35, unit: 'unidades' },
    { ingredient: findIng('Papel aluminio'), currentStock: 80, minimumStock: 35, unit: 'usos aprox' }
  ];

  for (const sd of stockData) {
    if (!sd.ingredient) continue;
    const stock = new Stock({ ingredient: sd.ingredient._id, ...sd });
    await stock.save();
  }
  console.log('✅ Stock inicial cargado');

  // Create bread recipe (pan casero for all burgers)
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
  // Calculate bread cost
  let panCost = 0;
  for (const ri of panRecipe.ingredients) {
    const ing = ingredients.find(i => i._id.toString() === ri.ingredient.toString());
    if (ing) panCost += (ing.costPerUnit || 0) * ri.quantity;
  }
  panRecipe.totalCost = Math.round(panCost / 24); // cost per bun
  await panRecipe.save();

  // Create product recipes
  const papasCost = Math.round(findIng('Papas fritas').costPerUnit * 200);
  
  // Helper: build recipe ingredients multiplied by number of patties
  // variants: x1=1 medallón, x2=2 medallones, x3=3 medallones
  const variantMultiplier = { x1: 1, x2: 2, x3: 3 };

  // Base recipe definitions (per single patty)
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

  // Create one recipe per burger per variant (x1, x2, x3)
  const createdRecipes = {};
  for (const [key, baseIngredients] of Object.entries(baseRecipes)) {
    createdRecipes[key] = {};
    for (const [variant, multiplier] of Object.entries(variantMultiplier)) {
      // Multiply each ingredient quantity by the number of patties
      const scaledIngredients = baseIngredients.map(ri => ({
        ...ri,
        quantity: ri.quantity * multiplier
      }));

      let cost = panRecipe.totalCost + papasCost; // pan + papas: fixed per order
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
      createdRecipes[key][variant] = recipe;
    }
  }

  // Create products from Excel pricing — each variant linked to its own recipe
  const productsData = [
    // Cheeseburger
    { name: 'Cheeseburger', variant: 'x1', salePrice: 10000, recipe: createdRecipes.cheeseburger.x1._id },
    { name: 'Cheeseburger', variant: 'x2', salePrice: 12000, recipe: createdRecipes.cheeseburger.x2._id },
    { name: 'Cheeseburger', variant: 'x3', salePrice: 14000, recipe: createdRecipes.cheeseburger.x3._id },
    // Clasicona
    { name: 'Clasicona', variant: 'x1', salePrice: 11000, recipe: createdRecipes.clasicona.x1._id },
    { name: 'Clasicona', variant: 'x2', salePrice: 13000, recipe: createdRecipes.clasicona.x2._id },
    { name: 'Clasicona', variant: 'x3', salePrice: 15000, recipe: createdRecipes.clasicona.x3._id },
    // Janz
    { name: 'Janz', variant: 'x1', salePrice: 11000, recipe: createdRecipes.janz.x1._id },
    { name: 'Janz', variant: 'x2', salePrice: 13000, recipe: createdRecipes.janz.x2._id },
    { name: 'Janz', variant: 'x3', salePrice: 16000, recipe: createdRecipes.janz.x3._id },
    // Cava
    { name: 'Cava', variant: 'x1', salePrice: 13000, recipe: createdRecipes.cava.x1._id },
    { name: 'Cava', variant: 'x2', salePrice: 16000, recipe: createdRecipes.cava.x2._id },
    { name: 'Cava', variant: 'x3', salePrice: 19000, recipe: createdRecipes.cava.x3._id },
    // Smash Onion
    { name: 'Smash Onion', variant: 'x1', salePrice: 12000, recipe: createdRecipes.smashOnion.x1._id },
    { name: 'Smash Onion', variant: 'x2', salePrice: 14000, recipe: createdRecipes.smashOnion.x2._id },
    { name: 'Smash Onion', variant: 'x3', salePrice: 16000, recipe: createdRecipes.smashOnion.x3._id }
  ];

  for (const pd of productsData) {
    const recipe = await Recipe.findById(pd.recipe);
    const totalCost = recipe ? recipe.totalCost : 0;
    const profit = pd.salePrice - totalCost;
    const margin = pd.salePrice > 0 ? Math.round((profit / pd.salePrice) * 100) : 0;
    
    const product = new Product({ ...pd, totalCost, profit, margin });
    await product.save();
  }

  console.log(`✅ ${productsData.length} productos creados`);

  // Create additional toppings
  const additionalsData = [
    { name: 'Panceta extra', description: '50g de panceta crocante', price: 2500, emoji: '🥓' },
    { name: 'Huevo frito', description: 'Huevo frito a punto', price: 1500, emoji: '🍳' },
    { name: 'Cheddar extra', description: '2 fetas de cheddar', price: 1500, emoji: '🧀' },
    { name: 'Cheddar líquido', description: 'Salsa de cheddar', price: 1200, emoji: '🫕' },
    { name: 'Cebolla caramelizada', description: 'Cebolla pochada al vino', price: 1000, emoji: '🧅' },
    { name: 'Papas fritas extra', description: 'Porción adicional de papas', price: 3000, emoji: '🍟' }
  ];

  for (const ad of additionalsData) {
    const additional = new Additional(ad);
    await additional.save();
  }
  console.log(`✅ ${additionalsData.length} adicionales creados`);

  console.log('\n🎉 Base de datos inicializada exitosamente!');
  console.log('\n📧 Usuarios:');
  console.log('  Admin: admin@janzburgers.com / janz2024');
  console.log('  Cocina: cocina@janzburgers.com / cocina2024');
  
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});
