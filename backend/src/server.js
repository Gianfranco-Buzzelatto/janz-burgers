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
app.use('/api/additionals', require('./routes/additionals'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/config', require('./routes/config'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/public', require('./routes/public'));
app.get('/api/whatsapp/qr', async (req, res) => {
  const qr = getCurrentQR();
  if (!qr) return res.json({ message: 'QR no disponible aún' });
  const qrImage = await QRCode.toDataURL(qr);
  res.json({ qr: qrImage });
});
app.get('/api/whatsapp/qr-view', async (req, res) => {
  const qr = getCurrentQR();
  if (!qr) {
    return res.send(`
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Janz Burgers — WhatsApp QR</title>
          <meta http-equiv="refresh" content="5">
          <style>
            body { background: #0a0a0a; color: white; font-family: Inter, sans-serif;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
            .spinner { width: 48px; height: 48px; border: 4px solid #333;
              border-top-color: #E8B84B; border-radius: 50%;
              animation: spin 0.8s linear infinite; margin-bottom: 24px; }
            @keyframes spin { to { transform: rotate(360deg); } }
            h2 { font-size: 1.4rem; color: #E8B84B; margin-bottom: 8px; }
            p { color: #888; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>Iniciando WhatsApp...</h2>
          <p>Esta página se actualiza sola cada 5 segundos.</p>
          <p style="margin-top:8px;font-size:0.8rem;color:#555">Puede tardar hasta 60 segundos la primera vez.</p>
        </body>
      </html>
    `);
  }
  const qrImage = await QRCode.toDataURL(qr, { width: 400, margin: 2 });
  res.send(`
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Janz Burgers — Escanear QR</title>
        <style>
          body { background: #0a0a0a; color: white; font-family: Inter, sans-serif;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
          h1 { font-size: 2rem; color: #E8B84B; margin-bottom: 6px; letter-spacing: 0.1em; }
          p { color: #888; font-size: 0.9rem; margin-bottom: 24px; }
          .qr-wrap { background: white; padding: 20px; border-radius: 16px; display: inline-block; }
          img { display: block; width: 300px; height: 300px; }
          .note { margin-top: 20px; color: #555; font-size: 0.8rem; }
        </style>
      </head>
      <body>
        <h1>🍔 JANZ BURGERS</h1>
        <p>Escaneá este QR con WhatsApp para vincular el número</p>
        <div class="qr-wrap">
          <img src="${qrImage}" alt="WhatsApp QR" />
        </div>
        <p class="note">El QR expira en ~20 segundos. Si venció, recargá la página.</p>
      </body>
    </html>
  `);
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
