import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Users, Package, Trophy, FlaskConical, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../utils/api';

const fmt = n => `$${Number(n || 0).toLocaleString('es-AR')}`;
const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    API.get('/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setSalesLoading(true);
    API.get(`/dashboard/sales?month=${month}&year=${year}`)
      .then(r => setSales(r.data))
      .finally(() => setSalesLoading(false));
  }, [month, year]);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      <div className="page-body">

        {/* Stats hoy */}
        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-label">Pedidos Hoy</div>
            <div className="stat-value">{stats?.today?.orders || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ingresos Hoy</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{fmt(stats?.today?.revenue)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pedidos Esta Semana</div>
            <div className="stat-value">{stats?.week?.orders || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ingresos Semana</div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{fmt(stats?.week?.revenue)}</div>
          </div>
        </div>

        {/* Selector mes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer' }}><ChevronLeft size={20} /></button>
          <div style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', color: 'var(--gold)', minWidth: 180, textAlign: 'center' }}>
            {months[month - 1]} {year}
          </div>
          <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer' }}><ChevronRight size={20} /></button>
        </div>

        {salesLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : sales ? (
          <>
            {/* Stats del mes */}
            <div className="stat-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-label">Pedidos del Mes</div>
                <div className="stat-value">{sales.orders}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Ingresos del Mes</div>
                <div className="stat-value" style={{ fontSize: '1.3rem' }}>{fmt(sales.totalRevenue)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Ticket Promedio</div>
                <div className="stat-value" style={{ fontSize: '1.3rem' }}>{fmt(sales.avgTicket)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Clientes Únicos</div>
                <div className="stat-value">{sales.clients?.total || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray)', marginTop: 4 }}>
                  {sales.clients?.new || 0} nuevos · {sales.clients?.recurring || 0} recurrentes
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 24 }}>

              {/* Top 5 burgers */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontFamily: 'Bebas Neue', fontSize: '1.2rem', color: 'var(--gold)' }}>
                  <Trophy size={18} /> TOP 5 HAMBURGUESAS
                </div>
                {sales.top5?.length === 0 ? (
                  <div style={{ color: 'var(--gray)', textAlign: 'center', padding: 20 }}>Sin ventas este mes</div>
                ) : (
                  sales.top5?.map((p, i) => (
                    <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < sales.top5.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'Bebas Neue', fontSize: '1.3rem', color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--gray)', width: 24 }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{p.units} uds</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{fmt(p.revenue)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Top Buyers */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontFamily: 'Bebas Neue', fontSize: '1.2rem', color: 'var(--gold)' }}>
                  <Users size={18} /> TOP CLIENTES
                </div>
                {sales.clients?.topBuyers?.length === 0 ? (
                  <div style={{ color: 'var(--gray)', textAlign: 'center', padding: 20 }}>Sin datos este mes</div>
                ) : (
                  sales.clients?.topBuyers?.map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < sales.clients.topBuyers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'Bebas Neue', fontSize: '1.3rem', color: 'var(--gray)', width: 24 }}>{i + 1}</span>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--gray)' }}>{c.whatsapp}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{c.ordersThisMonth} pedidos</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{c.totalOrders} totales</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Consumo de insumos */}
            {sales.ingredientUsage?.length > 0 && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontFamily: 'Bebas Neue', fontSize: '1.2rem', color: 'var(--gold)' }}>
                  <FlaskConical size={18} /> CONSUMO DE INSUMOS — {months[month - 1].toUpperCase()} {year}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {sales.ingredientUsage.map(ing => (
                    <div key={ing.name} style={{ background: '#1a1a1a', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ing.name}</div>
                      <div style={{ fontSize: '1.1rem', color: 'var(--gold)', fontWeight: 700, marginTop: 2 }}>
                        {ing.quantity} <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{ing.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--gray)', textAlign: 'center', padding: 40 }}>Sin datos para este período</div>
        )}
      </div>
    </>
  );
}
