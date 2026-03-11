import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../utils/api';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [sales, setSales] = useState(null);
  const [storeStatus, setStoreStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/dashboard'),
      API.get('/dashboard/sales'),
      API.get('/orders/system/status')
    ]).then(([d, s, st]) => {
      setData(d.data);
      setSales(s.data);
      setStoreStatus(st.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  const statusLabels = {
    pending: 'Pendiente', confirmed: 'Confirmado',
    preparing: 'Preparando', ready: 'Listo', delivered: 'Entregado', cancelled: 'Cancelado'
  };

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className={`badge ${storeStatus?.open ? 'badge-ok' : 'badge-cancelled'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
          {storeStatus?.open ? '🟢 Abierto' : '🔴 Cerrado hoy'}
        </div>
      </div>

      <div className="page-body">
        {!storeStatus?.open && (
          <div className="alert alert-info mb-4">
            📅 {storeStatus?.message} — El admin puede gestionar stock y precios igual.
          </div>
        )}

        {/* Stats */}
        <div className="stat-grid">
          <div className="card">
            <div className="card-title">Ventas Hoy</div>
            <div className="card-value text-gold">{fmt(data?.today?.revenue)}</div>
            <div className="text-sm text-gray mt-2">{data?.today?.orders} pedidos</div>
          </div>
          <div className="card">
            <div className="card-title">Ventas Semana</div>
            <div className="card-value">{fmt(data?.week?.revenue)}</div>
            <div className="text-sm text-gray mt-2">{data?.week?.orders} pedidos</div>
          </div>
          <div className="card">
            <div className="card-title">Pedidos Activos</div>
            <div className="card-value text-gold">{data?.pending?.length || 0}</div>
            <div className="text-sm text-gray mt-2">en proceso ahora</div>
          </div>
          <div className="card">
            <div className="card-title">Ventas del Mes</div>
            <div className="card-value">{fmt(sales?.totalRevenue)}</div>
            <div className="text-sm text-gray mt-2">{sales?.orders} pedidos</div>
          </div>
        </div>

        <div className="grid-2" style={{ gap: 24 }}>
          {/* Pending orders */}
          <div>
            <div className="section-title">⏳ Pedidos Pendientes</div>
            {data?.pending?.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--gray)', padding: 32 }}>
                Sin pedidos activos 🎉
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data?.pending?.map(order => (
                  <div key={order._id} className="card" style={{ padding: '14px 18px' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontWeight: 700 }}>{order.orderNumber}</div>
                        <div className="text-sm text-gray">{order.client?.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`badge badge-${order.status}`}>{statusLabels[order.status]}</span>
                        <div className="text-sm text-gold mt-2">{fmt(order.total)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top products chart */}
          <div>
            <div className="section-title">🍔 Productos Más Vendidos</div>
            {sales?.productSales?.length > 0 ? (
              <div className="card" style={{ padding: '20px' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sales.productSales.slice(0, 6)}>
                    <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
                      formatter={(v) => [v, 'Unidades']}
                    />
                    <Bar dataKey="units" fill="#E8B84B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', color: 'var(--gray)', padding: 32 }}>
                Sin datos de ventas aún
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
