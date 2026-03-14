const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

let client = null;
let isReady = false;
let currentQR = null;
function getCurrentQR() {
  return currentQR;
}

function initWhatsApp() {
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: './whatsapp-session' }),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  client.on('qr', (qr) => {
    currentQR = qr;
    console.log('\n📱 QR generado, escanealo en /api/whatsapp/qr\n');
    qrcode.generate(qr, { small: true });
});

  client.on('ready', () => {
    isReady = true;
    console.log('✅ WhatsApp conectado y listo para enviar mensajes');
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    console.log('⚠️ WhatsApp desconectado:', reason);
    setTimeout(initWhatsApp, 5000);
  });

  client.on('auth_failure', () => {
    isReady = false;
    console.log('❌ Error de autenticación WhatsApp');
  });

  client.initialize().catch(err => {
    console.error('❌ Error iniciando WhatsApp:', err.message);
  });
}

initWhatsApp();

async function sendOrderConfirmation(phoneNumber, orderNumber, clientName, total, items) {
  if (!isReady || !client) {
    console.warn('⚠️ WhatsApp no está conectado todavía');
    return { success: false, reason: 'WhatsApp no conectado' };
  }

  try {
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith('1115')) cleanPhone = '11' + cleanPhone.substring(4);
    let fullPhone = cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`;
// Argentina: agregar 9 después del 54 si no lo tiene (54 9 11 XXXX)
if (fullPhone.startsWith('54') && !fullPhone.startsWith('549')) {
  fullPhone = '549' + fullPhone.substring(2);
}

    const chatId = `${fullPhone}@c.us`;
console.log('Intentando enviar a chatId:', chatId);
const itemsList = items.map(i => `  • ${i.productName} ${i.variant} ×${i.quantity} — $${Number(i.unitPrice * i.quantity).toLocaleString('es-AR')}`).join('\n');

const message = `¡Hola ${clientName}! 👋\n\nTu pedido *${orderNumber}* ha sido confirmado por nuestra cocina y ya está en marcha. 🍔\n\n*Detalle:*\n${itemsList}\n\n💰 *Total: $${Number(total).toLocaleString('es-AR')}*\n\n_Gracias por elegirnos — Janz Burgers_ 🔥`;

    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      console.warn(`⚠️ El número ${fullPhone} no está registrado en WhatsApp`);
      return { success: false, reason: 'Número no registrado en WhatsApp' };
    }

    await client.sendMessage(chatId, message);

    console.log(`✅ WhatsApp enviado a ${fullPhone} - Pedido ${orderNumber}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendOrderReady(phoneNumber, orderNumber, clientName, deliveryType = 'delivery') {
  if (!isReady || !client) {
    console.warn('⚠️ WhatsApp no está conectado todavía');
    return { success: false, reason: 'WhatsApp no conectado' };
  }

  try {
    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
    if (cleanPhone.startsWith('1115')) cleanPhone = '11' + cleanPhone.substring(4);
    let fullPhone = cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`;
    if (fullPhone.startsWith('54') && !fullPhone.startsWith('549')) {
      fullPhone = '549' + fullPhone.substring(2);
    }

    const chatId = `${fullPhone}@c.us`;

    const message = deliveryType === 'takeaway'
      ? `¡Hola ${clientName}! 🥡\n\nTu pedido *${orderNumber}* está *listo para retirar*. ✅\n\nPodés pasar a buscarlo cuando quieras. Te esperamos! 😊\n\n_Gracias por elegirnos — Janz Burgers_ 🔥`
      : `¡Hola ${clientName}! 🛵\n\nTu pedido *${orderNumber}* está *listo y en camino*. ✅\n\nEn instantes llega a tu puerta. ¡Gracias por la espera!\n\n_Janz Burgers_ 🍔🔥`;

    const isRegistered = await client.isRegisteredUser(chatId);
    if (!isRegistered) {
      console.warn(`⚠️ El número ${fullPhone} no está registrado en WhatsApp`);
      return { success: false, reason: 'Número no registrado en WhatsApp' };
    }

    await client.sendMessage(chatId, message);
    console.log(`✅ WhatsApp "listo" (${deliveryType}) enviado a ${fullPhone} - Pedido ${orderNumber}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error enviando WhatsApp:', error.message);
    return { success: false, error: error.message };
  }
}

function getWhatsAppStatus() {
  return { connected: isReady };
}

module.exports = { sendOrderConfirmation, sendOrderReady, getWhatsAppStatus, getCurrentQR };