import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Filter, X } from 'lucide-react';
import api from '../utils/api';

function Animais() {
  const [animais, setAnimais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [filtros, setFiltros] = useState({ status: '', tipo: '', sexo: '' });
  const [search, setSearch] = useState('');
  
  const [form, setForm] = useState({
    brinco: '',
    tipo: 'gado',
    sexo: '',
    raca: '',
    idade: '',
    peso_atual: '',
    categoria: ''
  });

  useEffect(() => {
    loadAnimais();
  }, [filtros]);

  async function loadAnimais() {
    try {
      const params = new URLSearchParams();
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.tipo) params.append('tipo', filtros.tipo);
      if (filtros.sexo) params.append('sexo', filtros.sexo);
      
      const data = await api.get(`/animais?${params}`);
      setAnimais(data);
    } catch (error) {
      console.error('Erro ao carregar animais:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingAnimal) {
        await api.put(`/animais/${editingAnimal.id}`, form);
      } else {
        await api.post('/animais', form);
      }
      setShowModal(false);
      resetForm();
      loadAnimais();
    } catch (error) {
      alert(error.message);
    }
  }

  function openEdit(animal) {
    setEditingAnimal(animal);
    setForm({
      brinco: animal.brinco,
      tipo: animal.tipo,
      sexo: animal.sexo,
      raca: animal.raca || '',
      idade: animal.idade || '',
      peso_atual: animal.peso_atual || '',
      categoria: animal.categoria || ''
    });
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (confirm('Tem certeza que deseja excluir este animal?')) {
      try {
        await api.delete(`/animais/${id}`);
        loadAnimais();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  function resetForm() {
    setForm({
      brinco: '',
      tipo: 'gado',
      sexo: '',
      raca: '',
      idade: '',
      peso_atual: '',
      categoria: ''
    });
    setEditingAnimal(null);
  }

  const animaisFiltrados = animais.filter(a => 
    a.brinco.toLowerCase().includes(search.toLowerCase()) ||
    (a.raca && a.raca.toLowerCase().includes(search.toLowerCase()))
  );

  const statusColors = {
    disponivel: 'badge-success',
    vendido: 'badge-info',
    'em_negociacao': 'badge-warning'
  };

  const getStatusLabel = (status) => {
    const labels = {
      disponivel: 'Disponível',
      vendido: 'Vendido',
      em_negociacao: 'Em Negociação'
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="text-center" style={{padding: '40px'}}>Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Animais</h1>
          <p>Cadastro e gestão do rebanho</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} />
          Novo Animal
        </button>
      </div>

      <div className="card mb-4">
        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: '200px', margin: 0 }}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por brinco ou raça..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <select 
            className="form-input" 
            style={{ width: 'auto' }}
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
          >
            <option value="">Todos Status</option>
            <option value="disponivel">Disponível</option>
            <option value="vendido">Vendido</option>
            <option value="em_negociacao">Em Negociação</option>
          </select>
          
          <select 
            className="form-input" 
            style={{ width: 'auto' }}
            value={filtros.sexo}
            onChange={(e) => setFiltros({ ...filtros, sexo: e.target.value })}
          >
            <option value="">Todos Sexos</option>
            <option value="macho">Macho</option>
            <option value="femea">Fêmea</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Brinco</th>
                <th>Tipo</th>
                <th>Sexo</th>
                <th>Raça</th>
                <th>Peso (kg)</th>
                <th>Categoria</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {animaisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted" style={{padding: '40px'}}>
                    Nenhum animal encontrado
                  </td>
                </tr>
              ) : (
                animaisFiltrados.map(animal => (
                  <tr key={animal.id}>
                    <td className="font-medium">{animal.brinco}</td>
                    <td className="capitalize">{animal.tipo}</td>
                    <td>{animal.sexo === 'macho' ? 'Macho' : 'Fêmea'}</td>
                    <td>{animal.raca || '-'}</td>
                    <td>{animal.peso_atual ? `${animal.peso_atual} kg` : '-'}</td>
                    <td>{animal.categoria || '-'}</td>
                    <td>
                      <span className={`badge ${statusColors[animal.status] || 'badge-secondary'}`}>
                        {getStatusLabel(animal.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="action-btn" onClick={() => openEdit(animal)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn danger" onClick={() => handleDelete(animal.id)} title="Excluir">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '16px', borderTop: '1px solid var(--bg-gray)', color: 'var(--text-light)' }}>
          Total: {animaisFiltrados.length} animais
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAnimal ? 'Editar Animal' : 'Novo Animal'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Número do Brinco *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.brinco}
                      onChange={(e) => setForm({ ...form, brinco: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo *</label>
                    <select
                      className="form-input"
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                      required
                    >
                      <option value="gado">Gado</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Sexo *</label>
                    <select
                      className="form-input"
                      value={form.sexo}
                      onChange={(e) => setForm({ ...form, sexo: e.target.value })}
                      required
                    >
                      <option value="">Selecione</option>
                      <option value="macho">Macho</option>
                      <option value="femea">Fêmea</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Raça</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.raca}
                      onChange={(e) => setForm({ ...form, raca: e.target.value })}
                      placeholder="Ex: Nelore, Angus..."
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Idade Aproximada</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.idade}
                      onChange={(e) => setForm({ ...form, idade: e.target.value })}
                      placeholder="Ex: 2 anos"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Peso (kg)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.peso_atual}
                      onChange={(e) => setForm({ ...form, peso_atual: e.target.value })}
                      placeholder="Peso atual"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-input"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  >
                    <option value="">Selecione</option>
                    <option value="boi">Boi</option>
                    <option value="vaca">Vaca</option>
                    <option value="novilha">Novilha</option>
                    <option value="bezerro">Bezerr@</option>
                    <option value="touro">Touro</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAnimal ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Animais;
