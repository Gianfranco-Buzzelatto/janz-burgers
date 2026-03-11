import { useState, useEffect } from 'react';
import { Search, Plus, Star } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [clientOrders, setClientOrders] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', email: '', address: '', notes: '' });

  const fetchClients = (q = '') => {
    API.get('/clients', { params: q ? { search: q } : {} })
      .then(r => setClients(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchClients(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchClients(e.target.value);
  };

  const handleCreate = async () => {
    try {
      const res = await API.post('/clients', form);
      setClients(prev => [res.data, ...prev]);
      setShowModal(false);
      setForm({ name: '', phone: '', whatsapp: '', email: '', address: '', notes: '' });
      toast.success('Cliente creado');
    } catch { toast.error('Error al crear cliente'); }
  };

  const viewClient = async (client) => {
    setSelected(client);
    const res = await API.get(`/clients/${client._id}`);
    setClientOrders(res.data.orders || []);
  };

  return (
    <>
      <div className="page-header">
        <h1>Clientes</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16}/>Nuevo Cliente</button>
      </div>
      <div className="page-body">
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
          <input value={search} onChange={handleSearch} placeholder="Buscar por nombre o teléfono..." style={{ paddingLeft: 40 }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}/></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>WhatsApp</th>
                  <th>Pedidos</th>
                  <th>Total Gastado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray)' }}>Sin clientes</td></tr>
                ) : clients.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      {c.email && <div className="text-xs text-gray">{c.email}</div>}
                    </td>
                    <td className="text-sm">{c.phone || '—'}</td>
                    <td className="text-sm">{c.whatsapp || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{c.totalOrders}</span>
                      {c.totalOrders >= 5 && <Star size={12} style={{ color: 'var(--gold)', display: 'inline', marginLeft: 4 }}/>}
                    </td>
                    <td><strong className="text-gold">{fmt(c.totalSpent)}</strong></td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => viewClient(c)}>Ver historial</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>{selected.name}</h2>
              <button className="btn-icon" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ marginBottom: 16 }}>
                <div className="card" style={{ padding: '12px 16px' }}>
                  <div className="card-title">Total Pedidos</div>
                  <div className="card-value text-gold">{selected.totalOrders}</div>
                </div>
                <div className="card" style={{ padding: '12px 16px' }}>
                  <div className="card-title">Total Gastado</div>
                  <div className="card-value">{fmt(selected.totalSpent)}</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, marginBottom: 10 }}>Historial de Pedidos</div>
              {clientOrders.length === 0 ? (
                <div className="text-gray text-sm" style={{ textAlign: 'center', padding: 20 }}>Sin pedidos registrados</div>
              ) : clientOrders.map(o => (
                <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span className="text-gold" style={{ fontWeight: 700 }}>{o.orderNumber}</span>
                    <span className="text-sm text-gray" style={{ marginLeft: 10 }}>
                      {o.items?.map(i => `${i.productName} ${i.variant}`).join(', ')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700 }}>{fmt(o.total)}</div>
                    <div className="text-xs text-gray">{new Date(o.createdAt).toLocaleDateString('es-AR')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create client modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Nuevo Cliente</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="grid-2">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="11-1234-5678" />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="54911..." />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ejemplo.com" />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Notas</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ej: sin picante, alergia a..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!form.name}>Crear Cliente</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
