import { useState, useEffect } from 'react';
import { Instagram } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import logoJanz from '../assets/logo-janz.png';
import heroBurger from '../assets/hero-burger.png';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;

function itemTotal(item) {
  const base = item.unitPrice * item.quantity;
  const extras = (item.additionals || []).reduce((s, a) => s + a.unitPrice * (a.quantity || 1), 0);
  return base + extras;
}

function AdditionalsModal({ product, availableAdditionals, onConfirm, onClose }) {
  const [selected, setSelected] = useState({});

  const toggle = (add) => {
    setSelected(prev => {
      if (prev[add._id]) { const next = { ...prev }; delete next[add._id]; return next; }
      return { ...prev, [add._id]: 1 };
    });
  };

  const changeQty = (addId, delta) => {
    setSelected(prev => {
      const newQty = (prev[addId] || 1) + delta;
      if (newQty <= 0) { const next = { ...prev }; delete next[addId]; return next; }
      return { ...prev, [addId]: newQty };
    });
  };

  const extraTotal = availableAdditionals.reduce((s, a) => selected[a._id] ? s + a.price * selected[a._id] : s, 0);

  const handleConfirm = () => {
    const additionals = availableAdditionals
      .filter(a => selected[a._id])
      .map(a => ({ additional: a._id, name: a.name, unitPrice: a.price, quantity: selected[a._id] }));
    onConfirm(additionals);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#111', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', color: 'white', marginBottom: 4 }}>
          {product.name} <span style={{ color: '#E8B84B' }}>{product.variant}</span>
        </div>
        <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 20 }}>Agregá extras a esta hamburguesa</div>
        {availableAdditionals.map(add => {
          const qty = selected[add._id] || 0;
          return (
            <div key={add._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: qty > 0 ? 'rgba(232,184,75,0.08)' : '#1a1a1a', border: `1px solid ${qty > 0 ? '#E8B84B' : '#2a2a2a'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: 600 }}>{add.emoji} {add.name}</div>
                {add.description && <div style={{ color: '#666', fontSize: '0.78rem', marginTop: 2 }}>{add.description}</div>}
                <div style={{ color: '#E8B84B', fontWeight: 700, fontSize: '0.9rem', marginTop: 4 }}>{fmt(add.price)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {qty > 0 ? (
                  <>
                    <button onClick={() => changeQty(add._id, -1)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#333', border: 'none', color: 'white', fontSize: '1.1rem', cursor: 'pointer' }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 18, textAlign: 'center', color: 'white' }}>{qty}</span>
                    <button onClick={() => changeQty(add._id, 1)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#E8B84B', border: 'none', color: '#000', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 700 }}>+</button>
                  </>
                ) : (
                  <button onClick={() => toggle(add)} style={{ background: '#2a2a2a', color: '#E8B84B', border: '1px solid #E8B84B', padding: '6px 14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>+ Agregar</button>
                )}
              </div>
            </div>
          );
        })}
        <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 16, marginTop: 8 }}>
          {extraTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.85rem', marginBottom: 8 }}>
              <span>Extras</span><span style={{ color: '#E8B84B' }}>+ {fmt(extraTotal)}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: '#2a2a2a', color: '#aaa', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={handleConfirm} style={{ flex: 2, background: '#E8B84B', color: '#000', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              Confirmar {extraTotal > 0 ? `(+ ${fmt(extraTotal)})` : 'sin extras'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicOrder() {
  const [menu, setMenu] = useState({});
  const [availableAdditionals, setAvailableAdditionals] = useState([]);
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState('menu');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [additionalsModal, setAdditionalsModal] = useState(null);
  const [client, setClient] = useState({ name: '', whatsapp: '', address: '', floor: '', neighborhood: '', references: '', notes: '' });
  const [paymentMethod, setPaymentMethod] = useState('');
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    API.get('/public/menu').then(r => {
      setMenu(r.data.menu);
      setOpen(r.data.open);
      setAvailableAdditionals(r.data.additionals || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (product) => {
    const existing = cart.find(i => i.product === product._id);
    if (existing) {
      setCart(c => c.map(i => i.product === product._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (availableAdditionals.length > 0) {
        setAdditionalsModal(product);
      } else {
        addProductToCart(product, []);
      }
    }
  };

  const addProductToCart = (product, additionals) => {
    setCart(c => [...c, { product: product._id, productName: product.name, variant: product.variant, quantity: 1, unitPrice: product.salePrice, additionals }]);
  };

  const handleAdditionalsConfirm = (additionals) => {
    addProductToCart(additionalsModal, additionals);
    setAdditionalsModal(null);
  };

  const removeFromCart = (productId) => {
    const existing = cart.find(i => i.product === productId);
    if (existing?.quantity === 1) {
      setCart(c => c.filter(i => i.product !== productId));
    } else {
      setCart(c => c.map(i => i.product === productId ? { ...i, quantity: i.quantity - 1 } : i));
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!client.whatsapp) { setCouponStatus({ valid: false, message: 'Ingresá tu WhatsApp primero' }); return; }
    setValidatingCoupon(true);
    try {
      const res = await API.post('/coupons/validate', { code: couponCode.trim(), whatsapp: client.whatsapp });
      setCouponStatus({ valid: true, discountPercent: res.data.discountPercent, message: res.data.message });
    } catch (e) {
      setCouponStatus({ valid: false, message: e.response?.data?.message || 'Cupón inválido' });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const total = cart.reduce((s, i) => s + itemTotal(i), 0);
  const discount = couponStatus?.valid ? Math.round(total * couponStatus.discountPercent / 100) : 0;
  const totalWithDiscount = total - discount;

  const handleSubmit = async () => {
    if (!client.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!client.whatsapp.trim()) { toast.error('El WhatsApp es obligatorio'); return; }
    if (deliveryType === 'delivery' && !client.address.trim()) { toast.error('La dirección es obligatoria para delivery'); return; }
    if (!paymentMethod) { toast.error('Seleccioná un método de pago'); return; }
    if (cart.length === 0) { toast.error('Tu carrito está vacío'); return; }

    setSubmitting(true);
    try {
      const res = await API.post('/public/order', {
        client, items: cart.map(i => ({
          product: i.product, quantity: i.quantity,
          additionals: (i.additionals || []).map(a => ({ additional: a.additional, quantity: a.quantity }))
        })),
        deliveryType, paymentMethod, notes: client.notes,
        couponCode: couponStatus?.valid ? couponCode.trim() : null
      });
      setOrderResult(res.data);
      setStep('success');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al enviar el pedido');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'white', padding: '11px 14px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E8B84B', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  // ── ÉXITO ───────────────────────────────────────────────────────────
  if (step === 'success' && orderResult) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <img src={logoJanz} alt="Janz" style={{ height: 70, objectFit: 'contain', marginBottom: 24 }} />
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>🎉</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '2.5rem', color: '#E8B84B', marginBottom: 8 }}>¡Pedido Recibido!</div>
          <div style={{ color: '#aaa', marginBottom: 16 }}>Tu número de pedido es</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '3rem', color: 'white', background: '#1a1a1a', borderRadius: 12, padding: '16px 32px', marginBottom: 16, border: '1px solid #333' }}>{orderResult.orderNumber}</div>
          {orderResult.discountApplied && (
            <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 12 }}>🎟️ Descuento aplicado: {fmt(orderResult.discountApplied.amount)}</div>
          )}
          <div style={{ fontSize: '1.3rem', color: '#E8B84B', fontWeight: 700, marginBottom: 24 }}>Total: {fmt(orderResult.total)}</div>
          <div style={{ color: '#555', fontSize: '0.85rem', marginBottom: 32 }}>Te avisamos por WhatsApp cuando esté listo 📱</div>
          <button onClick={() => { setStep('menu'); setCart([]); setOrderResult(null); setClient({ name: '', whatsapp: '', address: '', floor: '', neighborhood: '', references: '', notes: '' }); setPaymentMethod(''); setCouponCode(''); setCouponStatus(null); }}
            style={{ background: '#E8B84B', color: '#000', border: 'none', padding: '12px 32px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
            Hacer otro pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Imagen de fondo */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${heroBurger})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          zIndex: 0
        }} />
        {/* Overlay oscuro */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.92) 100%)', zIndex: 1 }} />

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

          {/* Header branding */}
          <div style={{ textAlign: 'center', padding: '48px 24px 32px' }}>
            <img src={logoJanz} alt="Janz Burgers" style={{ height: 80, objectFit: 'contain', marginBottom: 20 }} />
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 'clamp(2.8rem, 10vw, 5rem)', color: 'white', lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 16 }}>
              PEDÍ, MORDÉ, REPETÍ.
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Nacimos con una sola obsesión: la hamburguesa perfecta. Cada medallón se forma a mano, cada pan sale del horno propio. No somos una franquicia. Somos Janz.
            </p>
            <a href="https://www.instagram.com/janz.burgers" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#E8B84B', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600, border: '1px solid rgba(232,184,75,0.4)', borderRadius: 20, padding: '6px 16px' }}>
              <Instagram size={14} /> @janz.burgers
            </a>
          </div>

          {/* Modal adicionales */}
          {additionalsModal && (
            <AdditionalsModal
              product={additionalsModal}
              availableAdditionals={availableAdditionals}
              onConfirm={handleAdditionalsConfirm}
              onClose={() => setAdditionalsModal(null)}
            />
          )}

          {step === 'form' ? (
            // ── FORMULARIO ────────────────────────────────────────────
            <div style={{ flex: 1, maxWidth: 520, width: '100%', margin: '0 auto', padding: '0 20px 100px' }}>
              <div style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }}>
                <button onClick={() => setStep('menu')} style={{ background: 'none', border: 'none', color: '#E8B84B', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', marginBottom: 20, padding: 0 }}>
                  ← Volver al menú
                </button>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'white', marginBottom: 20 }}>Tus datos</div>

                {/* Tipo entrega */}
                <div style={{ marginBottom: 18 }}>
                  <div style={labelStyle}>Tipo de entrega *</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {[{ v: 'delivery', l: '🛵 Delivery' }, { v: 'takeaway', l: '🥡 Take Away' }].map(({ v, l }) => (
                      <button key={v} onClick={() => setDeliveryType(v)}
                        style={{ flex: 1, padding: '11px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', border: 'none', fontSize: '0.9rem', background: deliveryType === v ? '#E8B84B' : 'rgba(255,255,255,0.07)', color: deliveryType === v ? '#000' : '#888' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Nombre y apellido *</label>
                  <input value={client.name} onChange={e => setClient(c => ({ ...c, name: e.target.value }))} placeholder="Tu nombre completo" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>WhatsApp *</label>
                  <input value={client.whatsapp} onChange={e => setClient(c => ({ ...c, whatsapp: e.target.value }))} placeholder="Ej: 1123456789" type="tel" style={inputStyle} />
                </div>

                {deliveryType === 'delivery' && (
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <label style={labelStyle}>Dirección *</label>
                      <input value={client.address} onChange={e => setClient(c => ({ ...c, address: e.target.value }))} placeholder="Calle y número" style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div>
                        <label style={labelStyle}>Piso / Depto</label>
                        <input value={client.floor} onChange={e => setClient(c => ({ ...c, floor: e.target.value }))} placeholder="Ej: 3° B" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Barrio</label>
                        <input value={client.neighborhood} onChange={e => setClient(c => ({ ...c, neighborhood: e.target.value }))} placeholder="Tu barrio" style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={labelStyle}>Referencias</label>
                      <input value={client.references} onChange={e => setClient(c => ({ ...c, references: e.target.value }))} placeholder="Ej: portón verde, timbre 2B..." style={inputStyle} />
                    </div>
                  </>
                )}

                {/* Método de pago */}
                <div style={{ marginBottom: 18 }}>
                  <div style={labelStyle}>Método de pago *</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[{ value: 'efectivo', label: '💵 Efectivo' }, { value: 'transferencia', label: '🏦 Transferencia' }, { value: 'mercadopago', label: '💳 MercadoPago' }].map(m => (
                      <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                        style={{ flex: 1, minWidth: 110, padding: '11px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', border: 'none', background: paymentMethod === m.value ? '#E8B84B' : 'rgba(255,255,255,0.07)', color: paymentMethod === m.value ? '#000' : '#888' }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Notas del pedido</label>
                  <textarea value={client.notes} onChange={e => setClient(c => ({ ...c, notes: e.target.value }))} placeholder="Aclaraciones, alergias..." rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                </div>

                {/* Cupón */}
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>🎟️ Cupón de descuento</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus(null); }} placeholder="Ej: LAURA10"
                      style={{ ...inputStyle, border: `1px solid ${couponStatus?.valid ? '#22c55e' : couponStatus?.valid === false ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }} />
                    <button onClick={validateCoupon} disabled={validatingCoupon || !couponCode.trim()}
                      style={{ background: 'rgba(232,184,75,0.1)', color: '#E8B84B', border: '1px solid #E8B84B', padding: '10px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      {validatingCoupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                  {couponStatus && (
                    <div style={{ marginTop: 6, fontSize: '0.8rem', color: couponStatus.valid ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                      {couponStatus.valid ? '✅' : '❌'} {couponStatus.message}
                    </div>
                  )}
                </div>

                {/* Resumen */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontWeight: 700, marginBottom: 10, color: '#E8B84B', fontFamily: 'Bebas Neue', fontSize: '1.1rem' }}>Resumen del pedido</div>
                  {cart.map((i, idx) => (
                    <div key={idx} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span>{i.productName} {i.variant} ×{i.quantity}</span>
                        <span>{fmt(i.unitPrice * i.quantity)}</span>
                      </div>
                      {(i.additionals || []).map((a, ai) => (
                        <div key={ai} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#888', paddingLeft: 12, marginTop: 2 }}>
                          <span>+ {a.name} ×{a.quantity}</span><span>+ {fmt(a.unitPrice * a.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 10, paddingTop: 10 }}>
                    {discount > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4, color: '#888' }}>
                          <span>Subtotal</span><span>{fmt(total)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 6, color: '#22c55e' }}>
                          <span>🎟️ Descuento {couponStatus.discountPercent}%</span><span>- {fmt(discount)}</span>
                        </div>
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>TOTAL</span>
                      <span style={{ color: '#E8B84B', fontSize: '1.1rem' }}>{fmt(totalWithDiscount)}</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleSubmit} disabled={submitting}
                  style={{ width: '100%', background: submitting ? '#666' : '#E8B84B', color: '#000', border: 'none', padding: '15px', borderRadius: 10, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '1rem', letterSpacing: '0.03em' }}>
                  {submitting ? 'Enviando...' : `Confirmar Pedido — ${fmt(totalWithDiscount)}`}
                </button>
              </div>
            </div>

          ) : (
            // ── MENÚ ──────────────────────────────────────────────────
            <div style={{ flex: 1, maxWidth: 560, width: '100%', margin: '0 auto', padding: '0 16px 120px' }}>

              {!open && (
                <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '14px 18px', marginBottom: 20, color: '#ef4444', textAlign: 'center', fontWeight: 600 }}>
                  🔴 En este momento no estamos tomando pedidos
                </div>
              )}

              {Object.entries(menu).map(([name, variants]) => (
                <div key={name} style={{ marginBottom: 28 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: '#E8B84B', marginBottom: 10, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                    🍔 {name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {variants.sort((a, b) => a.variant.localeCompare(b.variant)).map(p => {
                      const inCart = cart.find(i => i.product === p._id);
                      const unavailable = !p.available;
                      return (
                        <div key={p._id} style={{ background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(10px)', border: `1px solid ${inCart ? '#E8B84B' : unavailable ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)'}`, borderRadius: 14, overflow: 'hidden', opacity: unavailable ? 0.5 : 1 }}>
                          {p.image && <img src={p.image} alt={name} style={{ width: '100%', height: 170, objectFit: 'cover', display: 'block' }} />}
                          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: 'white' }}>
                                {name} <span style={{ color: '#E8B84B' }}>{p.variant}</span>
                                {unavailable && <span style={{ color: '#ef4444', fontSize: '0.72rem', marginLeft: 8, fontWeight: 600 }}>NO DISPONIBLE</span>}
                              </div>
                              {p.description && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginTop: 3, lineHeight: 1.4 }}>{p.description}</div>}
                              <div style={{ color: '#E8B84B', fontWeight: 700, marginTop: 5, fontSize: '1.05rem' }}>{fmt(p.salePrice)}</div>
                              {availableAdditionals.length > 0 && !inCart && !unavailable && (
                                <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 3 }}>Podés agregar extras</div>
                              )}
                            </div>
                            {!unavailable && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 12 }}>
                                {inCart ? (
                                  <>
                                    <button onClick={() => removeFromCart(p._id)} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>−</button>
                                    <span style={{ fontWeight: 700, minWidth: 22, textAlign: 'center', color: 'white', fontSize: '1.1rem' }}>{inCart.quantity}</span>
                                    <button onClick={() => handleAddToCart(p)} style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8B84B', border: 'none', color: '#000', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700 }}>+</button>
                                  </>
                                ) : (
                                  <button onClick={() => handleAddToCart(p)} style={{ background: '#E8B84B', color: '#000', border: 'none', padding: '9px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Agregar</button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Adicionales */}
              {availableAdditionals.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: '#E8B84B', marginBottom: 10, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>➕ ADICIONALES</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {availableAdditionals.map(add => (
                      <div key={add._id} style={{ background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ color: 'white', fontWeight: 600 }}>{add.emoji} {add.name}</span>
                          {add.description && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginLeft: 8 }}>{add.description}</span>}
                        </div>
                        <span style={{ color: '#E8B84B', fontWeight: 700 }}>{fmt(add.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: 'center', padding: '24px 0 8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <img src={logoJanz} alt="Janz" style={{ height: 32, opacity: 0.35, display: 'block', margin: '0 auto 8px' }} />
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Janz Burgers · Pedí, Mordé, Repetí.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante carrito */}
      {cart.length > 0 && step === 'menu' && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
          <button onClick={() => setStep('form')} style={{ background: '#E8B84B', color: '#000', border: 'none', padding: '14px 32px', borderRadius: 100, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 28px rgba(232,184,75,0.5)', whiteSpace: 'nowrap' }}>
            🛒 Ver pedido ({cart.reduce((s, i) => s + i.quantity, 0)}) — {fmt(total)}
          </button>
        </div>
      )}
    </div>
  );
}
