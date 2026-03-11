import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, ChefHat, Bell } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;

const STATUS_FLOW = {
  pending: { next: 'confirmed', label: '✓ Confirmar', color: 'btn-primary' },
  confirmed: { next: 'preparing', label: '🔥 Iniciar Cocción', color: 'btn-primary' },
  preparing: { next: 'ready', label: '🔔 Listo para Entregar', color: 'btn-primary' },
  ready: { next: 'delivered', label: '✅ Entregado', color: 'btn-secondary' }
};

const STATUS_LABELS = {
  pending: 'Pendiente', confirmed: 'Confirmado', preparing: 'En Preparación', ready: 'Listo'
};

function OrderCard({ order, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const flow = STATUS_FLOW[order.status];

  const handleChange = async () => {
    if (!flow) return;
    setLoading(true);
    try {
      const res = await API.put(`/orders/${order._id}/status`, { status: flow.next });
      
      if (flow.next === 'confirmed') {
        toast.success(`✅ Pedido ${order.orderNumber} confirmado — Stock descontado automáticamente`);
        if (res.data.whatsappSent?.success) {
          toast.success(`📱 WhatsApp enviado a ${order.client?.name}`);
        }
      } else {
        toast.success(`Pedido ${order.orderNumber} → ${STATUS_LABELS[flow.next] || flow.next}`);
      }
      
      onStatusChange(order._id, flow.next, res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al actualizar pedido');
    } finally { setLoading(false); }
  };

  const cardClass = `kitchen-card ${order.status}`;
  const elapsed = Math.round((Date.now() - new Date(order.createdAt)) / 60000);

  return (
    <div className={cardClass}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.6rem', color: 'var(--gold)' }}>
            {order.orderNumber}
          </div>
          <div style={{ fontWeight: 700 }}>{order.client?.name}</div>
          {order.client?.phone && <div className="text-sm text-gray">{order.client.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className={`badge badge-${order.status}`}>{STATUS_LABELS[order.status]}</span>
          <div className="text-xs text-gray mt-2">
            <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
            hace {elapsed}min
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ background: 'var(--dark)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
        {order.items?.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: idx < order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontWeight: 700 }}>
              ×{item.quantity} {item.productName} <span style={{ color: 'var(--gold)' }}>{item.variant}</span>
            </span>
            <span className="text-sm text-gray">{fmt(item.subtotal)}</span>
          </div>
        ))}
        {order.notes && (
          <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(232,184,75,0.08)', borderRadius: 6, fontSize: '0.8rem', color: 'var(--gold)' }}>
            📝 {order.notes}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.3rem' }}>{fmt(order.total)}</div>
        {flow && (
          <button className={`btn ${flow.color}`} onClick={handleChange} disabled={loading}>
            {loading ? '...' : flow.label}
          </button>
        )}
        {order.status === 'delivered' && (
          <span style={{ color: 'var(--green)', fontSize: '0.85rem' }}>✅ Entregado</span>
        )}
      </div>

      {/* WhatsApp status */}
      {order.status === 'confirmed' && (
        <div style={{ marginTop: 10, fontSize: '0.75rem', color: order.whatsappSent ? 'var(--green)' : 'var(--gray)' }}>
          {order.whatsappSent ? '📱 WhatsApp enviado' : '📵 Sin notificación WhatsApp'}
        </div>
      )}
    </div>
  );
}

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(() => {
    API.get('/orders', { params: { status: 'pending,confirmed,preparing,ready', limit: 30 } })
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusChange = (orderId, newStatus) => {
    if (newStatus === 'delivered') {
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } else {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    }
  };

  const columns = {
    pending: orders.filter(o => o.status === 'pending'),
    confirmed: orders.filter(o => o.status === 'confirmed'),
    preparing: orders.filter(o => o.status === 'preparing'),
    ready: orders.filter(o => o.status === 'ready')
  };

  const colConfig = [
    { key: 'pending', label: 'Pendientes', icon: '🕐', color: 'var(--yellow)' },
    { key: 'confirmed', label: 'Confirmados', icon: '✅', color: 'var(--green)' },
    { key: 'preparing', label: 'En Cocina', icon: '🔥', color: 'var(--gold)' },
    { key: 'ready', label: 'Listos', icon: '🔔', color: '#818cf8' }
  ];

  return (
    <>
      <div className="page-header">
        <h1><ChefHat size={28} style={{ display: 'inline', marginRight: 12 }} />Panel de Cocina</h1>
        <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>↻ Actualizar</button>
      </div>
      <div style={{ padding: '16px 32px' }}>
        <div className="alert alert-info mb-4">
          <Bell size={16} />
          Al confirmar un pedido, el stock se descuenta automáticamente y se envía WhatsApp al cliente.
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }}/></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, padding: '0 32px 32px' }}>
          {colConfig.map(col => (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: '1.2rem' }}>{col.icon}</span>
                <span style={{ fontWeight: 700, color: col.color }}>{col.label}</span>
                <span style={{ background: col.color, color: 'var(--black)', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, marginLeft: 'auto' }}>
                  {columns[col.key].length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 100 }}>
                {columns[col.key].length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--gray)', border: '1px dashed var(--border)', borderRadius: 8, fontSize: '0.85rem' }}>
                    Sin pedidos
                  </div>
                ) : (
                  columns[col.key].map(order => (
                    <OrderCard key={order._id} order={order} onStatusChange={handleStatusChange} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
