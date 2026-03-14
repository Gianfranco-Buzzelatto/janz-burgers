const express = require('express');
const router = express.Router();
const { Product } = require('../models/Product');
const { Client, Order } = require('../models/Order');
const Additional = require('../models/Additional');
const Coupon = require('../models/Coupon');

// Check if store is open
function isOperationalDay() {
  const today = new Date().getDay();
  const operationalDays = (process.env.OPERATIONAL_DAYS || '5,6,0')
    .split(',').map(Number);
  return operationalDays.includes(today);
}

// Get menu (public - no auth)
router.get('/menu', async (req, res) => {
  try {
    const open = isOperationalDay();
    const products = await Product.find({ active: true }).sort('name variant');
    const additionals = await Additional.find({ active: true }).sort('name');
    
    const grouped = products.reduce((acc, p) => {
      if (!acc[p.name]) acc[p.name] = [];
      acc[p.name].push({ 
        _id: p._id, 
        name: p.name, 
        variant: p.variant, 
        salePrice: p.salePrice,
        available: p.available,
        image: p.image,
        description: p.description
});
      return acc;
    }, {});

    res.json({ open, menu: grouped, additionals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Place order (public - no auth)
router.post('/order', async (req, res) => {
  try {
    if (!isOperationalDay()) {
      return res.status(403).json({ 
        message: 'Cerrado. Aceptamos pedidos los Viernes, Sábados y Domingos.' 
      });
    }

    const { client: clientData, items, paymentMethod, notes, deliveryType, couponCode } = req.body;

    // Validar cupón si se envió
    let couponDoc = null;
    let discountPercent = 0;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
      if (couponDoc) {
        // Verificar que el whatsapp no lo haya usado antes
        const alreadyUsed = couponDoc.uses.some(u => u.whatsapp === clientData.whatsapp);
        if (!alreadyUsed) {
          discountPercent = couponDoc.discountForUser;
        }
      }
    }

    // Find or create client by whatsapp
    let client = await Client.findOne({ 
      whatsapp: clientData.whatsapp, active: true 
    });
    
    if (!client) {
      client = new Client({
        name: clientData.name,
        phone: clientData.phone || clientData.whatsapp,
        whatsapp: clientData.whatsapp,
        address: clientData.address,
        floor: clientData.floor,
        neighborhood: clientData.neighborhood,
        references: clientData.references,
        notes: clientData.notes
      });
      await client.save();
    } else {
      // Update address data
      Object.assign(client, {
        address: clientData.address || client.address,
        floor: clientData.floor || client.floor,
        neighborhood: clientData.neighborhood || client.neighborhood,
        references: clientData.references || client.references
      });
      await client.save();
    }

    // Build order items with prices
    const { Product } = require('../models/Product');
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      // Resolve additionals for this item
      const resolvedAdditionals = [];
      for (const a of (item.additionals || [])) {
        const add = await Additional.findById(a.additional);
        if (!add) continue;
        resolvedAdditionals.push({
          additional: add._id,
          name: add.name,
          unitPrice: add.price,
          quantity: a.quantity || 1
        });
      }

      orderItems.push({
        product: product._id,
        productName: product.name,
        variant: product.variant,
        quantity: item.quantity,
        unitPrice: product.salePrice,
        additionals: resolvedAdditionals
      });
    }

    const order = new Order({
      client: client._id,
      items: orderItems,
      paymentMethod: paymentMethod || 'efectivo',
      deliveryType: deliveryType || 'delivery',
      deliveryAddress: `${clientData.address || ''}${clientData.floor ? ` ${clientData.floor}` : ''}${clientData.neighborhood ? `, ${clientData.neighborhood}` : ''}`,
      notes,
      coupon: couponDoc ? couponDoc._id : null,
      couponCode: couponDoc ? couponDoc.code : null,
      discountPercent,
      status: 'pending'
    });

    await order.save();
    await Client.findByIdAndUpdate(client._id, { $inc: { totalOrders: 1 } });

    // Registrar uso del cupón y acreditar recompensa al dueño
    if (couponDoc && discountPercent > 0) {
      couponDoc.uses.push({
        client: client._id,
        clientName: client.name,
        whatsapp: client.whatsapp,
        order: order._id,
        orderNumber: order.orderNumber,
        discountApplied: discountPercent
      });
      couponDoc.totalUses += 1;
      couponDoc.ownerPendingDiscount += couponDoc.rewardPerUse;
      await couponDoc.save();
    }

    res.status(201).json({
      success: true,
      orderNumber: order.orderNumber,
      total: order.total,
      discountApplied: order.discountAmount > 0 ? { percent: discountPercent, amount: order.discountAmount } : null,
      message: `¡Pedido recibido! Tu número es ${order.orderNumber}`
    });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;