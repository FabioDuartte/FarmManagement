import { useState, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { FileText, TrendingUp, TrendingDown, Users, PiggyBank, Wheat, Milk } from 'lucide-react';
import api from '../utils/api';

const COLORS = ['#166534', '#22c55e', '#d97706', '#dc2626', '#2563eb'];

function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [relatorioSelecionado, setRelatorioSelecionado] = useState('resumo_geral');
  const [dados, setDados] = useState({});
  const [periodo, setPeriodo] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });

  useEffect(() => {
    loadRelatorios();
  }, [periodo]);

  async function loadRelatorios() {
    setLoading(true);
    try {
      const mes = String(periodo.mes).padStart(2, '0');
      
      const [negStats, financasRes, gadoStats, ordenhaStats, agricolaStats] = await Promise.all([
        api.get(`/negociacoes/stats/resumo?mes=${mes}&ano=${periodo.ano}`),
        api.get(`/financas/resumo?mes=${mes}&ano=${periodo.ano}`),
        api.get('/animais/stats/resumo'),
        api.get('/ordenha/stats/resumo'),
        api.get(`/agricola/stats/resumo?ano=${periodo.ano}`)
      ]);

      setDados({
        negociacoes: negStats,
        financas: financasRes,
        gado: gadoStats,
        ordenha: ordenhaStats,
        agricola: agricolaStats
      });
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value || 0);
  }

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const relatorios = [
    { id: 'resumo_geral', label: 'Resumo Geral', icon: FileText },
    { id: 'gado', label: 'Pecuária', icon: TrendingUp },
    { id: 'agricola', label: 'Agricultura', icon: Wheat },
    { id: 'leite', label: 'Leite', icon: Milk },
    { id: 'financeiro', label: 'Financeiro', icon: PiggyBank }
  ];

  if (loading) {
    return <div className="text-center" style={{padding: '40px'}}>Carregando...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Relatórios</h1>
          <p>Análise de desempenho do negócio</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={periodo.mes}
            onChange={(e) => setPeriodo({ ...periodo, mes: parseInt(e.target.value) })}
          >
            {meses.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={periodo.ano}
            onChange={(e) => setPeriodo({ ...periodo, ano: parseInt(e.target.value) })}
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      <div className="grid grid-5 mb-6">
        {relatorios.map(r => (
          <button
            key={r.id}
            className={`card ${relatorioSelecionado === r.id ? '' : ''}`}
            onClick={() => setRelatorioSelecionado(r.id)}
            style={{
              cursor: 'pointer',
              border: relatorioSelecionado === r.id ? '2px solid var(--primary)' : '2px solid transparent',
              background: relatorioSelecionado === r.id ? '#f0fdf4' : 'white'
            }}
          >
            <div className="flex flex-column items-center" style={{ gap: '8px' }}>
              <r.icon size={24} color={relatorioSelecionado === r.id ? '#166534' : '#6b7280'} />
              <span className="font-medium">{r.label}</span>
            </div>
          </button>
        ))}
      </div>

      {relatorioSelecionado === 'resumo_geral' && (
        <div>
          <div className="grid grid-4 mb-6">
            <div className="stat-card">
              <div className="label">Receitas (Vendas)</div>
              <div className="value success">{formatCurrency(dados.negociacoes?.vendas?.total || 0)}</div>
              <div className="change text-muted">{dados.negociacoes?.vendas?.animais || 0} animais</div>
            </div>
            <div className="stat-card">
              <div className="label">Despesas (Compras)</div>
              <div className="value danger">{formatCurrency(dados.negociacoes?.compras?.total || 0)}</div>
              <div className="change text-muted">{dados.negociacoes?.compras?.animais || 0} animais</div>
            </div>
            <div className="stat-card">
              <div className="label">Lucro Líquido</div>
              <div className={`value ${(dados.negociacoes?.lucro || 0) >= 0 ? 'success' : 'danger'}`}>
                {formatCurrency(dados.negociacoes?.lucro || 0)}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Rebanho</div>
              <div className="value">{dados.gado?.total || 0}</div>
              <div className="change text-muted">animais</div>
            </div>
          </div>

          <div className="card mb-6">
            <div className="card-header">
              <h3 className="card-title">Comparativo de Resultados</h3>
            </div>
            <div className="chart-container" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Vendas', valor: dados.negociacoes?.vendas?.total || 0 },
                  { name: 'Compras', valor: dados.negociacoes?.compras?.total || 0 },
                  { name: 'Lucro', valor: dados.negociacoes?.lucro || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="valor" fill="#166534" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Rebanho por Status</h3>
              </div>
              <div className="chart-container" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dados.gado?.porStatus || []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {(dados.gado?.porStatus || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Rebanho por Sexo</h3>
              </div>
              <div className="chart-container" style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dados.gado?.porSexo || []}
                      dataKey="count"
                      nameKey="sexo"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ sexo, percent }) => `${sexo === 'macho' ? 'Macho' : 'Fêmea'} (${(percent * 100).toFixed(0)}%)`}
                    >
                      <Cell fill="#166534" />
                      <Cell fill="#d97706" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {relatorioSelecionado === 'gado' && (
        <div>
          <div className="grid grid-4 mb-6">
            <div className="stat-card">
              <div className="label">Total de Animais</div>
              <div className="value">{dados.gado?.total || 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">Peso Médio</div>
              <div className="value">{formatNumber(dados.gado?.pesoMedio || 0)} kg</div>
            </div>
            <div className="stat-card">
              <div className="label">Animais Vendidos</div>
              <div className="value success">{dados.negociacoes?.vendas?.animais || 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">Animais Comprados</div>
              <div className="value">{dados.negociacoes?.compras?.animais || 0}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Custo Médio por Animal</h3>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary)' }}>
                {formatCurrency(dados.negociacoes?.compras?.total && dados.negociacoes?.compras?.animais 
                  ? dados.negociacoes.compras.total / dados.negociacoes.compras.animais 
                  : 0)}
              </div>
              <div className="text-muted">por animal em média</div>
            </div>
          </div>
        </div>
      )}

      {relatorioSelecionado === 'agricola' && (
        <div>
          <div className="grid grid-4 mb-6">
            <div className="stat-card">
              <div className="label">Talhoes</div>
              <div className="value">{dados.agricola?.total_talhoes || 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">Área Total</div>
              <div className="value">{formatNumber(dados.agricola?.area_total || 0)} ha</div>
            </div>
            <div className="stat-card">
              <div className="label">Produção Total</div>
              <div className="value success">{formatNumber(dados.agricola?.producao_total || 0)} sacas</div>
            </div>
            <div className="stat-card">
              <div className="label">Custo Total</div>
              <div className="value">{formatCurrency(dados.agricola?.custo_total || 0)}</div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Produtividade por Hectare</h3>
              </div>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {formatNumber(dados.agricola?.produtividade_media || 0)}
                </div>
                <div className="text-muted">sacas por hectare</div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Custo por Saca</h3>
              </div>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--warning)' }}>
                  {formatCurrency(dados.agricola?.custo_por_saca || 0)}
                </div>
                <div className="text-muted">por saca de milho</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {relatorioSelecionado === 'leite' && (
        <div>
          <div className="grid grid-4 mb-6">
            <div className="stat-card">
              <div className="label">Vacas em Lactação</div>
              <div className="value">{dados.ordenha?.rebanho?.ativas || 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">Produção Diária</div>
              <div className="value success">{formatNumber(dados.ordenha?.producao_diaria?.total_litros || 0)} L</div>
            </div>
            <div className="stat-card">
              <div className="label">Média 30 dias</div>
              <div className="value">{formatNumber(dados.ordenha?.media_30_dias || 0)} L</div>
            </div>
            <div className="stat-card">
              <div className="label">CCS Médio</div>
              <div className="value">{formatNumber(dados.ordenha?.qualidade?.media_ccs || 0)}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Qualidade do Leite</h3>
            </div>
            <div className="grid grid-2" style={{ padding: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {formatNumber(dados.ordenha?.qualidade?.media_gordura || 0)}%
                </div>
                <div className="text-muted">Gordura média</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  {formatNumber(dados.ordenha?.qualidade?.media_proteina || 0)}%
                </div>
                <div className="text-muted">Proteína média</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {relatorioSelecionado === 'financeiro' && (
        <div>
          <div className="grid grid-4 mb-6">
            <div className="stat-card">
              <div className="label">A Receber</div>
              <div className="value success">{formatCurrency(dados.financas?.total_a_receber || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="label">A Pagar</div>
              <div className="value danger">{formatCurrency(dados.financas?.total_a_pagar || 0)}</div>
            </div>
            <div className="stat-card">
              <div className="label">Saldo Previsto</div>
              <div className={`value ${(dados.financas?.saldo_previsto || 0) >= 0 ? 'success' : 'danger'}`}>
                {formatCurrency(dados.financas?.saldo_previsto || 0)}
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Vencidas</div>
              <div className="value danger">
                {(dados.financas?.pagar_vencidas?.count || 0) + (dados.financas?.receber_vencidas?.count || 0)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Projeção de Fluxo de Caixa</h3>
            </div>
            <div className="chart-container" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Receber', valor: dados.financas?.total_a_receber || 0 },
                  { name: 'Pagar', valor: dados.financas?.total_a_pagar || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    <Cell dataKey="valor" fill="#166534" />
                    <Cell dataKey="valor" fill="#dc2626" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Relatorios;
