import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'kitchen' });
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    API.get('/auth/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('Completá todos los campos');
    try {
      const res = await API.post('/auth/users', form);
      setUsers(prev => [...prev, res.data]);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'kitchen' });
      toast.success('Usuario creado');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al crear usuario');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar usuario?')) return;
    try {
      await API.delete(`/auth/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('Usuario eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const ROLES = { admin: 'Administrador', kitchen: 'Cocina', viewer: 'Solo lectura' };
  const ROLE_COLORS = { admin: 'badge-confirmed', kitchen: 'badge-preparing', viewer: 'badge-pending' };

  return (
    <>
      <div className="page-header">
        <h1>Usuarios</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16}/> Nuevo Usuario
        </button>
      </div>
      <div className="page-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }}/></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--black)' }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td className="text-sm text-gray">{u.email}</td>
                    <td><span className={`badge ${ROLE_COLORS[u.role]}`}>{ROLES[u.role]}</span></td>
                    <td className="text-sm text-gray">{new Date(u.createdAt).toLocaleDateString('es-AR')}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>
                        <Trash2 size={13}/> Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Nuevo Usuario</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nombre *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ejemplo.com" />
              </div>
              <div className="form-group">
                <label>Contraseña *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="admin">Administrador — acceso total</option>
                  <option value="kitchen">Cocina — solo confirmar pedidos</option>
                  <option value="viewer">Solo lectura</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate}>Crear Usuario</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}