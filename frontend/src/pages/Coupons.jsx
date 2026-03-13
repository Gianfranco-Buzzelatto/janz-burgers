import { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Users } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null); // para ver usos
  const [form, setForm] = useState({ code: '', ownerId: '', discountForUser: 10, rewardPerUse: 5 });

  useEffect(() => {
    Promise.all([
      API.get('/coupons'),
      API.get('/clients')
    ]).then(([c, cl]) => {
      setCoupons(c.data);
      setClients(cl.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!form.code || !form.ownerId) { toast.error('Código y cliente son obligatorios'); return; }
    try {
      const res = await API.post('/coupons', form);
      setCoupons(prev => [res.data, ...prev]);
      setShowModal(false);
      setForm({ code: '', ownerId: '', discountForUser: 10, rewardPerUse: 5 });
      toast.success('Cupón creado');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al crear cupón');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este cupón?')) return;
    try {
      await API.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c._id !== id));
      toast.success('Cupón desactivado');
    } catch (e) {
      toast.error('Error al desactivar');
    }
  };

  const handleResetReward = async (coupon) => {
    try {
      await API.put(`/coupons/${coupon._id}`, { ownerPendingDiscount: 0 });
      setCoupons(prev => prev.map(c => c._id === coupon._id ? { ...c, ownerPendingDiscount: 0 } : c));
      toast.success(`Descuento de ${coupon.ownerName} marcado como usado`);
    } catch (e) {
      toast.error('Error');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <>
      <div className="page-header">
        <h1><Ticket size={26} style={{ display: 'inline', marginRight: 10 }} />Cuponera</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nuevo Cupón
        </button>
      </div>

      <div className="page-body">
        {coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎟️</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.5rem', marginBottom: 8 }}>Sin cupones todavía</div>
            <div style={{ fontSize: '0.9rem' }}>Creá un cupón y asignalo a un cliente estrella</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {coupons.map(coupon => (
              <div key={coupon._id} className="card" style={{ opacity: coupon.active ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  {/* Info principal */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: 'rgba(232,184,75,0.1)', border: '1px solid var(--gold)', borderRadius: 10, padding: '10px 18px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', color: 'var(--gold)', letterSpacing: '0.1em' }}>{coupon.code}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray)' }}>{coupon.active ? '🟢 Activo' : '🔴 Inactivo'}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{coupon.ownerName}</div>
                      <div style={{ color: 'var(--gray)', fontSize: '0.8rem', marginTop: 2 }}>Cliente estrella</div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span className="badge badge-confirmed">-{coupon.discountForUser}% para nuevos</span>
                        <span className="badge badge-preparing">+{coupon.rewardPerUse}% por uso para el dueño</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats y acciones */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 16, textAlign: 'center' }}>
                      <div>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'var(--gold)' }}>{coupon.totalUses}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray)' }}>usos totales</div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: coupon.ownerPendingDiscount > 0 ? 'var(--green)' : 'var(--gray)' }}>
                          {coupon.ownerPendingDiscount}%
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray)' }}>descuento pendiente</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {coupon.ownerPendingDiscount > 0 && (
                        <button className="btn btn-sm btn-secondary" onClick={() => handleResetReward(coupon)}>
                          ✅ Descuento usado
                        </button>
                      )}
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelectedCoupon(coupon)}>
                        <Users size={14} /> Ver usos
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(coupon._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear cupón */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎟️ Nuevo Cupón</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Código del cupón</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="Ej: LAURA10" />
                <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: 4 }}>
                  Se convierte automáticamente a mayúsculas
                </div>
              </div>
              <div className="form-group">
                <label>Cliente estrella (dueño del cupón)</label>
                <select value={form.ownerId} onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))}>
                  <option value="">Seleccioná un cliente...</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.name} — {c.whatsapp}</option>
                  ))}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Descuento para nuevo cliente (%)</label>
                  <input type="number" min="1" max="50" value={form.discountForUser}
                    onChange={e => setForm(f => ({ ...f, discountForUser: Number(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label>Recompensa al dueño por uso (%)</label>
                  <input type="number" min="1" max="50" value={form.rewardPerUse}
                    onChange={e => setForm(f => ({ ...f, rewardPerUse: Number(e.target.value) }))} />
                </div>
              </div>
              <div style={{ background: 'rgba(232,184,75,0.05)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, fontSize: '0.85rem', color: 'var(--gray)' }}>
                💡 Cada vez que alguien use el cupón <strong style={{ color: 'var(--gold)' }}>{form.code || 'CÓDIGO'}</strong>, 
                el nuevo cliente obtiene <strong style={{ color: 'var(--green)' }}>{form.discountForUser}% de descuento</strong> y{' '}
                <strong style={{ color: 'var(--gold)' }}>{form.ownerId ? clients.find(c => c._id === form.ownerId)?.name : 'el dueño'}</strong>{' '}
                acumula <strong style={{ color: '#818cf8' }}>{form.rewardPerUse}%</strong> de descuento para su próxima compra.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate}>Crear Cupón</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ver usos */}
      {selectedCoupon && (
        <div className="modal-overlay" onClick={() => setSelectedCoupon(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Usos de {selectedCoupon.code}</h2>
              <button className="btn-icon" onClick={() => setSelectedCoupon(null)}>✕</button>
            </div>
            <div className="modal-body">
              {selectedCoupon.uses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--gray)' }}>
                  Nadie usó este cupón todavía
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Pedido</th>
                        <th>Descuento</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCoupon.uses.map((use, i) => (
                        <tr key={i}>
                          <td>{use.clientName}<br /><span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{use.whatsapp}</span></td>
                          <td style={{ color: 'var(--gold)' }}>{use.orderNumber}</td>
                          <td><span className="badge badge-confirmed">-{use.discountApplied}%</span></td>
                          <td style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>
                            {new Date(use.usedAt).toLocaleDateString('es-AR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
