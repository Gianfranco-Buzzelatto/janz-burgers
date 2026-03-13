import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Kitchen from './pages/Kitchen';
import Stock from './pages/Stock';
import Products from './pages/Products';
import Ingredients from './pages/Ingredients';
import Clients from './pages/Clients';
import Shopping from './pages/Shopping';
import Layout from './components/Layout';
import PublicOrder from './pages/PublicOrder';
import Users from './pages/Users';
import Coupons from './pages/Coupons';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pedidos" element={<Orders />} />
        <Route path="cocina" element={<Kitchen />} />
        <Route path="stock" element={<ProtectedRoute adminOnly><Stock /></ProtectedRoute>} />
        <Route path="productos" element={<ProtectedRoute adminOnly><Products /></ProtectedRoute>} />
        <Route path="ingredientes" element={<ProtectedRoute adminOnly><Ingredients /></ProtectedRoute>} />
        <Route path="clientes" element={<ProtectedRoute adminOnly><Clients /></ProtectedRoute>} />
        <Route path="compras" element={<ProtectedRoute adminOnly><Shopping /></ProtectedRoute>} />
        <Route path="usuarios" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
        <Route path="cupones" element={<ProtectedRoute adminOnly><Coupons /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/pedido" element={<PublicOrder />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #333' },
          success: { iconTheme: { primary: '#E8B84B', secondary: '#1a1a1a' } }
        }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
