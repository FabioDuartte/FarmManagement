import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Sprout, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

function Milho() {
  const [talhoes, setTalhoes] = useState([]);
  const [safras, setSafras] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showTalhaoModal, setShowTalhaoModal] = useState(false);
  const [showSafraModal, setShowSafraModal] = useState(false);
  const [showAtividadeModal, setShowAtividadeModal] = useState(false);
  const [editingTalhao, setEditingTalhao] = useState(null);
  const [editingSafra, setEditingSafra] = useState(null);
  const [selectedSafra, setSelectedSafra] = useState(null);
  const [activeTab, setActiveTab] = useState('talhoes');
  
  const [formTalhao, setFormTalhao] = useState({
    nome: '',
    area_hectares: '',
    localizacao: ''
  });

  const [formSafra, setFormSafra] = useState({
    talhao_id: '',
    ano: new Date().getFullYear(),
    variedade: '',
    data_plantio: '',
    data_colheita_prevista: '',
    area_plantada: ''
  });

  const [formAtividade, setFormAtividade] = useState({
    safra_id: '',
    tipo: 'plantio',
    descricao: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    custo: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [talhoesRes, safrasRes, statsRes] = await Promise.all([
        api.get('/agricola/talhoes'),
        api.get('/agricola/safras'),
        api.get('/agricola/stats/resumo')
      ]);
      setTalhoes(talhoesRes);
      setSafras(safrasRes);
      setStats(statsRes);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitTalhao(e) {
    e.preventDefault();
    try {
      if (editingTalhao) {
        await api.put(`/agricola/talhoes/${editingTalhao.id}`, formTalhao);
      } else {
        await api.post('/agricola/talhoes', formTalhao);
      }
      setShowTalhaoModal(false);
      resetFormTalhao();
      loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleSubmitSafra(e) {
    e.preventDefault();
    try {
      if (editingSafra) {
        await api.put(`/agricola/safras/${editingSafra.id}`, formSafra);
      } else {
        await api.post('/agricola/safras', formSafra);
      }
      setShowSafraModal(false);
      resetFormSafra();
      loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleSubmitAtividade(e) {
    e.preventDefault();
    try {
      await api.post('/agricola/atividades', formAtividade);
      setShowAtividadeModal(false);
      resetFormAtividade();
      loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleDeleteTalhao(id) {
    if (confirm('Tem certeza que deseja excluir este talhão?')) {
      try {
        await api.delete(`/agricola/talhoes/${id}`);
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  async function handleDeleteSafra(id) {
    if (confirm('Tem certeza que deseja excluir esta safra?')) {
      try {
        await api.delete(`/agricola/safras/${id}`);
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  function openEditTalhao(talhao) {
    setEditingTalhao(talhao);
    setFormTalhao({
      nome: talhao.nome,
      area_hectares: talhao.area_hectares || '',
      localizacao: talhao.localizacao || ''
    });
    setShowTalhaoModal(true);
  }

  function openEditSafra(safra) {
    setEditingSafra(safra);
    setFormSafra({
      talhao_id: safra.talhao_id,
      ano: safra.ano,
      variedade: safra.variedade || '',
      data_plantio: safra.data_plantio || '',
      data_colheita_prevista: safra.data_colheita_prevista || '',
      area_plantada: safra.area_plantada || ''
    });
    setShowSafraModal(true);
  }

  function openAtividadeModal(safraId) {
    resetFormAtividade();
    setFormAtividade({ ...formAtividade, safra_id: safraId });
    setShowAtividadeModal(true);
  }

  function resetFormTalhao() {
    setFormTalhao({ nome: '', area_hectares: '', localizacao: '' });
    setEditingTalhao(null);
  }

  function resetFormSafra() {
    setFormSafra({
      talhao_id: '',
      ano: new Date().getFullYear(),
      variedade: '',
      data_plantio: '',
      data_colheita_prevista: '',
      area_plantada: ''
    });
    setEditingSafra(null);
  }

  function resetFormAtividade() {
    setFormAtividade({
      safra_id: '',
      tipo: 'plantio',
      descricao: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      custo: ''
    });
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(value || 0);
  }

  function getSituacaoBadge(situacao) {
    const badges = {
      planejada: 'badge-info',
      em_andamento: 'badge-warning',
      colhida: 'badge-success',
      perdida: 'badge-danger'
    };
    const labels = {
      planejada: 'Planejada',
      em_andamento: 'Em Andamento',
      colhida: 'Colhida',
      perdida: 'Perdida'
    };
    return <span className={`badge ${badges[situacao] || 'badge-secondary'}`}>{labels[situacao] || situacao}</span>;
  }

  if (loading) {
    return <div className="text-center" style={{padding: '40px'}}>Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Plantação de Milho</h1>
          <p>Gestão de talhões e safras</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => { resetFormTalhao(); setShowTalhaoModal(true); }}>
            <Plus size={18} />
            Novo Talhão
          </button>
          <button className="btn btn-primary" onClick={() => { resetFormSafra(); setShowSafraModal(true); }}>
            <Plus size={18} />
            Nova Safra
          </button>
        </div>
      </div>

      <div className="grid grid-4 mb-6">
        <div className="stat-card">
          <div className="label">Total de Talhões</div>
          <div className="value">{stats.total_talhoes || 0}</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Área Total</div>
          <div className="value">{formatNumber(stats.area_total)} ha</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Produção Total</div>
          <div className="value">{formatNumber(stats.producao_total)} sacas</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Custo Total</div>
          <div className="value">{formatCurrency(stats.custo_total)}</div>
        </div>
      </div>

      <div className="grid grid-3 mb-6">
        <div className="stat-card">
          <div className="label">Produtividade Média</div>
          <div className="value success">{formatNumber(stats.produtividade_media)} sacas/ha</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Custo por Saca</div>
          <div className="value">{formatCurrency(stats.custo_por_saca)}</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Safras no Ano</div>
          <div className="value">{stats.total_safras || 0}</div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'talhoes' ? 'active' : ''}`}
          onClick={() => setActiveTab('talhoes')}
        >
          <MapPin size={16} style={{ marginRight: '8px' }} />
          Talhões ({talhoes.length})
        </button>
        <button 
          className={`tab ${activeTab === 'safras' ? 'active' : ''}`}
          onClick={() => setActiveTab('safras')}
        >
          <Sprout size={16} style={{ marginRight: '8px' }} />
          Safras ({safras.length})
        </button>
      </div>

      {activeTab === 'talhoes' && (
        <div className="grid grid-3">
          {talhoes.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state">
                <MapPin size={48} />
                <h3>Nenhum talhão cadastrado</h3>
                <p>Cadastre seu primeiro talhão para começar</p>
              </div>
            </div>
          ) : (
            talhoes.map(talhao => (
              <div key={talhao.id} className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">{talhao.nome}</h3>
                  <div className="flex gap-2">
                    <button className="action-btn" onClick={() => openEditTalhao(talhao)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="action-btn danger" onClick={() => handleDeleteTalhao(talhao.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-muted mb-2">
                  <strong>Área:</strong> {talhao.area_hectares ? `${talhao.area_hectares} ha` : 'Não informada'}
                </div>
                {talhao.localizacao && (
                  <div className="text-sm text-muted">
                    <strong>Localização:</strong> {talhao.localizacao}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'safras' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Talhão</th>
                  <th>Ano</th>
                  <th>Variedade</th>
                  <th>Área Plantada</th>
                  <th>Produção Prevista</th>
                  <th>Produção Real</th>
                  <th>Situação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {safras.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted" style={{padding: '40px'}}>
                      Nenhuma safra cadastrada
                    </td>
                  </tr>
                ) : (
                  safras.map(safra => (
                    <tr key={safra.id}>
                      <td className="font-medium">{safra.talhao_nome}</td>
                      <td>{safra.ano}</td>
                      <td>{safra.variedade || '-'}</td>
                      <td>{safra.area_plantada ? `${safra.area_plantada} ha` : '-'}</td>
                      <td>{safra.producao_prevista ? `${safra.producao_prevista} sacas` : '-'}</td>
                      <td>
                        {safra.producao_real ? (
                          <span className="success font-medium">{safra.producao_real} sacas</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{getSituacaoBadge(safra.situacao)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => openAtividadeModal(safra.id)}
                          >
                            + Atividade
                          </button>
                          <button className="action-btn" onClick={() => openEditSafra(safra)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="action-btn danger" onClick={() => handleDeleteSafra(safra.id)}>
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
        </div>
      )}

      {showTalhaoModal && (
        <div className="modal-overlay" onClick={() => setShowTalhaoModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTalhao ? 'Editar Talhão' : 'Novo Talhão'}</h2>
              <button className="modal-close" onClick={() => setShowTalhaoModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitTalhao}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome/Identificação *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formTalhao.nome}
                    onChange={(e) => setFormTalhao({ ...formTalhao, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Área (hectares)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formTalhao.area_hectares}
                      onChange={(e) => setFormTalhao({ ...formTalhao, area_hectares: e.target.value })}
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Localização</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formTalhao.localizacao}
                      onChange={(e) => setFormTalhao({ ...formTalhao, localizacao: e.target.value })}
                      placeholder="Ex: Setor Norte"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTalhaoModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTalhao ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSafraModal && (
        <div className="modal-overlay" onClick={() => setShowSafraModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSafra ? 'Editar Safra' : 'Nova Safra'}</h2>
              <button className="modal-close" onClick={() => setShowSafraModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitSafra}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Talhão *</label>
                    <select
                      className="form-input"
                      value={formSafra.talhao_id}
                      onChange={(e) => setFormSafra({ ...formSafra, talhao_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {talhoes.map(t => (
                        <option key={t.id} value={t.id}>{t.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ano *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formSafra.ano}
                      onChange={(e) => setFormSafra({ ...formSafra, ano: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Variedade/Híbrido</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formSafra.variedade}
                    onChange={(e) => setFormSafra({ ...formSafra, variedade: e.target.value })}
                    placeholder="Ex: AG 1051, P30F53"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data de Plantio</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formSafra.data_plantio}
                      onChange={(e) => setFormSafra({ ...formSafra, data_plantio: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Previsão de Colheita</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formSafra.data_colheita_prevista}
                      onChange={(e) => setFormSafra({ ...formSafra, data_colheita_prevista: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Área Plantada (ha)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formSafra.area_plantada}
                    onChange={(e) => setFormSafra({ ...formSafra, area_plantada: e.target.value })}
                    step="0.01"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSafraModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSafra ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAtividadeModal && (
        <div className="modal-overlay" onClick={() => setShowAtividadeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Atividade</h2>
              <button className="modal-close" onClick={() => setShowAtividadeModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitAtividade}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tipo de Atividade *</label>
                  <select
                    className="form-input"
                    value={formAtividade.tipo}
                    onChange={(e) => setFormAtividade({ ...formAtividade, tipo: e.target.value })}
                    required
                  >
                    <option value="plantio">Plantio</option>
                    <option value="adubacao">Adubação</option>
                    <option value="defensivo">Aplicação de Defensivo</option>
                    <option value="herbicida">Herbicida</option>
                    <option value="irrigacao">Irrigação</option>
                    <option value="colheita">Colheita</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formAtividade.descricao}
                    onChange={(e) => setFormAtividade({ ...formAtividade, descricao: e.target.value })}
                    placeholder="Detalhes da atividade"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formAtividade.data}
                      onChange={(e) => setFormAtividade({ ...formAtividade, data: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Custo (R$)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formAtividade.custo}
                      onChange={(e) => setFormAtividade({ ...formAtividade, custo: e.target.value })}
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAtividadeModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Milho;
