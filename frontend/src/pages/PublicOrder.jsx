import { useState, useEffect } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;

function itemTotal(item) {
  const base = item.unitPrice * item.quantity;
  const extras = (item.additionals || []).reduce(
    (s, a) => s + a.unitPrice * (a.quantity || 1), 0
  );
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#1a1a1a', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', color: 'white', marginBottom: 4 }}>
          {product.name} <span style={{ color: '#E8B84B' }}>{product.variant}</span>
        </div>
        <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: 20 }}>Agregá extras a esta hamburguesa</div>

        {availableAdditionals.map(add => {
          const qty = selected[add._id] || 0;
          return (
            <div key={add._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: qty > 0 ? 'rgba(232,184,75,0.08)' : '#111', border: `1px solid ${qty > 0 ? '#E8B84B' : '#2a2a2a'}`, borderRadius: 10, padding: '12px 16px', marginBottom: 10 }}>
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
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState(null); // { valid, discountPercent, message }
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

  const discount = couponStatus?.valid ? Math.round(total * couponStatus.discountPercent / 100) : 0;
  const totalWithDiscount = total - discount;

  const handleSubmit = async () => {
    if (!client.name || !client.whatsapp) { toast.error('Nombre y WhatsApp son obligatorios'); return; }
    setSubmitting(true);
    try {
      const res = await API.post('/public/order', {
        client,
        items: cart.map(i => ({
          product: i.product,
          quantity: i.quantity,
          additionals: (i.additionals || []).map(a => ({ additional: a.additional, quantity: a.quantity }))
        })),
        deliveryType,
        notes: client.notes,
        couponCode: couponStatus?.valid ? couponCode.trim() : null
      });
      setOrderResult(res.data);
      setStep('success');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al enviar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Inter, sans-serif' }}>
      {additionalsModal && (
        <AdditionalsModal
          product={additionalsModal}
          availableAdditionals={availableAdditionals}
          onConfirm={handleAdditionalsConfirm}
          onClose={() => setAdditionalsModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '3rem', color: 'white', lineHeight: 1 }}>JANZ</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', color: '#E8B84B', letterSpacing: '0.2em' }}>🍔 BURGERS</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ background: open ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: open ? '#22c55e' : '#ef4444', padding: '4px 14px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600 }}>
            {open ? '🟢 Abierto' : '🔴 Cerrado — Abrimos Vie/Sáb/Dom'}
          </span>
        </div>
      </div>

      {!open ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#888' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🍔</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', color: 'white', marginBottom: 8 }}>Volvemos el Viernes</div>
          <div>Aceptamos pedidos los Viernes, Sábados y Domingos</div>
        </div>

      ) : step === 'success' ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '2.5rem', color: '#22c55e', marginBottom: 8 }}>¡Pedido Recibido!</div>
          <div style={{ color: '#E8B84B', fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>{orderResult?.orderNumber}</div>
          <div style={{ color: '#888', marginBottom: 32 }}>Te avisamos por WhatsApp cuando la cocina confirme tu pedido.</div>
          <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Total a pagar</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', color: '#E8B84B' }}>{fmt(orderResult?.total)}</div>
          </div>
          <button onClick={() => { setCart([]); setStep('menu'); setOrderResult(null); }}
            style={{ background: '#E8B84B', color: '#000', border: 'none', padding: '12px 32px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
            Hacer otro pedido
          </button>
        </div>

      ) : step === 'form' ? (
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 24 }}>
          <button onClick={() => setStep('menu')} style={{ background: 'none', border: 'none', color: '#E8B84B', cursor: 'pointer', marginBottom: 16, fontSize: '0.9rem' }}>
            ← Volver al menú
          </button>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', color: 'white', marginBottom: 20 }}>Tus Datos</h2>

          {/* Tipo de entrega */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de entrega</label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeliveryType('delivery')}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', background: deliveryType === 'delivery' ? 'rgba(232,184,75,0.15)' : '#1a1a1a', color: deliveryType === 'delivery' ? '#E8B84B' : '#555', outline: deliveryType === 'delivery' ? '2px solid #E8B84B' : '1px solid #333' }}>
                🛵 Delivery
              </button>
              <button onClick={() => setDeliveryType('takeaway')}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', background: deliveryType === 'takeaway' ? 'rgba(129,140,248,0.15)' : '#1a1a1a', color: deliveryType === 'takeaway' ? '#818cf8' : '#555', outline: deliveryType === 'takeaway' ? '2px solid #818cf8' : '1px solid #333' }}>
                🥡 Take Away
              </button>
            </div>
          </div>

          {[
            { key: 'name', label: 'Nombre y Apellido *', placeholder: 'Juan Pérez' },
            { key: 'whatsapp', label: 'WhatsApp *', placeholder: '1141609741' },
            { key: 'address', label: 'Dirección', placeholder: 'Av. Corrientes 1234' },
            { key: 'floor', label: 'Piso / Depto', placeholder: '3° B' },
            { key: 'neighborhood', label: 'Barrio', placeholder: 'Palermo' },
            { key: 'references', label: 'Referencias', placeholder: 'Portón negro, timbre 2' },
            { key: 'notes', label: 'Aclaraciones del pedido', placeholder: 'Sin cheddar, extra picante...' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#aaa', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
              <input value={client[f.key]} onChange={e => setClient(c => ({ ...c, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: 'white', padding: '10px 14px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}

          {/* Cupón de descuento */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#aaa', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🎟️ Cupón de descuento
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponStatus(null); }}
                placeholder="Ej: LAURA10"
                style={{ flex: 1, background: '#1a1a1a', border: `1px solid ${couponStatus?.valid ? '#22c55e' : couponStatus?.valid === false ? '#ef4444' : '#333'}`, borderRadius: 8, color: 'white', padding: '10px 14px', fontSize: '0.875rem', outline: 'none' }}
              />
              <button onClick={validateCoupon} disabled={validatingCoupon || !couponCode.trim()}
                style={{ background: '#2a2a2a', color: '#E8B84B', border: '1px solid #E8B84B', padding: '10px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
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
          <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 20, marginTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: '#E8B84B' }}>Resumen</div>
            {cart.map((i, idx) => (
              <div key={idx} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'white' }}>{i.productName} {i.variant} ×{i.quantity}</span>
                  <span style={{ color: 'white' }}>{fmt(i.unitPrice * i.quantity)}</span>
                </div>
                {(i.additionals || []).map((a, ai) => (
                  <div key={ai} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#888', paddingLeft: 12, marginTop: 2 }}>
                    <span>+ {a.name} ×{a.quantity}</span>
                    <span>+ {fmt(a.unitPrice * a.quantity)}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ borderTop: '1px solid #333', marginTop: 10, paddingTop: 10 }}>
              {discount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                    <span style={{ color: '#888' }}>Subtotal</span>
                    <span style={{ color: '#888' }}>{fmt(total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 6 }}>
                    <span style={{ color: '#22c55e' }}>🎟️ Descuento {couponStatus.discountPercent}%</span>
                    <span style={{ color: '#22c55e' }}>- {fmt(discount)}</span>
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
            style={{ width: '100%', background: '#E8B84B', color: '#000', border: 'none', padding: '14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
            {submitting ? 'Enviando...' : `Confirmar Pedido — ${fmt(totalWithDiscount)}`}
          </button>
        </div>

      ) : (
        // ── Menú ──────────────────────────────────────────────────────────────
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
          {Object.entries(menu).map(([name, variants]) => (
            <div key={name} style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: '#E8B84B', marginBottom: 12 }}>🍔 {name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {variants.sort((a, b) => a.variant.localeCompare(b.variant)).map(p => {
                  const inCart = cart.find(i => i.product === p._id);
                  return (
                    <div key={p._id} style={{ background: '#1a1a1a', border: `1px solid ${inCart ? '#E8B84B' : '#222'}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'white' }}>{name} <span style={{ color: '#E8B84B' }}>{p.variant}</span></div>
                        <div style={{ color: '#E8B84B', fontWeight: 700, marginTop: 2 }}>{fmt(p.salePrice)}</div>
                        {availableAdditionals.length > 0 && !inCart && (
                          <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 3 }}>Podés agregar extras</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {inCart ? (
                          <>
                            <button onClick={() => removeFromCart(p._id)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#333', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>−</button>
                            <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', color: 'white' }}>{inCart.quantity}</span>
                            <button onClick={() => handleAddToCart(p)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8B84B', border: 'none', color: '#000', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700 }}>+</button>
                          </>
                        ) : (
                          <button onClick={() => handleAddToCart(p)} style={{ background: '#E8B84B', color: '#000', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Agregar</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sección informativa de adicionales disponibles */}
          {availableAdditionals.length > 0 && (
            <div style={{ marginBottom: 100 }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: '#E8B84B', marginBottom: 4 }}>➕ ADICIONALES</div>
              <div style={{ color: '#666', fontSize: '0.8rem', marginBottom: 12 }}>Se agregan al momento de elegir tu burger</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableAdditionals.map(add => (
                  <div key={add._id} style={{ background: '#1a1a1a', border: '1px solid #222', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ color: 'white', fontWeight: 600 }}>{add.emoji} {add.name}</span>
                      {add.description && <span style={{ color: '#555', fontSize: '0.78rem', marginLeft: 8 }}>{add.description}</span>}
                    </div>
                    <span style={{ color: '#E8B84B', fontWeight: 700 }}>{fmt(add.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón flotante carrito */}
          {cart.length > 0 && (
            <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
              <button onClick={() => setStep('form')} style={{ background: '#E8B84B', color: '#000', border: 'none', padding: '14px 32px', borderRadius: 100, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 20px rgba(232,184,75,0.4)', whiteSpace: 'nowrap' }}>
                🛒 Ver pedido ({cart.reduce((s, i) => s + i.quantity, 0)} items) — {fmt(total)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
