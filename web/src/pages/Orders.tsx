import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import { Plus, Clock, Bike } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [paymentType, setPaymentType] = useState('PIX');

  const endpoint = user?.role === 'ADMIN' ? '/admin/orders' : '/shop/orders';
  const isShop = user?.role === 'SHOPKEEPER';

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get(endpoint);
      setOrders(res.data);
    } catch (e) {}
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await api.patch(`${endpoint}/${id}/status`, { status: newStatus });
    fetchOrders();
  };

  const createDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/shop/orders', { customerName, customerPhone, deliveryAddress, totalAmount, deliveryFee, paymentType });
      setCustomerName(''); setCustomerPhone(''); setDeliveryAddress(''); setTotalAmount(''); setDeliveryFee('');
      fetchOrders();
    } catch(e) {} finally { setLoading(false); }
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'RECEIVED': return 'status-preparing';
      case 'PREPARING': return 'status-ready';
      case 'DISPATCHED': return 'status-dispatched';
      case 'DELIVERED': return 'status-delivered';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'RECEIVED': return 'Recebido';
      case 'PREPARING': return 'Preparando';
      case 'DISPATCHED': return 'Em Rota';
      case 'DELIVERED': return 'Entregue';
      default: return status;
    }
  };

  return (
    <div>
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
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--primary-gradient)', padding: '8px', borderRadius: '8px', color: 'white' }}>
              <Plus size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nova Entrega Expressa</h2>
          </div>
          
          <form onSubmit={createDelivery}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', margin: '0 0 6px 4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cliente / Destinatário</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
                  <input className="input-field" placeholder="Nome do Cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                  <input className="input-field" placeholder="Telefone (WhatsApp)" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', margin: '0 0 6px 4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pagamento</label>
                <select className="input-field" value={paymentType} onChange={e => setPaymentType(e.target.value)} required>
                  <option value="PIX">PIX</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="CARD">Cartão</option>
                </select>
              </div>
              
              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', margin: '0 0 6px 4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Endereço Completo</label>
                <input className="input-field" placeholder="Rua, Número, Bairro e Complemento" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} required />
              </div>
              
              <div>
                <label style={{ display: 'block', margin: '0 0 6px 4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total do Pedido</label>
                <input className="input-field" type="number" step="0.01" placeholder="R$ 0,00" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', margin: '0 0 6px 4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Taxa de Entrega</label>
                <input className="input-field" type="number" step="0.01" placeholder="R$ 0,00" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Publicando...' : 'Lançar Entrega'}
                </button>
              </div>
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
                    <div style={{ fontWeight: 700 }}>{order.customer?.name}</div>
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
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
