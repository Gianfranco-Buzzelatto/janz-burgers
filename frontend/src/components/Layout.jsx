import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, ChefHat, Package, Beef, Users,
  ShoppingCart, LogOut, Star, BookOpen, UserCog 
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Janz Burgers" style={{ filter: 'invert(1)' }} 
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
          />
          <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '1.8rem', display: 'none', color: 'white' }}>
            JANZ<span style={{ color: 'var(--gold)' }}>BURGERS</span>
          </h2>
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
            <div style={{ flex: 1 }}>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="btn-icon" onClick={handleLogout} title="Salir">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
