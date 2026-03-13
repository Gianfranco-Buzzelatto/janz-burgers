const express = require('express');
const router = express.Router();
const { Order } = require('../models/Order');
const { Client } = require('../models/Order');
const { auth, kitchenOrAdmin } = require('../middleware/auth');
const { deductStockForOrder } = require('../services/stock.service');
const { sendOrderConfirmation, sendOrderReady } = require('../services/whatsapp');

// Check if today is operational day (Fri=5, Sat=6, Sun=0)
function isOperationalDay() {
  const today = new Date().getDay();
  const operationalDays = (process.env.OPERATIONAL_DAYS || '5,6,0')
    .split(',').map(Number);
  return operationalDays.includes(today);
}

// Get all orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, date, limit = 50 } = req.query;
    const filter = {};
if (status) {
  const statuses = status.split(',').map(s => s.trim());
  filter.status = statuses.length > 1 ? { $in: statuses } : status;
}
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(filter)
      .populate('client', 'name phone whatsapp')
      .populate('items.product', 'name variant salePrice')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client')
      .populate('items.product');
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create order - check operational day for client-facing orders
router.post('/', auth, async (req, res) => {
  try {
    const { bypassOperationalCheck } = req.body;
    
    // Admin can always create orders; non-admin must respect schedule
    if (req.user.role !== 'admin' && !bypassOperationalCheck && !isOperationalDay()) {
      return res.status(403).json({
        message: 'Cerrado. Solo aceptamos pedidos los Viernes, Sábados y Domingos.',
        closed: true
      });
    }

    const order = new Order(req.body);
    await order.save();

    // Update client stats
    await Client.findByIdAndUpdate(req.body.client, {
      $inc: { totalOrders: 1 }
    });

    const populated = await Order.findById(order._id)
      .populate('client', 'name phone whatsapp')
      .populate('items.product', 'name variant');

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order status - KEY BUSINESS LOGIC
router.put('/:id/status', auth, kitchenOrAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('client')
      .populate('items.product');

    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    const prevStatus = order.status;
    order.status = status;

    let stockResults = [];
    let whatsappResult = null;

    // BUSINESS RULE: Only deduct stock when kitchen confirms (moves to 'confirmed')
    if (status === 'confirmed' && prevStatus === 'pending' && !order.stockDeducted) {
      stockResults = await deductStockForOrder(order.items);
      order.stockDeducted = true;
      order.confirmedAt = new Date();

      // Send WhatsApp notification
      if (order.client && order.client.whatsapp) {
        whatsappResult = await sendOrderConfirmation(
          order.client.whatsapp,
          order.orderNumber,
          order.client.name,
          order.total,
          order.items
        );
        order.whatsappSent = whatsappResult.success;
      }
    }

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      // Update client total spent
      await Client.findByIdAndUpdate(order.client._id, {
        $inc: { totalSpent: order.total }
      });
    }

    // Notify client when order is ready for pickup/delivery
    if (status === 'ready' && prevStatus !== 'ready' && order.client?.whatsapp) {
      sendOrderReady(
        order.client.whatsapp,
        order.orderNumber,
        order.client.name,
        order.deliveryType
      ).catch(err => console.error('Error enviando WhatsApp ready:', err.message));
    }

    await order.save();

    res.json({
      order,
      stockDeducted: stockResults,
      whatsappSent: whatsappResult
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update order (general)
router.put('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('client', 'name phone whatsapp')
      .populate('items.product');
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Check if store is open
router.get('/system/status', (req, res) => {
  const open = isOperationalDay();
  const today = new Date().getDay();
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  res.json({
    open,
    today: days[today],
    message: open
      ? '🟢 Estamos abiertos. ¡Hacé tu pedido!'
      : '🔴 Cerrado. Abrimos los Viernes, Sábados y Domingos.'
  });
});

module.exports = router;
