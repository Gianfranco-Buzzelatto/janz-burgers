const express = require('express');
const router = express.Router();
const { Order, Client } = require('../models/Order');
const { Product, Recipe } = require('../models/Product');
const Ingredient = require('../models/Ingredient');
const { auth } = require('../middleware/auth');

// Dashboard stats principales
router.get('/', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayOrders, weekOrders, monthOrders, pendingOrders, recentOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: today, $lt: tomorrow }, status: { $ne: 'cancelled' } }),
      Order.find({ createdAt: { $gte: startOfWeek }, status: { $ne: 'cancelled' } }),
      Order.find({ createdAt: { $gte: startOfMonth }, status: { $ne: 'cancelled' } }),
      Order.find({ status: { $in: ['pending', 'confirmed', 'preparing'] } })
        .populate('client', 'name phone whatsapp').sort({ createdAt: -1 }).limit(10),
      Order.find().populate('client', 'name').sort({ createdAt: -1 }).limit(5)
    ]);

    const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0);
    const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);
    const avgTicket = monthOrders.length > 0 ? Math.round(monthRevenue / monthOrders.length) : 0;

    res.json({
      today: {
        orders: todayOrders.length,
        revenue: todayRevenue,
        confirmed: todayOrders.filter(o => o.status === 'confirmed').length
      },
      week: { orders: weekOrders.length, revenue: weekRevenue },
      month: { orders: monthOrders.length, revenue: monthRevenue, avgTicket },
      pending: pendingOrders,
      recent: recentOrders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sales stats con ranking + consumo de insumos + top clientes
router.get('/sales', auth, async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year) || new Date().getFullYear();

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    }).populate('client', 'name whatsapp totalOrders').populate('items.product');

    // ── Ranking de burgers más vendidas ───────────────────────────────
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = `${item.productName || ''} ${item.variant || ''}`.trim();
        if (!productSales[key]) productSales[key] = { name: key, units: 0, revenue: 0 };
        productSales[key].units += item.quantity;
        productSales[key].revenue += item.subtotal || 0;
      });
    });
    const top5 = Object.values(productSales).sort((a, b) => b.units - a.units).slice(0, 5);

    // ── Consumo de insumos del mes ────────────────────────────────────
    const ingredientUsage = {};
    for (const order of orders) {
      for (const item of order.items) {
        // Buscar el producto con receta poblada
        const product = await Product.findOne({
          name: item.productName,
          variant: item.variant
        }).populate({ path: 'recipe', populate: { path: 'ingredients.ingredient' } });

        if (!product?.recipe?.ingredients) continue;
        for (const ri of product.recipe.ingredients) {
          if (!ri.ingredient) continue;
          const ingName = ri.ingredient.name;
          const ingUnit = ri.unit;
          if (!ingredientUsage[ingName]) {
            ingredientUsage[ingName] = { name: ingName, unit: ingUnit, quantity: 0 };
          }
          ingredientUsage[ingName].quantity += ri.quantity * item.quantity;
        }
      }
    }
    const ingredientUsageList = Object.values(ingredientUsage)
      .sort((a, b) => b.quantity - a.quantity)
      .map(i => ({ ...i, quantity: Math.round(i.quantity * 100) / 100 }));

    // ── Clientes nuevos vs recurrentes ────────────────────────────────
    const clientsThisMonth = new Set();
    const clientOrderCount = {};
    orders.forEach(order => {
      if (!order.client) return;
      const cid = order.client._id.toString();
      clientsThisMonth.add(cid);
      clientOrderCount[cid] = (clientOrderCount[cid] || 0) + 1;
    });

    const allClients = await Client.find({ _id: { $in: [...clientsThisMonth] } }).sort('-totalOrders').limit(10);
    const newClients = allClients.filter(c => c.totalOrders <= 1).length;
    const recurringClients = allClients.length - newClients;

    const topBuyers = allClients.slice(0, 5).map(c => ({
      name: c.name,
      whatsapp: c.whatsapp,
      totalOrders: c.totalOrders,
      ordersThisMonth: clientOrderCount[c._id.toString()] || 0
    }));

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const avgTicket = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    res.json({
      orders: orders.length,
      totalRevenue,
      avgTicket,
      top5,
      productSales: Object.values(productSales).sort((a, b) => b.units - a.units),
      ingredientUsage: ingredientUsageList,
      clients: { total: allClients.length, new: newClients, recurring: recurringClients, topBuyers }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
