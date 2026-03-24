import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { Plus, Clock, Bike, Truck, Loader2, MapPin, Copy } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [storeAddress, setStoreAddress] = useState('');
  const [paymentModalOrder, setPaymentModalOrder] = useState<any>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    deliveryFee: 0,
    distance: 0,
    totalAmount: '',
    paymentMethod: 'ADVANCE' as 'ADVANCE' | 'ON_DELIVERY'
  });

  const endpoint = user?.role === 'ADMIN' ? '/admin/orders' : '/shop/orders';
  const isShop = user?.role === 'SHOPKEEPER';

  useEffect(() => {
    fetchOrders();
    if (isShop) fetchStoreProfile();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Polling automático de pagamento
  useEffect(() => {
    let pollInterval: any;
    if (paymentModalOrder) {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.get(`/orders/${paymentModalOrder.id}/check-payment`);
          if (res.data.paid) {
             // Notificação de sucesso antes de fechar
             alert('✅ Pagamento Confirmado! Sua entrega acaba de ser liberada.');
             setPaymentModalOrder(null);
             fetchOrders();
          }
        } catch (e) {}
      }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [paymentModalOrder]);

  // Monitora mudança no endereço para cálculo automático
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newOrder.address.length > 8 && storeAddress) {
        handleCalculateFee();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [newOrder.address, storeAddress]);

  const fetchStoreProfile = async () => {
    try {
      const res = await api.get('/shop/profile');
      setStoreAddress(res.data.address);
    } catch (e) {}
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get(endpoint);
      setOrders(res.data);
    } catch (e) {}
  };

  const handleCalculateFee = async () => {
    if (!newOrder.address || !storeAddress) return;
    setCalculatingFee(true);
    try {
      const res = await api.post('/calculate-delivery', {
        pickup_address: storeAddress,
        delivery_address: newOrder.address,
        price_per_km: 2.5
      });
      setNewOrder(prev => ({ 
        ...prev, 
        deliveryFee: res.data.delivery_fee,
        distance: res.data.distance_km 
      }));
    } catch (error) {
      console.error('Erro ao calcular taxa');
    } finally {
      setCalculatingFee(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await api.patch(`${endpoint}/${id}/status`, { status: newStatus });
    fetchOrders();
  };

  const createDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.deliveryFee) {
       alert('Aguarde o cálculo da taxa de entrega.');
       return;
    }
    setLoading(true);
    try {
      const response = await api.post('/orders', { 
        ...newOrder,
        totalAmount: Number(newOrder.totalAmount)
      });

      if (response.data.pixQrCode && newOrder.paymentMethod === 'ADVANCE') {
        setPaymentModalOrder(response.data);
      } else {
        alert('🚀 Entrega lançada com sucesso!');
      }

      setNewOrder({ 
        customerName: '', 
        customerPhone: '', 
        address: '', 
        deliveryFee: 0, 
        distance: 0, 
        totalAmount: '', 
        paymentMethod: 'ADVANCE' 
      });
      fetchOrders();
    } catch(e) {
      alert('Erro ao lançar entrega');
    } finally { setLoading(false); }
  };

  const handleCheckPayment = async () => {
    if (!paymentModalOrder) return;
    setCheckingPayment(true);
    try {
      const res = await api.get(`/orders/${paymentModalOrder.id}/check-payment`);
      if (res.data.paid) {
        alert('✅ Taxa confirmada! Entrega liberada para os entregadores.');
        setPaymentModalOrder(null);
        fetchOrders();
      } else {
        alert('Aguardando compensação do Pix... (Pode demorar uns segundos)');
      }
    } catch (e) {
      alert('Erro ao verificar pagamento');
    } finally {
      setCheckingPayment(false);
    }
  };


  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'RECEIVED': return 'status-preparing';
      case 'ACCEPTED': return 'status-ready'; // Adicionado status Aceito
      case 'PREPARING': return 'status-ready';
      case 'DISPATCHED': return 'status-dispatched';
      case 'DELIVERED': return 'status-delivered';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'RECEIVED': return 'Recebido';
      case 'ACCEPTED': return 'Aceito pelo Motoboy'; // Melhoria de visibilidade
      case 'PREPARING': return 'Preparando';
      case 'DISPATCHED': return 'Em Rota';
      case 'DELIVERED': return 'Entregue';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Entregas em Tempo Real</h1>
          <p className="page-subtitle">Acompanhe e gerencie o fluxo de pedidos de forma dinâmica.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(34, 197, 94, 0.1)', padding: '10px 16px', borderRadius: '12px', color: '#16A34A', fontWeight: 700 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite' }}></div>
          <span>Sistema Ativo</span>
        </div>
      </div>

      {isShop && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Truck className="text-white" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Nova Entrega Expresso</h2>
           </div>

           <form onSubmit={createDelivery} className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente / Destinatário</label>
                <input type="text" placeholder="Nome do Cliente" className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" value={newOrder.customerName} onChange={e => setNewOrder({...newOrder, customerName: e.target.value})} required />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">WhatsApp</label>
                <input type="text" placeholder="(85) 99999-9999" className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" value={newOrder.customerPhone} onChange={e => setNewOrder({...newOrder, customerPhone: e.target.value})} required />
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Regra de Cobrança</label>
                <select className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none" value={newOrder.paymentMethod} onChange={e => setNewOrder({...newOrder, paymentMethod: e.target.value as any})}>
                   <option value="ADVANCE">Pedido já Pago (Venda Online)</option>
                   <option value="ON_DELIVERY">Cobrar na Entrega (via Pix)</option>
                </select>
              </div>
              <div className="md:col-span-12 space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Endereço de Entrega Completo</label>
                <input type="text" placeholder="Rua, Número, Bairro" className="w-full px-4 py-3 bg-gray-50 border border-red-100 rounded-xl font-medium outline-none" value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} required />
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
                <button type="submit" disabled={loading || calculatingFee || !newOrder.deliveryFee} className="w-full py-4 bg-red-600 text-white font-black rounded-xl shadow-lg hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95">
                  {loading ? 'LANÇANDO...' : 'LANÇAR ENTREGA'}
                </button>
              </div>
           </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>Pedido Info</th>
              <th>Destino</th>
              <th>Financeiro</th>
              <th>Logística</th>
              <th>Status</th>
              <th style={{ textAlign: 'right', paddingRight: '24px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                  Nenhuma entrega ativa no momento.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.id}>
                  <td style={{ paddingLeft: '24px' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.875rem' }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <Clock size={12} />
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{order.customerName || (order.customer ? order.customer.name : 'Avulso')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.address}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800 }}>R$ {order.totalAmount.toFixed(2)}</div>
                    <div style={{ fontSize: '0.6875rem', color: '#16A34A', fontWeight: 700 }}>Taxa: R$ {order.deliveryFee?.toFixed(2) || '0.00'}</div>
                  </td>
                  <td>
                    {order.courier ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: 'var(--primary-gradient)', padding: '4px', borderRadius: '4px', color: 'white' }}>
                          <Bike size={12} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{order.courier.name}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontStyle: 'italic' }}>Aguardando...</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <select 
                      value={order.status} 
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                    >
                      <option value="RECEIVED">Recebido</option>
                      <option value="PREPARING">Preparando</option>
                      <option value="DISPATCHED">Em Rota</option>
                      <option value="DELIVERED">Entregue</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Pagamento da Taxa */}
      {paymentModalOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', overflow: 'hidden', animation: 'scaleUp 0.3s ease' }}>
            <div style={{ background: '#EF4444', padding: '24px', color: 'white', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Pagar Taxa de Entrega</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.875rem', opacity: 0.9 }}>Pague o Pix para liberar sua entrega agora</p>
            </div>
            
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ background: '#F3F4F6', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
                <img src={`data:image/png;base64,${paymentModalOrder.pixQrCode}`} style={{ width: '192px', height: '192px' }} alt="QR Code Pix" />
              </div>
              
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#1F2937', margin: 0 }}>R$ {paymentModalOrder.deliveryFee.toFixed(2)}</p>
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(paymentModalOrder.pixCode || '');
                    alert('Código Copia e Cola copiado!');
                  }}
                  style={{ width: '100%', padding: '16px', background: '#F3F4F6', color: '#374151', fontWeight: 700, border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <Copy size={18} />
                  Copiar Código Pix
                </button>

                <button 
                  onClick={handleCheckPayment}
                  disabled={checkingPayment}
                  style={{ width: '100%', padding: '16px', background: checkingPayment ? '#F87171' : '#EF4444', color: 'white', fontWeight: 800, border: 'none', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {checkingPayment ? <Loader2 className="animate-spin" size={20} /> : 'Já realizei o pagamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
