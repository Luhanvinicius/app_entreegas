import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Stores() {
  const [stores, setStores] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const res = await api.get('/admin/stores');
    setStores(res.data);
  };

  const saveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/admin/stores/${editingId}`, { name, description, phone, address });
      setEditingId(null);
    } else {
      await api.post('/admin/stores', { name, description, phone, address, ownerEmail, ownerPassword });
    }
    setName(''); setDescription(''); setPhone(''); setAddress(''); setOwnerEmail(''); setOwnerPassword('');
    fetchStores();
  };

  const deleteStore = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta loja?')) {
      await api.delete(`/admin/stores/${id}`);
      fetchStores();
    }
  };

  const startEdit = (store: any) => {
    setEditingId(store.id);
    setName(store.name);
    setDescription(store.description);
    setPhone(store.phone);
    setAddress(store.address || '');
  };

  const toggleStore = async (id: string, current: boolean) => {
    await api.patch(`/admin/stores/${id}/toggle`, { isActive: !current });
    fetchStores();
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Gestão de Lojas</h1>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3>{editingId ? 'Editar Loja' : 'Nova Loja'}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
          {editingId ? 'Atualize os dados da loja selecionada.' : 'O e-mail e a senha cadastrados aqui servirão para o Lojista acessar a plataforma Web e o App.'}
        </p>
        <form onSubmit={saveStore} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <input className="input-field" placeholder="Nome da Loja" value={name} onChange={e => setName(e.target.value)} required />
          <input className="input-field" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} required />
          <input className="input-field" placeholder="Descrição" value={description} onChange={e => setDescription(e.target.value)} required style={{ gridColumn: 'span 2' }} />
          <input className="input-field" placeholder="Endereço (Retirada)" value={address} onChange={e => setAddress(e.target.value)} required style={{ gridColumn: 'span 2' }} />
          
          {!editingId && (
            <>
              <input className="input-field" type="email" placeholder="E-mail do Lojista" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required />
              <input className="input-field" type="password" placeholder="Senha do Lojista" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} required />
            </>
          )}
          
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, height: '48px' }}>
               {editingId ? 'Atualizar' : 'Salvar'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setName(''); setDescription(''); setPhone(''); setAddress(''); }} className="btn-secondary" style={{ flex: 1, height: '48px' }}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {stores.map(store => (
              <tr key={store.id}>
                <td>{store.name}</td>
                <td>{store.phone}</td>
                <td>{store.isActive ? <span style={{ color: 'green' }}>Ativa</span> : <span style={{ color: 'red' }}>Inativa</span>}</td>
                <td>
                  <button onClick={() => toggleStore(store.id, store.isActive)} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd', marginRight: '6px' }}>
                    {store.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button onClick={() => startEdit(store)} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd', marginRight: '6px', color: 'blue' }}>
                    Editar
                  </button>
                  <button onClick={() => deleteStore(store.id)} style={{ padding: '4px 8px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd', color: 'red' }}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
