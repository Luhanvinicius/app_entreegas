import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Store, Users, Bike, LogOut, Package } from 'lucide-react';
import { useAuth } from './App';

export default function Layout() {
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isShop = user?.role === 'SHOPKEEPER';
  
  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '10px', color: 'white' }}>
              <Bike size={24} />
            </div>
            <span>{isAdmin ? 'Admin Panel' : 'Loja Panel'}</span>
          </div>
        </div>
        
        <div style={{ flex: 1, padding: '0 1rem' }}>
          <p style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Menu Principal</p>
          
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          
          {isAdmin && (
            <NavLink to="/stores" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Store size={20} /> Lojas
            </NavLink>
          )}
          
          <NavLink to="/orders" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Bike size={20} /> Pedidos
          </NavLink>

          {isShop && (
            <NavLink to="/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Package size={20} /> Meus Produtos
            </NavLink>
          )}
          
          {isAdmin && (
            <NavLink to="/couriers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} /> Entregadores
            </NavLink>
          )}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-main)' }}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</p>
            </div>
          </div>
          <button className="nav-link" style={{ background: 'rgba(235, 27, 46, 0.05)', textAlign: 'left', width: 'calc(100% - 2rem)', margin: '0 1rem', color: 'var(--primary)' }} onClick={logout}>
            <LogOut size={20} /> Sair
          </button>
        </div>
      </div>

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
