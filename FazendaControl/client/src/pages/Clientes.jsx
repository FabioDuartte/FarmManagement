import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Phone, Mail, MapPin } from 'lucide-react';
import api from '../utils/api';

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  const [form, setForm] = useState({
    nome: '',
    tipo: 'ambos',
    cpf_cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: ''
  });

  useEffect(() => {
    loadClientes();
  }, []);

  async function loadClientes() {
    try {
      const data = await api.get('/clientes');
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingCliente) {
        await api.put(`/clientes/${editingCliente.id}`, form);
      } else {
        await api.post('/clientes', form);
      }
      setShowModal(false);
      resetForm();
      loadClientes();
    } catch (error) {
      alert(error.message);
    }
  }

  function openEdit(cliente) {
    setEditingCliente(cliente);
    setForm({
      nome: cliente.nome,
      tipo: cliente.tipo,
      cpf_cnpj: cliente.cpf_cnpj || '',
      telefone: cliente.telefone || '',
      email: cliente.email || '',
      endereco: cliente.endereco || '',
      observacoes: cliente.observacoes || ''
    });
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await api.delete(`/clientes/${id}`);
        loadClientes();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  async function viewDetails(id) {
    try {
      const data = await api.get(`/clientes/${id}`);
      setSelectedCliente(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  }

  function resetForm() {
    setForm({
      nome: '',
      tipo: 'ambos',
      cpf_cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      observacoes: ''
    });
    setEditingCliente(null);
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.cpf_cnpj && c.cpf_cnpj.includes(search)) ||
    (c.telefone && c.telefone.includes(search))
  );

  const getTipoBadge = (tipo) => {
    const badges = {
      comprador: 'badge-info',
      fornecedor: 'badge-warning',
      ambos: 'badge-success'
    };
    const labels = {
      comprador: 'Comprador',
      fornecedor: 'Fornecedor',
      ambos: 'Ambos'
    };
    return (
      <span className={`badge ${badges[tipo]}`}>
        {labels[tipo]}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center" style={{padding: '40px'}}>Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Clientes e Fornecedores</h1>
          <p>Gestão de parceiros comerciais</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      <div className="card mb-4">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF/CNPJ ou telefone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-3">
        {clientesFiltrados.map(cliente => (
          <div key={cliente.id} className="card" style={{ cursor: 'pointer' }} onClick={() => viewDetails(cliente.id)}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">{cliente.nome}</h3>
              {getTipoBadge(cliente.tipo)}
            </div>
            
            {cliente.cpf_cnpj && (
              <div className="text-sm text-muted mb-2">{cliente.cpf_cnpj}</div>
            )}
            
            {cliente.telefone && (
              <div className="flex items-center gap-2 text-sm mb-2">
                <Phone size={14} />
                {cliente.telefone}
              </div>
            )}
            
            {cliente.email && (
              <div className="flex items-center gap-2 text-sm text-muted mb-2">
                <Mail size={14} />
                {cliente.email}
              </div>
            )}
            
            <div className="flex gap-2" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--bg-gray)' }}>
              <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); openEdit(cliente); }}>
                <Edit2 size={14} />
                Editar
              </button>
              <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); handleDelete(cliente.id); }}>
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {clientesFiltrados.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <h3>Nenhum cliente encontrado</h3>
            <p>Cadastre seu primeiro cliente ou fornecedor</p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-input"
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    <option value="ambos">Ambos</option>
                    <option value="comprador">Comprador</option>
                    <option value="fornecedor">Fornecedor</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">CPF/CNPJ</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.cpf_cnpj}
                      onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.telefone}
                      onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    className="form-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Endereço</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.endereco}
                    onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCliente ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCliente && (
        <div className="modal-overlay" onClick={() => setSelectedCliente(null)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCliente.nome}</h2>
              <button className="modal-close" onClick={() => setSelectedCliente(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="flex gap-4 mb-4">
                {getTipoBadge(selectedCliente.tipo)}
              </div>
              
              <div className="grid grid-2 gap-4 mb-4">
                <div className="stat-card">
                  <div className="label">A Receber</div>
                  <div className="value success">{formatCurrency(selectedCliente.total_a_receber)}</div>
                </div>
                <div className="stat-card">
                  <div className="label">A Pagar</div>
                  <div className="value warning">{formatCurrency(selectedCliente.total_a_pagar)}</div>
                </div>
              </div>
              
              {selectedCliente.cpf_cnpj && (
                <div className="mb-2"><strong>CPF/CNPJ:</strong> {selectedCliente.cpf_cnpj}</div>
              )}
              {selectedCliente.telefone && (
                <div className="mb-2"><strong>Telefone:</strong> {selectedCliente.telefone}</div>
              )}
              {selectedCliente.email && (
                <div className="mb-2"><strong>E-mail:</strong> {selectedCliente.email}</div>
              )}
              {selectedCliente.endereco && (
                <div className="mb-2"><strong>Endereço:</strong> {selectedCliente.endereco}</div>
              )}
              
              {selectedCliente.negociacoes && selectedCliente.negociacoes.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h4 className="font-medium mb-4">Histórico de Negociações</h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Tipo</th>
                          <th>Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCliente.negociacoes.map(n => (
                          <tr key={n.id}>
                            <td>{new Date(n.data).toLocaleDateString('pt-BR')}</td>
                            <td>
                              <span className={`badge ${n.tipo === 'venda' ? 'badge-success' : 'badge-info'}`}>
                                {n.tipo}
                              </span>
                            </td>
                            <td>{formatCurrency(n.valor_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clientes;
