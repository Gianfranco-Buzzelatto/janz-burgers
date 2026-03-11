import { useState, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function Stock() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [filter, setFilter] = useState('all');

  const fetchStocks = () => {
    API.get('/stock').then(r => setStocks(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchStocks(); }, []);

  const startEdit = (stock) => {
    setEditing(stock._id);
    setEditValues({ currentStock: stock.currentStock, minimumStock: stock.minimumStock, notes: stock.notes || '' });
  };

  const saveEdit = async (stockId) => {
    try {
      const res = await API.put(`/stock/${stockId}`, editValues);
      setStocks(prev => prev.map(s => s._id === stockId ? res.data : s));
      setEditing(null);
      toast.success('Stock actualizado');
    } catch { toast.error('Error al actualizar stock'); }
  };

  const cancelEdit = () => setEditing(null);

  const filtered = filter === 'all' ? stocks : stocks.filter(s => s.status === filter);

  const counts = {
    all: stocks.length,
    out: stocks.filter(s => s.status === 'out').length,
    low: stocks.filter(s => s.status === 'low').length,
    ok: stocks.filter(s => s.status === 'ok').length
  };

  return (
    <>
      <div className="page-header">
        <h1>Control de Stock</h1>
      </div>
      <div className="page-body">
        {/* Summary */}
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="card" style={{ borderColor: 'var(--red)' }}>
            <div className="card-title">Sin Stock 🔴</div>
            <div className="card-value text-red">{counts.out}</div>
          </div>
          <div className="card" style={{ borderColor: 'var(--yellow)' }}>
            <div className="card-title">Stock Bajo 🟡</div>
            <div className="card-value" style={{ color: 'var(--yellow)' }}>{counts.low}</div>
          </div>
          <div className="card" style={{ borderColor: 'var(--green)' }}>
            <div className="card-title">OK 🟢</div>
            <div className="card-value text-green">{counts.ok}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {Object.entries({ all: 'Todos', out: 'Sin Stock', low: 'Bajo', ok: 'OK' }).map(([k, v]) => (
            <button key={k} onClick={() => setFilter(k)} className={`btn btn-sm ${filter === k ? 'btn-primary' : 'btn-secondary'}`}>
              {v} ({counts[k]})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}/></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Mínimo</th>
                  <th>Unidad</th>
                  <th>Estado</th>
                  <th>Notas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(stock => (
                  <tr key={stock._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{stock.ingredient?.name}</div>
                      {stock.ingredient?.perishable && <div className="text-xs" style={{ color: 'var(--gold)' }}>Perecedero</div>}
                    </td>
                    <td className="text-sm text-gray">{stock.ingredient?.category}</td>
                    <td>
                      {editing === stock._id ? (
                        <input type="number" value={editValues.currentStock}
                          onChange={e => setEditValues(v => ({ ...v, currentStock: Number(e.target.value) }))}
                          style={{ width: 90 }} min={0} />
                      ) : (
                        <span style={{ fontWeight: 700 }}>{stock.currentStock.toLocaleString('es-AR')}</span>
                      )}
                    </td>
                    <td>
                      {editing === stock._id ? (
                        <input type="number" value={editValues.minimumStock}
                          onChange={e => setEditValues(v => ({ ...v, minimumStock: Number(e.target.value) }))}
                          style={{ width: 90 }} min={0} />
                      ) : (
                        stock.minimumStock.toLocaleString('es-AR')
                      )}
                    </td>
                    <td className="text-sm text-gray">{stock.unit}</td>
                    <td>
                      <span className={`badge badge-${stock.status}`}>
                        {stock.status === 'out' ? '🔴 Sin Stock' : stock.status === 'low' ? '🟡 Bajo' : '🟢 OK'}
                      </span>
                    </td>
                    <td>
                      {editing === stock._id ? (
                        <input value={editValues.notes} onChange={e => setEditValues(v => ({ ...v, notes: e.target.value }))} placeholder="Notas..." style={{ width: 150 }} />
                      ) : (
                        <span className="text-sm text-gray">{stock.notes || '—'}</span>
                      )}
                    </td>
                    <td>
                      {editing === stock._id ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon" onClick={() => saveEdit(stock._id)} style={{ color: 'var(--green)' }}><Check size={14}/></button>
                          <button className="btn-icon" onClick={cancelEdit} style={{ color: 'var(--red)' }}><X size={14}/></button>
                        </div>
                      ) : (
                        <button className="btn-icon" onClick={() => startEdit(stock)}><Edit2 size={14}/></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
