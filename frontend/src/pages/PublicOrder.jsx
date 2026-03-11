import { useState, useEffect } from 'react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;

export default function PublicOrder() {
  const [menu, setMenu] = useState({});
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState('menu'); // menu | form | confirm | success
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [client, setClient] = useState({
    name: '', whatsapp: '', address: '', floor: '',
    neighborhood: '', references: '', notes: ''
  });

  useEffect(() => {
    API.get('/public/menu').then(r => {
      setMenu(r.data.menu);
      setOpen(r.data.open);
    }).finally(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(i => i.product === product._id);
    if (existing) {
      setCart(c => c.map(i => i.product === product._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart(c => [...c, { product: product._id, productName: product.name, variant: product.variant, quantity: 1, unitPrice: product.salePrice }]);
    }
  };

  const removeFromCart = (productId) => {
    const existing = cart.find(i => i.product === productId);
    if (existing?.quantity === 1) {
      setCart(c => c.filter(i => i.product !== productId));
    } else {
      setCart(c => c.map(i => i.product === productId ? { ...i, quantity: i.quantity - 1 } : i));
    }
  };

  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const handleSubmit = async () => {
    if (!client.name || !client.whatsapp) {
      toast.error('Nombre y WhatsApp son obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      const res = await API.post('/public/order', {
        client,
        items: cart.map(i => ({ product: i.product, quantity: i.quantity })),
        deliveryType: 'delivery',
        notes: client.notes
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
      <div className="spinner"/>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '20px 24px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '3rem', color: 'white', lineHeight: 1 }}>JANZ</div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', color: '#E8B84B', letterSpacing: '0.2em' }}>🍔 BURGERS</div>
        <div style={{ marginTop: 8 }}>
          <span style={{ 
            background: open ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: open ? '#22c55e' : '#ef4444',
            padding: '4px 14px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600
          }}>
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

          {/* Order summary */}
          <div style={{ background: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 20, marginTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, color: '#E8B84B' }}>Resumen</div>
            {cart.map(i => (
              <div key={i.product} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 6 }}>
                <span>{i.productName} {i.variant} ×{i.quantity}</span>
                <span>{fmt(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #333', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>TOTAL</span>
              <span style={{ color: '#E8B84B', fontSize: '1.1rem' }}>{fmt(total)}</span>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            style={{ width: '100%', background: '#E8B84B', color: '#000', border: 'none', padding: '14px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
            {submitting ? 'Enviando...' : `Confirmar Pedido — ${fmt(total)}`}
          </button>
        </div>
      ) : (
        // Menu
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
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {inCart ? (
                          <>
                            <button onClick={() => removeFromCart(p._id)}
                              style={{ width: 32, height: 32, borderRadius: '50%', background: '#333', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>−</button>
                            <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{inCart.quantity}</span>
                            <button onClick={() => addToCart(p)}
                              style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8B84B', border: 'none', color: '#000', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700 }}>+</button>
                          </>
                        ) : (
                          <button onClick={() => addToCart(p)}
                            style={{ background: '#E8B84B', color: '#000', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Floating cart button */}
          {cart.length > 0 && (
            <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
              <button onClick={() => setStep('form')}
                style={{ background: '#E8B84B', color: '#000', border: 'none', padding: '14px 32px', borderRadius: 100, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 20px rgba(232,184,75,0.4)', whiteSpace: 'nowrap' }}>
                🛒 Ver pedido ({cart.reduce((s, i) => s + i.quantity, 0)} items) — {fmt(total)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}