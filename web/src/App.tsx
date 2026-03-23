import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { create } from 'zustand';
import { api } from './api';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Layout from './Layout';
import Stores from './pages/Stores';
import Couriers from './pages/Couriers';
import Orders from './pages/Orders';
import ShopProducts from './pages/ShopProducts';

import { persist } from 'zustand/middleware';

export const useAuth = create<{
  user: any; token: string | null; setUser: (u: any, t: string) => void; logout: () => void;
}>()(
  persist(
    (set) => ({
      user: null, token: null,
      setUser: (user, token) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ user, token });
      },
      logout: () => {
        api.defaults.headers.common['Authorization'] = '';
        set({ user: null, token: null });
      }
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.token) api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      }
    }
  )
);

export default function App() {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'ADMIN';
  const isShop = user?.role === 'SHOPKEEPER';

  return (
    <BrowserRouter>
      <Routes>
        {(!isAdmin && !isShop) ? (
          <Route path="*" element={<Login />} />
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            {isAdmin && <Route path="/stores" element={<Stores />} />}
            {isAdmin && <Route path="/couriers" element={<Couriers />} />}
            {isShop && <Route path="/products" element={<ShopProducts />} />}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
