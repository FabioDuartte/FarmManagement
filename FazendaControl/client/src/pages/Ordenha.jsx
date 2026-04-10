import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, Milk } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../utils/api';

function Ordenha() {
  const [vacas, setVacas] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showVacaModal, setShowVacaModal] = useState(false);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [editingVaca, setEditingVaca] = useState(null);
  const [historico, setHistorico] = useState([]);
  
  const [formVaca, setFormVaca] = useState({
    brinco: '',
    nome: '',
    raca: '',
    data_nascimento: '',
    data_parto: '',
    producao_media_diaria: ''
  });

  const [formRegistro, setFormRegistro] = useState({
    vaca_id: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    horario: '06:00',
    litros: '',
    gordura: '',
    proteina: '',
    ccs: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [vacasRes, registrosRes, statsRes] = await Promise.all([
        api.get('/ordenha/vacas'),
        api.get(`/ordenha/registros?data=${format(new Date(), 'yyyy-MM-dd')}`),
        api.get('/ordenha/stats/resumo')
      ]);
      setVacas(vacasRes);
      setRegistros(registrosRes);
      setStats(statsRes);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistorico() {
    try {
      const data = await api.get('/ordenha/stats/historico?dias=30');
      setHistorico(data);
      setShowHistorico(true);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }

  async function handleSubmitVaca(e) {
    e.preventDefault();
    try {
      if (editingVaca) {
        await api.put(`/ordenha/vacas/${editingVaca.id}`, formVaca);
      } else {
        await api.post('/ordenha/vacas', formVaca);
      }
      setShowVacaModal(false);
      resetFormVaca();
      loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleSubmitRegistro(e) {
    e.preventDefault();
    try {
      await api.post('/ordenha/registros', formRegistro);
      setShowRegistroModal(false);
      resetFormRegistro();
      loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleDeleteVaca(id) {
    if (confirm('Tem certeza que deseja excluir esta vaca?')) {
      try {
        await api.delete(`/ordenha/vacas/${id}`);
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  async function handleDeleteRegistro(id) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        await api.delete(`/ordenha/registros/${id}`);
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  function openEditVaca(vaca) {
    setEditingVaca(vaca);
    setFormVaca({
      brinco: vaca.brinco,
      nome: vaca.nome || '',
      raca: vaca.raca || '',
      data_nascimento: vaca.data_nascimento || '',
      data_parto: vaca.data_parto || '',
      producao_media_diaria: vaca.producao_media_diaria || ''
    });
    setShowVacaModal(true);
  }

  function resetFormVaca() {
    setFormVaca({
      brinco: '',
      nome: '',
      raca: '',
      data_nascimento: '',
      data_parto: '',
      producao_media_diaria: ''
    });
    setEditingVaca(null);
  }

  function resetFormRegistro() {
    setFormRegistro({
      vaca_id: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      horario: '06:00',
      litros: '',
      gordura: '',
      proteina: '',
      ccs: ''
    });
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value || 0);
  }

  function getProducaoTotal() {
    return registros.reduce((sum, r) => sum + (r.litros || 0), 0);
  }

  if (loading) {
    return <div className="text-center" style={{padding: '40px'}}>Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Ordenha</h1>
          <p>Controle de produção leiteira</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={loadHistorico}>
            <BarChart size={18} />
            Histórico
          </button>
          <button className="btn btn-secondary" onClick={() => { resetFormVaca(); setShowVacaModal(true); }}>
            <Plus size={18} />
            Nova Vaca
          </button>
          <button className="btn btn-primary" onClick={() => { resetFormRegistro(); setShowRegistroModal(true); }}>
            <Plus size={18} />
            Registrar Ordenha
          </button>
        </div>
      </div>

      <div className="grid grid-4 mb-6">
        <div className="stat-card">
          <div className="label">Rebanho Leiteiro</div>
          <div className="value">{stats.rebanho?.total || 0}</div>
          <div className="change text-muted">{stats.rebanho?.ativas || 0} em lactação</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Produção Hoje</div>
          <div className="value success">{formatNumber(stats.producao_diaria?.total_litros || 0)} L</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Média 30 dias</div>
          <div className="value">{formatNumber(stats.media_30_dias)} L/dia</div>
        </div>
        
        <div className="stat-card">
          <div className="label">CCS Médio</div>
          <div className="value">{formatNumber(stats.qualidade?.media_ccs)}</div>
        </div>
      </div>

      <div className="grid grid-2 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Vacas em Lactação</h3>
          </div>
          {vacas.length === 0 ? (
            <div className="empty-state">
              <Milk size={48} />
              <h3>Nenhuma vaca cadastrada</h3>
              <p>Cadastre suas vacas leiteiras</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Brinco</th>
                    <th>Nome</th>
                    <th>Raça</th>
                    <th>Produção Est.</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vacas.map(v => (
                    <tr key={v.id}>
                      <td className="font-medium">{v.brinco}</td>
                      <td>{v.nome || '-'}</td>
                      <td>{v.raca || '-'}</td>
                      <td>{v.producao_media_diaria ? `${v.producao_media_diaria} L` : '-'}</td>
                      <td>
                        <span className={`badge ${v.status === 'ativa' ? 'badge-success' : 'badge-secondary'}`}>
                          {v.status === 'ativa' ? 'Ativa' : 'Seca'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="action-btn" onClick={() => openEditVaca(v)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="action-btn danger" onClick={() => handleDeleteVaca(v.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Registros de Hoje - {format(new Date(), 'dd/MM/yyyy')}</h3>
          </div>
          {registros.length === 0 ? (
            <div className="empty-state">
              <h3>Nenhum registro hoje</h3>
              <p>Registre a produção de leite</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vaca</th>
                    <th>Horário</th>
                    <th>Litros</th>
                    <th>Gordura</th>
                    <th>Proteína</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map(r => (
                    <tr key={r.id}>
                      <td className="font-medium">{r.brinco} {r.vaca_nome && `(${r.vaca_nome})`}</td>
                      <td>{r.horario}</td>
                      <td>{r.litros} L</td>
                      <td>{r.gordura ? `${r.gordura}%` : '-'}</td>
                      <td>{r.proteina ? `${r.proteina}%` : '-'}</td>
                      <td>
                        <button className="action-btn danger" onClick={() => handleDeleteRegistro(r.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 'bold', background: 'var(--bg)' }}>
                    <td colSpan="2">TOTAL</td>
                    <td>{getProducaoTotal()} L</td>
                    <td colSpan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {showVacaModal && (
        <div className="modal-overlay" onClick={() => setShowVacaModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVaca ? 'Editar Vaca' : 'Nova Vaca'}</h2>
              <button className="modal-close" onClick={() => setShowVacaModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitVaca}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Brinco *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formVaca.brinco}
                      onChange={(e) => setFormVaca({ ...formVaca, brinco: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nome</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formVaca.nome}
                      onChange={(e) => setFormVaca({ ...formVaca, nome: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Raça</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formVaca.raca}
                    onChange={(e) => setFormVaca({ ...formVaca, raca: e.target.value })}
                    placeholder="Ex: Girolando, Jersey"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data de Nascimento</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formVaca.data_nascimento}
                      onChange={(e) => setFormVaca({ ...formVaca, data_nascimento: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data do Último Parto</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formVaca.data_parto}
                      onChange={(e) => setFormVaca({ ...formVaca, data_parto: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Produção Média Diária (L)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formVaca.producao_media_diaria}
                    onChange={(e) => setFormVaca({ ...formVaca, producao_media_diaria: e.target.value })}
                    step="0.1"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVacaModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingVaca ? 'Salvar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegistroModal && (
        <div className="modal-overlay" onClick={() => setShowRegistroModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registrar Ordenha</h2>
              <button className="modal-close" onClick={() => setShowRegistroModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitRegistro}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Vaca *</label>
                  <select
                    className="form-input"
                    value={formRegistro.vaca_id}
                    onChange={(e) => setFormRegistro({ ...formRegistro, vaca_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione...</option>
                    {vacas.filter(v => v.status === 'ativa').map(v => (
                      <option key={v.id} value={v.id}>{v.brinco} {v.nome && ` - ${v.nome}`}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formRegistro.data}
                      onChange={(e) => setFormRegistro({ ...formRegistro, data: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horário *</label>
                    <select
                      className="form-input"
                      value={formRegistro.horario}
                      onChange={(e) => setFormRegistro({ ...formRegistro, horario: e.target.value })}
                      required
                    >
                      <option value="06:00">06:00 - Manhã</option>
                      <option value="14:00">14:00 - Tarde</option>
                      <option value="18:00">18:00 - Noite</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Litros Produzidos *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formRegistro.litros}
                    onChange={(e) => setFormRegistro({ ...formRegistro, litros: e.target.value })}
                    step="0.1"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Gordura (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formRegistro.gordura}
                      onChange={(e) => setFormRegistro({ ...formRegistro, gordura: e.target.value })}
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Proteína (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formRegistro.proteina}
                      onChange={(e) => setFormRegistro({ ...formRegistro, proteina: e.target.value })}
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">CCS (Células Somáticas)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formRegistro.ccs}
                    onChange={(e) => setFormRegistro({ ...formRegistro, ccs: e.target.value })}
                    placeholder="Ex: 200000"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRegistroModal(false)}>
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

      {showHistorico && (
        <div className="modal-overlay" onClick={() => setShowHistorico(false)}>
          <div className="modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Histórico de Produção - Últimos 30 dias</h2>
              <button className="modal-close" onClick={() => setShowHistorico(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="chart-container" style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="data" 
                      tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                      formatter={(value) => [`${value} L`, 'Produção']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_litros" 
                      stroke="#166534" 
                      strokeWidth={2}
                      dot={{ fill: '#166534' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="table-container" style={{ marginTop: '20px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Total Litros</th>
                      <th>Ordenhas</th>
                      <th>Média Gordura</th>
                      <th>Média Proteína</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map(h => (
                      <tr key={h.data}>
                        <td>{format(new Date(h.data), 'dd/MM/yyyy')}</td>
                        <td className="font-medium">{h.total_litros} L</td>
                        <td>{h.total_ordenhas}</td>
                        <td>{h.media_gordura ? `${h.media_gordura}%` : '-'}</td>
                        <td>{h.media_proteina ? `${h.media_proteina}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ordenha;
