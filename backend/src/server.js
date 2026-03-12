const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const QRCode = require('qrcode');
const { getCurrentQR } = require('./services/whatsapp');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/janzburgers')
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/shopping', require('./routes/shopping'));
app.use('/api/public', require('./routes/public'));
app.get('/api/whatsapp/qr', async (req, res) => {
  const qr = getCurrentQR();
  if (!qr) return res.json({ message: 'QR no disponible aún' });
  const qrImage = await QRCode.toDataURL(qr);
  res.json({ qr: qrImage });
});
app.get('/api/whatsapp/qr-view', async (req, res) => {
  const qr = getCurrentQR();
  if (!qr) return res.send('<h2>QR no disponible aún, esperá unos segundos y recargá</h2>');
  const qrImage = await QRCode.toDataURL(qr);
  res.send(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000"><img src="${qrImage}" /></body></html>`);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '🍔 Janz Burgers API running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
