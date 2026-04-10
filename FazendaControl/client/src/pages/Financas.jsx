import { useState, useEffect } from 'react';
import { Plus, X, DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { format, isPast, isToday, addDays } from 'date-fns';
import api from '../utils/api';

function Financas() {
  const [contasPagar, setContasPagar] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [resumo, setResumo] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('receber');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [clientes, setClientes] = useState([]);
  
  const [form, setForm] = useState({
    cliente_id: '',
    descricao: '',
    valor_total: '',
    data_vencimento: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [pagarRes, receberRes, resumoRes, clientesRes] = await Promise.all([
        api.get('/financas/pagar'),
        api.get('/financas/receber'),
        api.get('/financas/resumo'),
        api.get('/clientes')
      ]);
      setContasPagar(pagarRes);
      setContasReceber(receberRes);
      setResumo(resumoRes);
      setClientes(clientesRes);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (modalType === 'pagar') {
        await api.post('/financas/pagar', form);
      } else {
        await api.post('/financas/receber', form);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function registrarPagamento(id, tipo, valor) {
    const data = prompt(`Registrar pagamento de ${formatCurrency(valor)}. Confirme o valor:`);
    if (!data) return;
    
    const valorNum = parseFloat(data);
    if (isNaN(valorNum) || valorNum <= 0) {
      alert('Valor inválido');
      return;
    }
    
    try {
      if (tipo === 'pagar') {
        await api.patch(`/financas/pagar/${id}/pagar`, { 
          valor: valorNum,
          data_pagamento: format(new Date(), 'yyyy-MM-dd')
        });
      } else {
        await api.patch(`/financas/receber/${id}/receber`, { 
          valor: valorNum,
          data_recebimento: format(new Date(), 'yyyy-MM-dd')
        });
      }
      loadData();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleDelete(id, tipo) {
    if (confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        if (tipo === 'pagar') {
          await api.delete(`/financas/pagar/${id}`);
        } else {
          await api.delete(`/financas/receber/${id}`);
        }
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  function resetForm() {
    setForm({
      cliente_id: '',
      descricao: '',
      valor_total: '',
      data_vencimento: ''
    });
  }

  function openModal(tipo) {
    setModalType(tipo);
    resetForm();
    setShowModal(true);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  function getStatusBadge(conta) {
    if (conta.situacao === 'quitada') {
      return <span className="badge badge-success">Quitada</span>;
    }
    if (conta.situacao === 'parcial') {
      return <span className="badge badge-warning">Parcial</span>;
    }
    const dataVen = new Date(conta.data_vencimento);
    if (isPast(dataVen) && !isToday(dataVen)) {
      return <span className="badge badge-danger">Vencida</span>;
    }
    if (isToday(dataVen) || (dataVen <= addDays(new Date(), 7) && dataVen > new Date())) {
      return <span className="badge badge-warning">Vence em breve</span>;
    }
    return <span className="badge badge-info">Pendente</span>;
  }

  function getRestante(conta, tipo) {
    if (tipo === 'pagar') {
      return conta.valor_total - conta.valor_pago;
    }
    return conta.valor_total - conta.valor_recebido;
  }

  if (loading) {
    return <div className="text-center" style={{padding: '40px'}}>Carregando...</div>;
  }

  const contas = activeTab === 'receber' ? contasReceber : contasPagar;
  const totalGeral = activeTab === 'receber' 
    ? resumo.total_a_receber 
    : resumo.total_a_pagar;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Finanças</h1>
          <p>Contas a pagar e a receber</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => openModal('receber')}>
            <Plus size={18} />
            A Receber
          </button>
          <button className="btn btn-secondary" onClick={() => openModal('pagar')}>
            <Plus size={18} />
            A Pagar
          </button>
        </div>
      </div>

      <div className="grid grid-4 mb-6">
        <div className="stat-card">
          <div className="label">Total a Receber</div>
          <div className="value success">{formatCurrency(resumo.total_a_receber)}</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Total a Pagar</div>
          <div className="value danger">{formatCurrency(resumo.total_a_pagar)}</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Saldo Previsto</div>
          <div className={`value ${resumo.saldo_previsto >= 0 ? 'success' : 'danger'}`}>
            {formatCurrency(resumo.saldo_previsto)}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="label">Vencidas</div>
          <div className="value danger">
            {(resumo.pagar_vencidas?.count || 0) + (resumo.receber_vencidas?.count || 0)}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'receber' ? 'active' : ''}`}
          onClick={() => setActiveTab('receber')}
        >
          <TrendingUp size={16} style={{ marginRight: '8px' }} />
          A Receber ({contasReceber.filter(c => c.situacao !== 'quitada').length})
        </button>
        <button 
          className={`tab ${activeTab === 'pagar' ? 'active' : ''}`}
          onClick={() => setActiveTab('pagar')}
        >
          <TrendingDown size={16} style={{ marginRight: '8px' }} />
          A Pagar ({contasPagar.filter(c => c.situacao !== 'quitada').length})
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Descrição</th>
                <th>Vencimento</th>
                <th>Valor Total</th>
                <th>Restante</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted" style={{padding: '40px'}}>
                    Nenhuma conta {activeTab === 'receber' ? 'a receber' : 'a pagar'}
                  </td>
                </tr>
              ) : (
                contas.map(conta => (
                  <tr key={conta.id}>
                    <td className="font-medium">{conta.cliente_nome}</td>
                    <td>{conta.descricao}</td>
                    <td>{format(new Date(conta.data_vencimento), 'dd/MM/yyyy')}</td>
                    <td className="font-medium">{formatCurrency(conta.valor_total)}</td>
                    <td>
                      {conta.situacao === 'quitada' ? (
                        <span className="badge badge-success">Quitado</span>
                      ) : (
                        <span className="text-muted">{formatCurrency(getRestante(conta, activeTab))}</span>
                      )}
                    </td>
                    <td>{getStatusBadge(conta)}</td>
                    <td>
                      <div className="flex gap-2">
                        {conta.situacao !== 'quitada' && (
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => registrarPagamento(conta.id, activeTab, getRestante(conta, activeTab))}
                          >
                            <DollarSign size={14} />
                            {activeTab === 'receber' ? 'Receber' : 'Pagar'}
                          </button>
                        )}
                        <button 
                          className="action-btn danger"
                          onClick={() => handleDelete(conta.id, activeTab)}
                        >
                          <X size={16} />
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Conta {modalType === 'receber' ? 'a Receber' : 'a Pagar'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
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
                
                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    placeholder="Ex: Venda de 5 bois"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valor Total (R$) *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.valor_total}
                      onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Vencimento *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.data_vencimento}
                      onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Financas;
