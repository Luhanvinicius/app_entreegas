import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { Package, Bike, Store, TrendingUp, Calendar, MapPin, Save, Edit2 } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, todayOrders: 0, deliveriesRealizadas: 0, activeStores: 0, productsCount: 0 });
  const [store, setStore] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStore, setEditedStore] = useState({ name: '', address: '', phone: '' });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/admin/dashboard').then(res => setStats(res.data));
    } else {
      api.get('/shop/dashboard').then(res => setStats(res.data));
      api.get('/shop/profile').then(res => {
        setStore(res.data);
        setEditedStore({ name: res.data.name, address: res.data.address || '', phone: res.data.phone });
      });
    }
  }, [user]);

  const handleUpdateStore = async () => {
    try {
      await api.put('/shop/profile', editedStore);
      setStore({ ...store, ...editedStore });
      setIsEditing(false);
      alert('Dados da loja atualizados com sucesso!');
    } catch (e) {
      alert('Erro ao atualizar dados da loja.');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ 
        background: color, 
        padding: '12px', 
        borderRadius: '12px', 
        color: 'white',
        boxShadow: `0 4px 12px ${color}44`
      }}>
        <Icon size={24} />
      </div>
      <div>
        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '4px' }}>{title}</h3>
        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{value}</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Bem-vindo ao centro de controle do Entregas.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
          <Calendar size={18} />
          {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <StatCard title="Pedidos de Hoje" value={stats.todayOrders} icon={TrendingUp} color="#EB1B2E" />
        
        {user?.role === 'ADMIN' ? (
          <>
            <StatCard title="Lojas Ativas" value={stats.activeStores || 0} icon={Store} color="#0EA5E9" />
            <StatCard title="Entregas Feitas" value={stats.deliveriesRealizadas || 0} icon={Bike} color="#10B981" />
          </>
        ) : (
          <StatCard title="Meus Produtos" value={stats.productsCount || 0} icon={Package} color="#8B5CF6" />
        )}

        <StatCard title="Total Acumulado" value={stats.totalOrders} icon={Package} color="#64748B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
        <div className="card" style={{ minHeight: "340px", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem', background: 'linear-gradient(to bottom right, #ffffff, #f8fafb)' }}>
          <div style={{ background: 'rgba(235, 27, 46, 0.05)', padding: '24px', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <TrendingUp size={48} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Análise de Desempenho</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>Em breve você poderá visualizar gráficos detalhados de vendas e entregas diretamente aqui.</p>
        </div>

        {user?.role === 'SHOPKEEPER' && store && (
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Dados da Loja</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}
              >
                {isEditing ? 'Cancelar' : <Edit2 size={16} color="#64748B" />}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Nome da Loja</label>
                  {isEditing ? (
                    <input className="input-field" value={editedStore.name} onChange={e => setEditedStore({...editedStore, name: e.target.value})} />
                  ) : (
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', marginTop: '4px' }}>{store.name}</p>
                  )}
               </div>

               <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Endereço de Retirada</label>
                  {isEditing ? (
                    <input className="input-field" value={editedStore.address} onChange={e => setEditedStore({...editedStore, address: e.target.value})} placeholder="Ex: Rua A, 123" />
                  ) : (
                    <div style={{ flexDirection: 'row', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                       <MapPin size={14} color="#EB1B2E" />
                       <p style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>{store.address || 'Não cadastrado'}</p>
                    </div>
                  )}
               </div>

               <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Telefone</label>
                  {isEditing ? (
                    <input className="input-field" value={editedStore.phone} onChange={e => setEditedStore({...editedStore, phone: e.target.value})} />
                  ) : (
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', marginTop: '4px' }}>{store.phone}</p>
                  )}
               </div>

               {isEditing && (
                 <button onClick={handleUpdateStore} className="btn-primary" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Save size={18} />
                    Salvar Alterações
                 </button>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
