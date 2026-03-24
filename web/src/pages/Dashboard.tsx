import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Package, Truck, Store as StoreIcon, TrendingUp, Edit2, Check, X, MapPin, Phone, Loader2, DollarSign, Save } from 'lucide-react';

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
  const [calculatingFee, setCalculatingFee] = useState(false);
  
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    deliveryFee: 0,
    totalAmount: '',
    paymentType: 'PIX'
  });

  const [editForm, setEditForm] = useState<StoreData>({
    id: '',
    name: '',
    address: '',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Monitora mudança no endereço para cálculo automático
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newOrder.address.length > 8 && storeData?.address) {
        handleCalculateFee();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [newOrder.address]);

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

  const handleCalculateFee = async () => {
    if (!newOrder.address || !storeData?.address) return;
    setCalculatingFee(true);
    try {
      const res = await api.post('/calculate-delivery', {
        pickup_address: storeData.address,
        delivery_address: newOrder.address,
        price_per_km: 2.5
      });
      setNewOrder(prev => ({ ...prev, deliveryFee: res.data.delivery_fee }));
    } catch (error) {
      console.error('Erro ao calcular taxa');
    } finally {
      setCalculatingFee(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.deliveryFee) {
      alert('Aguarde o cálculo da taxa de entrega.');
      return;
    }
    try {
      await api.post('/shop/orders', {
        ...newOrder,
        totalAmount: Number(newOrder.totalAmount)
      });
      alert('🚀 Entrega lançada com sucesso!');
      setNewOrder({ customerName: '', customerPhone: '', address: '', deliveryFee: 0, totalAmount: '', paymentType: 'PIX' });
      fetchData();
    } catch (error) {
      alert('Erro ao lançar entrega');
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
      {/* Formulário de Nova Entrega Expressa */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
             <Truck className="text-white" size={20} />
           </div>
           <h2 className="text-2xl font-bold text-gray-900">Nova Entrega Expresso</h2>
        </div>

        <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-12 gap-6">
           <div className="md:col-span-4 space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente / Destinatário</label>
             <input type="text" placeholder="Nome do Cliente" className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={newOrder.customerName} onChange={e => setNewOrder({...newOrder, customerName: e.target.value})} required />
           </div>
           <div className="md:col-span-4 space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">WhatsApp</label>
             <input type="text" placeholder="(85) 99999-9999" className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={newOrder.customerPhone} onChange={e => setNewOrder({...newOrder, customerPhone: e.target.value})} required />
           </div>
           <div className="md:col-span-4 space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pagamento</label>
             <select className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-red-500" value={newOrder.paymentType} onChange={e => setNewOrder({...newOrder, paymentType: e.target.value})}>
                <option value="PIX">PIX</option>
                <option value="CASH">Dinheiro</option>
                <option value="CARD">Cartão (Entregador leva)</option>
             </select>
           </div>
           <div className="md:col-span-12 space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Endereço de Entrega Completo (Fortaleza)</label>
             <input type="text" placeholder="Rua, Número, Bairro" className="w-full px-4 py-3 bg-gray-50 border border-red-100 rounded-xl font-medium outline-none focus:ring-2 focus:ring-red-500" value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} required />
           </div>
           <div className="md:col-span-4 space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total do Pedido</label>
             <input type="number" placeholder="0.00" className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold outline-none" value={newOrder.totalAmount} onChange={e => setNewOrder({...newOrder, totalAmount: e.target.value})} step="0.01" required />
           </div>
           <div className="md:col-span-4 space-y-2">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Taxa de Entrega (Auto)</label>
             <div className="w-full px-4 py-3 bg-gray-100 border rounded-xl flex items-center justify-between">
                {calculatingFee ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <Loader2 className="animate-spin" size={16} />
                    <span className="text-xs font-bold uppercase">Calculando...</span>
                  </div>
                ) : (
                  <span className="text-xl font-black text-gray-900">R$ {newOrder.deliveryFee.toFixed(2)}</span>
                )}
                <MapPin size={16} className="text-gray-400" />
             </div>
           </div>
           <div className="md:col-span-4 flex items-end">
             <button type="submit" disabled={calculatingFee || !newOrder.deliveryFee} className="w-full py-4 bg-red-600 text-white font-black rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95">
               LANÇAR ENTREGA
             </button>
           </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Entregas" value={stats?.totalDeliveries || 0} icon={Package} color="#EB1B2E" />
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
