const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { Client } = require('../models/Order');
const { auth, adminOnly } = require('../middleware/auth');

// GET todos los cupones
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().populate('owner', 'name whatsapp').sort('-createdAt');
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST crear cupón
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { code, ownerId, discountForUser, rewardPerUse } = req.body;
    const owner = await Client.findById(ownerId);
    if (!owner) return res.status(404).json({ message: 'Cliente no encontrado' });

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.status(400).json({ message: 'Ya existe un cupón con ese código' });

    const coupon = new Coupon({
      code: code.toUpperCase(),
      owner: owner._id,
      ownerName: owner.name,
      discountForUser: discountForUser || 10,
      rewardPerUse: rewardPerUse || 5
    });
    await coupon.save();
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT actualizar cupón
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ message: 'Cupón no encontrado' });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE (soft delete)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Cupón desactivado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST validar cupón (público - desde /pedido)
router.post('/validate', async (req, res) => {
  try {
    const { code, whatsapp } = req.body;
    if (!code || !whatsapp) return res.status(400).json({ message: 'Código y WhatsApp requeridos' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ message: 'Cupón inválido o inactivo' });

    // Verificar que el mismo WhatsApp no lo haya usado antes
    const alreadyUsed = coupon.uses.some(u => u.whatsapp === whatsapp);
    if (alreadyUsed) return res.status(400).json({ message: 'Ya usaste este cupón anteriormente' });

    res.json({
      valid: true,
      code: coupon.code,
      discountPercent: coupon.discountForUser,
      ownerName: coupon.ownerName,
      message: `¡Cupón válido! Tenés ${coupon.discountForUser}% de descuento 🎉`
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
