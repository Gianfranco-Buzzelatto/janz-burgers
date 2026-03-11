import { useState, useEffect } from 'react';
import { ShoppingCart, AlertTriangle, RefreshCw } from 'lucide-react';
import API from '../utils/api';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;

const PRIORITY_INFO = {
  A: { label: 'CRÍTICO — Comprar primero', color: 'var(--red)', bg: 'rgba(239,68,68,0.08)', emoji: '🔴' },
  B: { label: 'IMPORTANTE — Comprar segundo', color: 'var(--yellow)', bg: 'rgba(234,179,8,0.08)', emoji: '🟡' },
  C: { label: 'SECUNDARIO — Cuando haya stock', color: 'var(--gray)', bg: 'rgba(255,255,255,0.03)', emoji: '⚪' }
};

export default function Shopping() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchList = () => {
    setLoading(true);
    API.get('/shopping').then(r => setList(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchList(); }, []);

  const grouped = list?.items?.reduce((acc, item) => {
    if (!acc[item.priority]) acc[item.priority] = [];
    acc[item.priority].push(item);
    return acc;
  }, {}) || {};

  return (
    <>
      <div className="page-header">
        <h1>Lista de Compras</h1>
        <button className="btn btn-secondary" onClick={fetchList}><RefreshCw size={15}/>Actualizar</button>
      </div>
      <div className="page-body">
        <div className="alert alert-info mb-4">
          <ShoppingCart size={16}/>
          Lista generada automáticamente por metodología ABC. Los ítems en rojo sin stock bloquean la producción.
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }}/></div>
        ) : list?.items?.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'var(--green)' }}>Stock Completo</div>
            <div className="text-gray mt-2">No hay ítems para comprar en este momento</div>
          </div>
        ) : (
          <>
            {/* Total */}
            <div className="card mb-4" style={{ borderColor: 'var(--gold)', background: 'rgba(232,184,75,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="card-title">Inversión Estimada Total</div>
                  <div className="card-value text-gold">{fmt(list.totalEstimated)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-sm text-gray">{list.items?.length} ítems para comprar</div>
                </div>
              </div>
            </div>

            {['A', 'B', 'C'].map(priority => {
              if (!grouped[priority]?.length) return null;
              const info = PRIORITY_INFO[priority];
              const subtotal = grouped[priority].reduce((s, i) => s + i.estimatedCost, 0);

              return (
                <div key={priority} style={{ marginBottom: 28 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                    background: info.bg, padding: '12px 16px', borderRadius: 8,
                    border: `1px solid ${info.color}22`
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>{info.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: info.color }}>Prioridad {priority}</div>
                      <div className="text-xs text-gray">{info.label}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: info.color }}>{fmt(subtotal)}</div>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Ingrediente</th>
                          <th>Categoría</th>
                          <th>Perecedero</th>
                          <th>Stock Actual</th>
                          <th>Mínimo Necesario</th>
                          <th>Unidad</th>
                          <th>Déficit</th>
                          <th>Costo Est.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grouped[priority].map(item => (
                          <tr key={item.ingredient} style={{ background: item.status === 'out' ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                            <td>
                              <div style={{ fontWeight: 600 }}>{item.name}</div>
                            </td>
                            <td className="text-sm text-gray">{item.category}</td>
                            <td>{item.perishable ? <span className="badge" style={{ background: 'rgba(232,184,75,0.1)', color: 'var(--gold)' }}>Sí</span> : <span className="text-gray text-sm">No</span>}</td>
                            <td>
                              <span style={{ fontWeight: 700, color: item.status === 'out' ? 'var(--red)' : 'var(--yellow)' }}>
                                {item.currentStock.toLocaleString('es-AR')}
                              </span>
                            </td>
                            <td>{item.minimumStock.toLocaleString('es-AR')}</td>
                            <td className="text-sm text-gray">{item.unit}</td>
                            <td>
                              <span style={{ color: 'var(--red)', fontWeight: 700 }}>
                                -{item.deficit.toLocaleString('es-AR')}
                              </span>
                            </td>
                            <td>
                              {item.estimatedCost > 0 ? (
                                <strong className="text-gold">{fmt(item.estimatedCost)}</strong>
                              ) : (
                                <span className="text-xs text-gray">Ver precio del día</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
