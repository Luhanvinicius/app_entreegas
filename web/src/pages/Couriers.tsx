import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Couriers() {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCouriers = async () => {
    const res = await api.get('/admin/couriers');
    setCouriers(res.data);
  };

  const saveCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/admin/couriers/${editingId}`, { name, email, phone });
      setEditingId(null);
      setName(''); setEmail(''); setPhone('');
      fetchCouriers();
    }
  };

  const deleteCourier = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente este entregador?')) {
      await api.delete(`/admin/couriers/${id}`);
      fetchCouriers();
    }
  };

  const startEdit = (courier: any) => {
    setEditingId(courier.id);
    setName(courier.name);
    setEmail(courier.email);
    setPhone(courier.phone);
  };

  const handleApproval = async (id: string, isApproved: boolean) => {
    await api.patch(`/admin/couriers/${id}/status`, { isApproved });
    fetchCouriers();
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await api.patch(`/admin/couriers/${id}/status`, { isActive: !isActive });
    fetchCouriers();
  };

  return (
    <div>
      <h1 style={{ marginBottom: '24px' }}>Gestão de Entregadores</h1>

      {editingId && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3>Editar Entregador</h3>
          <form onSubmit={saveCourier} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <input className="input-field" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} required />
            <input className="input-field" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input-field" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} required />
            <div style={{ gridColumn: 'span 3', display: 'flex', gap: '10px' }}>
               <button type="submit" className="btn-primary" style={{ flex: 1 }}>Salvar Alterações</button>
               <button type="button" onClick={() => setEditingId(null)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Aprovação</th>
              <th>Status de Acesso</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {couriers.map(courier => (
              <tr key={courier.id}>
                <td>{courier.name}</td>
                <td>{courier.email}</td>
                <td>{courier.phone}</td>
                <td>
                  {courier.isApproved ? (
                    <span style={{ color: 'green' }}>Aprovado</span>
                  ) : (
                    <span style={{ color: 'orange' }}>Pendente</span>
                  )}
                </td>
                <td>
                  {courier.isActive ? (
                    <span style={{ color: 'green' }}>Ativo</span>
                  ) : (
                    <span style={{ color: 'red' }}>Bloqueado</span>
                  )}
                </td>
                <td style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {!courier.isApproved && (
                    <button className="btn-primary" onClick={() => handleApproval(courier.id, true)} style={{ padding: '4px 8px', fontSize: '11px' }}>
                      Aprovar
                    </button>
                  )}
                  <button onClick={() => toggleActive(courier.id, courier.isActive)} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd' }}>
                    {courier.isActive ? 'Bloquear' : 'Desbloquear'}
                  </button>
                  <button onClick={() => startEdit(courier)} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd', color: 'blue' }}>
                    Editar
                  </button>
                  <button onClick={() => deleteCourier(courier.id)} style={{ padding: '4px 8px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ddd', color: 'red' }}>
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
