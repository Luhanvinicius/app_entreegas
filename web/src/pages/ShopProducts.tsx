import { useEffect, useState } from 'react';
import { api } from '../api';
import { Package, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ShopProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/shop/products');
      setProducts(res.data);
    } catch (e) {}
  };

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/shop/products', { name, description, price: Number(price), imageUrl: imageUrl || 'https://placehold.co/200' });
      setName(''); setDescription(''); setPrice(''); setImageUrl('');
      fetchProducts();
    } catch (e) {} finally { setLoading(false); }
  };

  const toggleProduct = async (id: string, current: boolean) => {
    await api.patch(`/shop/products/${id}/toggle`, { isAvailable: !current });
    fetchProducts();
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Meus Produtos</h1>
          <p className="page-subtitle">Gerencie o cardápio e a disponibilidade dos seus itens.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(235, 27, 46, 0.05)', padding: '10px 20px', borderRadius: '12px', border: '1px solid rgba(235, 27, 46, 0.1)', color: 'var(--primary)', fontWeight: 700 }}>
          <Package size={20} />
          <span>{products.length} Produtos</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--primary-gradient)', padding: '10px', borderRadius: '10px', color: 'white' }}>
              <Plus size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Novo Produto</h2>
          </div>
          
          <form onSubmit={createProduct}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', margin: '0 0 6px 4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nome</label>
                <input className="input-field" placeholder="Ex: Hambúrguer Clássico" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label style={{ display: 'block', margin: '0 0 6px 4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Preço (R$)</label>
                <input className="input-field" type="number" step="0.01" placeholder="0,00" value={price} onChange={e => setPrice(e.target.value)} required />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', margin: '0 0 6px 4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Descrição</label>
              <textarea 
                className="input-field" 
                placeholder="Descreva os ingredientes ou detalhes do produto..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                required 
                style={{ height: '100px', resize: 'none' }}
              />
            </div>
            
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Produto'}
            </button>
          </form>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700 }}>Lista de Produtos</h3>
          </div>
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Produto</th>
                <th>Preço</th>
                <th>Disponível</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    Ainda não há produtos cadastrados.
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>R$ {p.price.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${p.isAvailable ? 'status-delivered' : 'status-preparing'}`} style={{ cursor: 'pointer' }} onClick={() => toggleProduct(p.id, p.isAvailable)}>
                        {p.isAvailable ? 'Ativo' : 'Pausado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => toggleProduct(p.id, p.isAvailable)} 
                        style={{ background: 'transparent', color: p.isAvailable ? '#D97706' : '#16A34A', fontSize: '0.8125rem', fontWeight: 700 }}
                      >
                        {p.isAvailable ? <ToggleLeft size={24} /> : <ToggleRight size={24} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
