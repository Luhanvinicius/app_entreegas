import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Package, Store as StoreIcon, TrendingUp, Edit2, X, MapPin, Phone, DollarSign, Save, Calendar } from 'lucide-react';

interface Stats {
  totalDeliveries: number;
  revenue: number;
  todayOrders: number;
  productsCount: number;
}

interface StoreData {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editForm, setEditForm] = useState<StoreData>({
    id: '',
    name: '',
    address: '',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, storeRes] = await Promise.all([
        api.get('/shop/dashboard'),
        api.get('/shop/profile')
      ]);
      setStats(statsRes.data);
      setStoreData(storeRes.data);
      setEditForm(storeRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados');
    }
  };

  const handleSaveStore = async () => {
    try {
      await api.put('/shop/profile', editForm);
      setStoreData(editForm);
      setIsEditing(false);
      alert('Dados da loja atualizados!');
    } catch (error) {
      alert('Erro ao salvar dados da loja');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div style={{ background: color }} className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg">
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="page-header flex justify-between items-end mb-4">
        <div>
           <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Análise Geral</p>
           <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Seu Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border text-sm font-bold text-gray-500 shadow-sm">
           <Calendar size={18} className="text-red-500" />
           {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Entregas" value={stats?.totalOrders || 0} icon={Package} color="#EB1B2E" />
        <StatCard title="Faturamento" value={`R$ ${(stats?.revenue || 0).toFixed(2)}`} icon={DollarSign} color="#16A34A" />
        <StatCard title="Pedidos Hoje" value={stats?.todayOrders || 0} icon={TrendingUp} color="#2563EB" />
        <StatCard title="Produtos" value={stats?.productsCount || 0} icon={StoreIcon} color="#9333EA" />
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <StoreIcon className="text-gray-400" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Configuração da Loja</h2>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 text-red-600 font-bold hover:bg-red-50 px-4 py-2 rounded-lg transition-all">
            {isEditing ? <><X size={18} /> Cancelar</> : <><Edit2 size={18} /> Editar Perfil</>}
          </button>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
               <label className="text-xs text-gray-400 font-bold uppercase">Nome do Estabelecimento</label>
               <input className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
             </div>
             <div className="space-y-2">
               <label className="text-xs text-gray-400 font-bold uppercase">Endereço (Ponto de Partida)</label>
               <input className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
             </div>
             <div className="space-y-2">
               <label className="text-xs text-gray-400 font-bold uppercase">WhatsApp da Loja</label>
               <input className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
             </div>
             <button onClick={handleSaveStore} className="md:col-span-3 bg-red-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg transition-all active:scale-95">
               <Save size={18} /> SALVAR ALTERAÇÕES
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <StoreIcon className="text-red-500" size={24} />
              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loja</p><p className="font-bold text-gray-900">{storeData?.name || 'Não configurado'}</p></div>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <MapPin className="text-red-500" size={24} />
              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Localização</p><p className="font-bold text-gray-900">{storeData?.address || 'Não configurado'}</p></div>
            </div>
            <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <Phone className="text-red-500" size={24} />
              <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contato</p><p className="font-bold text-gray-900">{storeData?.phone || 'Não configurado'}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
