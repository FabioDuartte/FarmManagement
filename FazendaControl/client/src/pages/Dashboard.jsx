import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, TrendingDown, Users, ShoppingCart, 
  PiggyBank, Wheat, Milk, AlertCircle, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../utils/api';

function Dashboard() {
  const [stats, setStats] = useState({
    gado: { total: 0, pesoMedio: 0 },
    financeiro: { aReceber: 0, aPagar: 0, lucro: 0 },
    negociacoes: { vendas: 0, compras: 0 },
    ordenha: { producaoDiaria: 0, vacasAtivas: 0 },
    milho: { talhoes: 0, producao: 0 }
  });
  const [recentNegociacoes, setRecentNegociacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [gadoRes, financasRes, negStatsRes, ordenhaStats, agricolaStats] = await Promise.all([
        api.get('/animais/stats/resumo'),
        api.get('/financas/resumo'),
        api.get('/negociacoes/stats/resumo'),
        api.get('/ordenha/stats/resumo'),
        api.get('/agricola/stats/resumo')
      ]);

      const negociacoesRes = await api.get('/negociacoes?');

      setStats({
        gado: {
          total: gadoRes.total || 0,
          pesoMedio: gadoRes.pesoMedio || 0
        },
        financeiro: {
          aReceber: financasRes.total_a_receber || 0,
          aPagar: financasRes.total_a_pagar || 0,
          saldo: financasRes.saldo_previsto || 0
        },
        negociacoes: {
          vendas: negStatsRes.vendas?.total || 0,
          compras: negStatsRes.compras?.total || 0,
          lucro: negStatsRes.lucro || 0
        },
        ordenha: {
          producaoDiaria: ordenhaStats.producao_diaria?.total_litros || 0,
          vacasAtivas: ordenhaStats.rebanho?.ativas || 0
        },
        milho: {
          talhoes: agricolaStats.total_talhoes || 0,
          producao: agricolaStats.producao_total || 0
        }
      });

      setRecentNegociacoes(negociacoesRes.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center" style={{padding: '40px'}}>Carregando...</div>;
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do seu negócio - {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
      </div>

      <div className="grid grid-4 mb-6">
        <div className="stat-card">
          <div className="label">Total de Animais</div>
          <div className="value">{formatNumber(stats.gado.total)}</div>
          <div className="change text-muted">Peso médio: {formatNumber(stats.gado.pesoMedio?.toFixed(1))} kg</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Vendas do Mês</div>
          <div className="value success">{formatCurrency(stats.negociacoes.vendas)}</div>
          <div className="change positive">Lucro: {formatCurrency(stats.negociacoes.lucro)}</div>
        </div>
        
        <div className="stat-card">
          <div className="label">A Receber</div>
          <div className="value">{formatCurrency(stats.financeiro.aReceber)}</div>
          <div className="change text-muted">A pagar: {formatCurrency(stats.financeiro.aPagar)}</div>
        </div>
        
        <div className="stat-card">
          <div className="label">Produção de Leite</div>
          <div className="value">{formatNumber(stats.ordenha.producaoDiaria)} L</div>
          <div className="change text-muted">{stats.ordenha.vacasAtivas} vacas em lactação</div>
        </div>
      </div>

      <div className="grid grid-2 mb-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Negociações Recentes</h3>
          </div>
          {recentNegociacoes.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart />
              <h3>Nenhuma negociação</h3>
              <p>Suas negociações aparecerão aqui</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Animais</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {recentNegociacoes.map(n => (
                    <tr key={n.id}>
                      <td>{format(new Date(n.data), 'dd/MM/yy')}</td>
                      <td>{n.cliente_nome}</td>
                      <td>
                        <span className={`badge ${n.tipo === 'venda' ? 'badge-success' : 'badge-info'}`}>
                          {n.tipo === 'venda' ? 'Venda' : 'Compra'}
                        </span>
                      </td>
                      <td>{n.quantidade_animais}</td>
                      <td className="font-medium">{formatCurrency(n.valor_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Alertas Financeiros</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              padding: '16px', 
              background: '#fee2e2', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertCircle size={24} color="#dc2626" />
              <div>
                <div className="font-medium" style={{ color: '#991b1b' }}>Contas Vencidas</div>
                <div className="text-sm text-muted">Verifique pagamentos pendentes</div>
              </div>
            </div>
            
            <div style={{ 
              padding: '16px', 
              background: '#fef3c7', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <PiggyBank size={24} color="#d97706" />
              <div>
                <div className="font-medium" style={{ color: '#92400e' }}>Próximos Pagamentos</div>
                <div className="text-sm text-muted">Baixe o aplicativo para ver os detalhes</div>
              </div>
            </div>

            <div style={{ 
              padding: '16px', 
              background: '#dbeafe', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Wheat size={24} color="#2563eb" />
              <div>
                <div className="font-medium" style={{ color: '#1e40af' }}>Safra de Milho</div>
                <div className="text-sm text-muted">{stats.milho.talhoes} talhões registrados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-3">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🌾 Milho</h3>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <div className="text-muted text-sm">Talhoes</div>
              <div className="font-medium" style={{ fontSize: '24px' }}>{stats.milho.talhoes}</div>
            </div>
            <div>
              <div className="text-muted text-sm">Produção Total</div>
              <div className="font-medium" style={{ fontSize: '24px' }}>{formatNumber(stats.milho.producao)} sacas</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🥛 Ordenha</h3>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <div className="text-muted text-sm">Produção Hoje</div>
              <div className="font-medium" style={{ fontSize: '24px' }}>{formatNumber(stats.ordenha.producaoDiaria)} L</div>
            </div>
            <div>
              <div className="text-muted text-sm">Vacas Ativas</div>
              <div className="font-medium" style={{ fontSize: '24px' }}>{stats.ordenha.vacasAtivas}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💰 Fluxo de Caixa</h3>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div>
              <div className="text-muted text-sm">Saldo Previsto</div>
              <div className={`font-medium ${stats.financeiro.saldo >= 0 ? 'success' : 'danger'}`} style={{ fontSize: '24px' }}>
                {formatCurrency(stats.financeiro.saldo)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
