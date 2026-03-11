const express = require('express');
const router = express.Router();
const { Order } = require('../models/Order');
const { auth } = require('../middleware/auth');

// Dashboard stats
router.get('/', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Start of current week (Friday)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      weekOrders,
      pendingOrders,
      recentOrders
    ] = await Promise.all([
      Order.find({ createdAt: { $gte: today, $lt: tomorrow } }),
      Order.find({ createdAt: { $gte: startOfWeek } }),
      Order.find({ status: { $in: ['pending', 'confirmed', 'preparing'] } })
        .populate('client', 'name phone')
        .sort({ createdAt: -1 })
        .limit(10),
      Order.find()
        .populate('client', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
    const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0);

    res.json({
      today: {
        orders: todayOrders.length,
        revenue: todayRevenue,
        confirmed: todayOrders.filter(o => o.status === 'confirmed').length
      },
      week: {
        orders: weekOrders.length,
        revenue: weekRevenue
      },
      pending: pendingOrders,
      recent: recentOrders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Sales stats
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
    }).populate('items.product', 'name variant');

    // Aggregate by product
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const key = `${item.productName || 'Unknown'} ${item.variant || ''}`.trim();
        if (!productSales[key]) productSales[key] = { name: key, units: 0, revenue: 0 };
        productSales[key].units += item.quantity;
        productSales[key].revenue += item.subtotal;
      });
    });

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

    res.json({
      orders: orders.length,
      totalRevenue,
      productSales: Object.values(productSales).sort((a, b) => b.units - a.units)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
