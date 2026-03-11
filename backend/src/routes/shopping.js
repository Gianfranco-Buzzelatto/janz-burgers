const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { generateShoppingList } = require('../services/stock.service');

// Get prioritized shopping list
router.get('/', auth, async (req, res) => {
  try {
    const list = await generateShoppingList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
