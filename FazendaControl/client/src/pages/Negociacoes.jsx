import { useState, useEffect } from 'react';
import { Plus, Search, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

function Negociacoes() {
  const [negociacoes, setNegociacoes] = useState([]);
  const [animais, setAnimais] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  
  const [form, setForm] = useState({
    tipo: 'venda',
    cliente_id: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    preco_arroba: '',
    animais: []
  });

  useEffect(() => {
    loadData();
  }, [filtroTipo]);

  async function loadData() {
    try {
      const params = filtroTipo ? `?tipo=${filtroTipo}` : '';
      const [negRes, animaisRes, clientesRes] = await Promise.all([
        api.get(`/negociacoes${params}`),
        api.get('/animais?status=disponivel'),
        api.get('/clientes')
      ]);
      setNegociacoes(negRes);
      setAnimais(animaisRes);
      setClientes(clientesRes);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!form.cliente_id) {
      alert('Selecione um cliente/fornecedor');
      return;
    }
    
    if (form.animais.length === 0) {
      alert('Selecione pelo menos um animal');
      return;
    }

    try {
      await api.post('/negociacoes', form);
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleDelete(id) {
    if (confirm('Tem certeza que deseja excluir esta negociação?')) {
      try {
        await api.delete(`/negociacoes/${id}`);
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  function resetForm() {
    setForm({
      tipo: 'venda',
      cliente_id: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      preco_arroba: '',
      animais: []
    });
  }

  function toggleAnimal(animal) {
    const exists = form.animais.find(a => a.animal_id === animal.id);
    if (exists) {
      setForm({
        ...form,
        animais: form.animais.filter(a => a.animal_id !== animal.id)
      });
    } else {
      setForm({
        ...form,
        animais: [...form.animais, { 
          animal_id: animal.id, 
          brinco: animal.brinco,
          peso: animal.peso_atual || 0 
        }]
      });
    }
  }

  function updateAnimalPeso(brinco, peso) {
    setForm({
      ...form,
      animais: form.animais.map(a => 
        a.brinco === brinco ? { ...a, peso: parseFloat(peso) || 0 } : a
      )
    });
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const calcularTotal = () => {
    if (!form.preco_arroba) return 0;
    const pesoTotal = form.animais.reduce((sum, a) => sum + (a.peso || 0), 0);
    return (pesoTotal / 15) * parseFloat(form.preco_arroba);
  };

  if (loading) {
    return <div className="text-center" style={{padding: '40px'}}>Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Negociações</h1>
          <p>Registro de compras e vendas de animais</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} />
          Nova Negociação
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex gap-4">
          <button 
            className={`btn ${filtroTipo === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('')}
          >
            Todas
          </button>
          <button 
            className={`btn ${filtroTipo === 'venda' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('venda')}
          >
            Vendas
          </button>
          <button 
            className={`btn ${filtroTipo === 'compra' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('compra')}
          >
            Compras
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente/Fornecedor</th>
                <th>Tipo</th>
                <th>Qtd</th>
                <th>Peso Total</th>
                <th>Valor Total</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {negociacoes.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted" style={{padding: '40px'}}>
                    Nenhuma negociação encontrada
                  </td>
                </tr>
              ) : (
                negociacoes.map(n => (
                  <tr key={n.id}>
                    <td>{format(new Date(n.data), 'dd/MM/yyyy')}</td>
                    <td className="font-medium">{n.cliente_nome}</td>
                    <td>
                      <span className={`badge ${n.tipo === 'venda' ? 'badge-success' : 'badge-info'}`}>
                        {n.tipo === 'venda' ? 'Venda' : 'Compra'}
                      </span>
                    </td>
                    <td>{n.quantidade_animais}</td>
                    <td>{n.peso_total ? `${n.peso_total.toFixed(1)} kg` : '-'}</td>
                    <td className="font-medium">{formatCurrency(n.valor_total)}</td>
                    <td>
                      <span className={`badge ${n.situacao === 'concluida' ? 'badge-success' : 'badge-warning'}`}>
                        {n.situacao === 'concluida' ? 'Concluída' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn danger" onClick={() => handleDelete(n.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Negociação</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select
                      className="form-input"
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    >
                      <option value="venda">Venda</option>
                      <option value="compra">Compra</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cliente/Fornecedor *</label>
                    <select
                      className="form-input"
                      value={form.cliente_id}
                      onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.data}
                      onChange={(e) => setForm({ ...form, data: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preço da Arroba (R$)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.preco_arroba}
                      onChange={(e) => setForm({ ...form, preco_arroba: e.target.value })}
                      placeholder="Ex: 280.00"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Selecionar Animais ({form.animais.length} selected)</label>
                  <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '8px'
                  }}>
                    {animais.length === 0 ? (
                      <div className="text-center text-muted" style={{ padding: '20px' }}>
                        Não há animais disponíveis
                      </div>
                    ) : (
                      animais.map(a => {
                        const selected = form.animais.find(an => an.animal_id === a.id);
                        return (
                          <div 
                            key={a.id}
                            onClick={() => toggleAnimal(a)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              background: selected ? 'var(--primary)' : 'transparent',
                              color: selected ? 'white' : 'inherit',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '4px'
                            }}
                          >
                            <span>
                              <strong>{a.brinco}</strong> - {a.sexo === 'macho' ? 'Macho' : 'Fêmea'}
                              {a.raca && ` - ${a.raca}`}
                            </span>
                            <span>{a.peso_atual ? `${a.peso_atual} kg` : 'Sem peso'}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {form.animais.length > 0 && (
                  <div style={{ 
                    background: 'var(--bg)', 
                    padding: '16px', 
                    borderRadius: 'var(--radius)',
                    marginTop: '16px'
                  }}>
                    <label className="form-label">Pesar Animais (kg)</label>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {form.animais.map(a => (
                        <div key={a.animal_id} className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '12px' }}>{a.brinco}</label>
                          <input
                            type="number"
                            className="form-input"
                            value={a.peso}
                            onChange={(e) => updateAnimalPeso(a.brinco, e.target.value)}
                            placeholder="kg"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ 
                  marginTop: '20px', 
                  padding: '16px', 
                  background: 'var(--primary)', 
                  color: 'white',
                  borderRadius: 'var(--radius)'
                }}>
                  <div className="flex justify-between items-center">
                    <span>Total: {form.animais.length} animais</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {formatCurrency(calcularTotal())}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar {form.tipo === 'venda' ? 'Venda' : 'Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Negociacoes;
