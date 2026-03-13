import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, ChefHat, Package, Beef, Users,
  ShoppingCart, LogOut, Star, BookOpen, UserCog, Menu, X
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/cocina', label: 'Cocina', icon: ChefHat },
  { to: '/stock', label: 'Stock', icon: Package, adminOnly: true },
  { to: '/productos', label: 'Escandallo', icon: Beef, adminOnly: true },
  { to: '/ingredientes', label: 'Ingredientes', icon: BookOpen, adminOnly: true },
  { to: '/clientes', label: 'Clientes', icon: Users, adminOnly: true },
  { to: '/compras', label: 'Lista de Compras', icon: ShoppingCart, adminOnly: true },
  { to: '/usuarios', label: 'Usuarios', icon: UserCog, adminOnly: true }
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="layout">
      {/* Overlay mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', color: 'white' }}>
            JANZ<span style={{ color: 'var(--gold)' }}>BURGERS</span>
          </h2>
          {/* Botón cerrar sidebar en mobile */}
          <button
            onClick={closeSidebar}
            style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={closeSidebar}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="btn-icon" onClick={handleLogout} title="Salir">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Topbar mobile */}
        <div className="mobile-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="mobile-topbar-title">🍔 JANZ</span>
          <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
