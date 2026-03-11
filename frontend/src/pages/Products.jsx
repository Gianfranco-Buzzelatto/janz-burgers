import { useState, useEffect } from 'react';
import { Edit2, Check, X, TrendingUp, TrendingDown } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => {
    API.get('/products').then(r => setProducts(r.data)).finally(() => setLoading(false));
  }, []);

  const startEdit = (p) => { setEditing(p._id); setEditPrice(p.salePrice); };

  const saveEdit = async (productId) => {
    try {
      const res = await API.put(`/products/${productId}`, { salePrice: Number(editPrice) });
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, salePrice: Number(editPrice) } : p));
      setEditing(null);
      toast.success('Precio actualizado');
    } catch { toast.error('Error al actualizar'); }
  };

  const grouped = products.reduce((acc, p) => {
    if (!acc[p.name]) acc[p.name] = [];
    acc[p.name].push(p);
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <h1>Escandallo de Productos</h1>
        <div className="text-sm text-gray">Costos y márgenes calculados automáticamente por receta</div>
      </div>
      <div className="page-body">
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}/></div> : (
          Object.entries(grouped).map(([name, variants]) => (
            <div key={name} className="card mb-4">
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'var(--gold)', marginBottom: 14 }}>
                🍔 {name}
              </div>
              <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Variante</th>
                      <th>Costo Total</th>
                      <th>Precio Venta</th>
                      <th>Ganancia</th>
                      <th>Margen %</th>
                      <th>Precio Sugerido (300%)</th>
                      <th>Receta</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.sort((a, b) => a.variant.localeCompare(b.variant)).map(p => {
                      const suggested = Math.round(p.totalCost * 4); // 300% markup = x4
                      const isLow = p.salePrice < suggested * 0.9;
                      const profit = p.salePrice - p.totalCost;
                      const margin = p.salePrice > 0 ? Math.round((profit / p.salePrice) * 100) : 0;
                      
                      return (
                        <tr key={p._id}>
                          <td><strong>{p.variant}</strong></td>
                          <td className="text-red">{fmt(p.totalCost)}</td>
                          <td>
                            {editing === p._id ? (
                              <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ width: 110 }} />
                            ) : <strong className="text-gold">{fmt(p.salePrice)}</strong>}
                          </td>
                          <td style={{ color: profit > 0 ? 'var(--green)' : 'var(--red)' }}>
                            {profit >= 0 ? <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }}/> : <TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }}/>}
                            {fmt(profit)}
                          </td>
                          <td>
                            <span style={{ color: margin > 50 ? 'var(--green)' : margin > 30 ? 'var(--yellow)' : 'var(--red)', fontWeight: 700 }}>
                              {margin}%
                            </span>
                          </td>
                          <td>
                            <span style={{ color: isLow ? 'var(--yellow)' : 'var(--gray)' }}>
                              {isLow && '⚠️ '}{fmt(suggested)}
                            </span>
                          </td>
                          <td>
                            {p.recipe?.ingredients?.length > 0 ? (
                              <div style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>
                                {p.recipe.ingredients.slice(0, 3).map(ri => `${ri.ingredient?.name} ×${ri.quantity}${ri.unit}`).join(', ')}
                                {p.recipe.ingredients.length > 3 && ` +${p.recipe.ingredients.length - 3} más`}
                              </div>
                            ) : '—'}
                          </td>
                          <td>
                            {editing === p._id ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn-icon" onClick={() => saveEdit(p._id)} style={{ color: 'var(--green)' }}><Check size={14}/></button>
                                <button className="btn-icon" onClick={() => setEditing(null)} style={{ color: 'var(--red)' }}><X size={14}/></button>
                              </div>
                            ) : (
                              <button className="btn-icon" onClick={() => startEdit(p)}><Edit2 size={14}/></button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
