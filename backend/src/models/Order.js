const mongoose = require('mongoose');

// Client schema
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  whatsapp: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  address: { type: String },
  floor: { type: String }, // piso/depto
  neighborhood: { type: String }, // barrio
  references: { type: String }, // referencias (portón verde, timbre 2B...)
  notes: { type: String },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Additional sub-schema within an order item
const orderItemAdditionalSchema = new mongoose.Schema({
  additional: { type: mongoose.Schema.Types.ObjectId, ref: 'Additional', required: true },
  name: { type: String },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, default: 1 }
}, { _id: false });

// Order item sub-schema
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String },
  variant: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true },
  additionals: [orderItemAdditionalSchema], // toppings extras por ítem
  subtotal: { type: Number },
  notes: { type: String } // e.g. "sin cheddar"
}, { _id: false });

// Order schema
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  items: [orderItemSchema],
  additionals: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['efectivo', 'transferencia', 'mercadopago'],
    default: 'efectivo'
  },
  deliveryType: {
    type: String,
    enum: ['local', 'delivery', 'takeaway'],
    default: 'local'
  },
  deliveryAddress: { type: String },
  notes: { type: String },
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  couponCode: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  stockDeducted: { type: Boolean, default: false }, // track if stock was already deducted
  whatsappSent: { type: Boolean, default: false },
  confirmedAt: { type: Date },
  deliveredAt: { type: Date }
}, { timestamps: true });

// Auto-generate order number and calculate total
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `JANZ-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate item subtotals and total
  let total = 0;
  this.items.forEach(item => {
    const additionalsTotal = (item.additionals || []).reduce(
      (s, a) => s + (a.unitPrice * (a.quantity || 1)), 0
    );
    item.subtotal = (item.unitPrice * item.quantity) + additionalsTotal;
    total += item.subtotal;
  });
  const subtotal = total + (this.additionals || 0);
  // Aplicar descuento de cupón
  if (this.discountPercent > 0) {
    this.discountAmount = Math.round(subtotal * this.discountPercent / 100);
  }
  this.total = Math.max(0, subtotal - (this.discountAmount || 0));
  
  next();
});

const Client = mongoose.model('Client', clientSchema);
const Order = mongoose.model('Order', orderSchema);

module.exports = { Client, Order };
