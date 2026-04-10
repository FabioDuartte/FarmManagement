import { Router } from 'express';
import { get, all, run, transaction } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { tipo, data_inicio, data_fim, situacao } = req.query;
    let query = `
      SELECT n.*, c.nome as cliente_nome
      FROM negociacoes n
      JOIN clientes c ON n.cliente_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    
    if (tipo) { query += ` AND n.tipo = $${i++}`; params.push(tipo); }
    if (data_inicio) { query += ` AND n.data >= $${i++}`; params.push(data_inicio); }
    if (data_fim) { query += ` AND n.data <= $${i++}`; params.push(data_fim); }
    if (situacao) { query += ` AND n.situacao = $${i++}`; params.push(situacao); }
    
    query += ' ORDER BY n.data DESC';
    
    const negociacoes = await all(query, params);
    
    const negociacoesComAnimais = await Promise.all(negociacoes.map(async (n) => {
      const animais = await all(`
        SELECT na.*, a.brinco, a.tipo, a.sexo, a.raca
        FROM negociacao_animais na
        JOIN animais a ON na.animal_id = a.id
        WHERE na.negociacao_id = $1
      `, [n.id]);
      return { ...n, animais };
    }));
    
    res.json(negociacoesComAnimais);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const negociacao = await get(`
      SELECT n.*, c.nome as cliente_nome, c.telefone as cliente_telefone
      FROM negociacoes n
      JOIN clientes c ON n.cliente_id = c.id
      WHERE n.id = $1
    `, [req.params.id]);
    
    if (!negociacao) {
      return res.status(404).json({ error: 'Negociação não encontrada' });
    }
    
    const animais = await all(`
      SELECT na.*, a.brinco, a.tipo, a.sexo, a.raca, a.idade, a.peso_atual
      FROM negociacao_animais na
      JOIN animais a ON na.animal_id = a.id
      WHERE na.negociacao_id = $1
    `, [req.params.id]);
    
    res.json({ ...negociacao, animais });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tipo, cliente_id, data, animais, preco_arroba, situacao, observacoes } = req.body;
    const id = uuidv4();
    
    let pesoTotal = 0;
    let valorTotal = 0;
    
    await run(`
      INSERT INTO negociacoes (id, tipo, cliente_id, data, situacao, observacoes, preco_arroba)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, tipo, cliente_id, data, situacao || 'concluida', observacoes, preco_arroba]);
    
    for (const a of animais) {
      const peso = a.peso || a.peso_atual || 0;
      const valor = preco_arroba ? (peso / 15) * preco_arroba : a.valor;
      
      pesoTotal += peso;
      valorTotal += valor;
      
      await run(`
        INSERT INTO negociacao_animais (id, negociacao_id, animal_id, peso, valor)
        VALUES ($1, $2, $3, $4, $5)
      `, [uuidv4(), id, a.animal_id, peso, valor]);
      
      const novoStatus = tipo === 'venda' ? 'vendido' : 'disponivel';
      const destinoId = tipo === 'venda' ? cliente_id : null;
      const origemId = tipo === 'compra' ? cliente_id : null;
      
      await run(`UPDATE animais SET status = $1, destino_id = $2, origem_id = $3, peso_atual = COALESCE($4, peso_atual), updated_at = CURRENT_TIMESTAMP WHERE id = $5`, 
        [novoStatus, destinoId, origemId, a.peso, a.animal_id]);
    }
    
    const quantidade = animais.length;
    const pesoMedio = quantidade > 0 ? pesoTotal / quantidade : 0;
    
    await run(`
      UPDATE negociacoes SET quantidade_animais = $1, peso_total = $2, peso_medio = $3, valor_total = $4 WHERE id = $5
    `, [quantidade, pesoTotal, pesoMedio, valorTotal, id]);
    
    if (tipo === 'compra') {
      await run(`
        INSERT INTO contas_pagar (id, negociacao_id, cliente_id, descricao, valor_total, data_vencimento)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [uuidv4(), id, cliente_id, `Compra de ${quantidade} animais`, valorTotal, data]);
    } else {
      await run(`
        INSERT INTO contas_receber (id, negociacao_id, cliente_id, descricao, valor_total, data_vencimento)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [uuidv4(), id, cliente_id, `Venda de ${quantidade} animais`, valorTotal, data]);
    }
    
    const negociacao = await get(`
      SELECT n.*, c.nome as cliente_nome
      FROM negociacoes n
      JOIN clientes c ON n.cliente_id = c.id
      WHERE n.id = $1
    `, [id]);
    
    res.status(201).json(negociacao);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { situacao, observacoes } = req.body;
    await run(`UPDATE negociacoes SET situacao = $1, observacoes = $2 WHERE id = $3`, [situacao, observacoes, req.params.id]);
    const negociacao = await get('SELECT * FROM negociacoes WHERE id = $1', [req.params.id]);
    res.json(negociacao);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const animais = await all('SELECT animal_id FROM negociacao_animais WHERE negociacao_id = $1', [req.params.id]);
    
    for (const a of animais) {
      await run('UPDATE animais SET status = $1 WHERE id = $2', ['disponivel', a.animal_id]);
    }
    
    await run('DELETE FROM negociacao_animais WHERE negociacao_id = $1', [req.params.id]);
    await run('DELETE FROM contas_pagar WHERE negociacao_id = $1', [req.params.id]);
    await run('DELETE FROM contas_receber WHERE negociacao_id = $1', [req.params.id]);
    await run('DELETE FROM negociacoes WHERE id = $1', [req.params.id]);
    
    res.json({ message: 'Negociação deletada com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/resumo', async (req, res) => {
  try {
    const { mes, ano } = req.query;
    const mesAtual = mes || new Date().getMonth() + 1;
    const anoAtual = ano || new Date().getFullYear();
    
    const vendas = await get(`
      SELECT COUNT(*) as count, COALESCE(SUM(valor_total), 0) as total, COALESCE(SUM(quantidade_animais), 0) as animais
      FROM negociacoes WHERE tipo = 'venda' AND TO_CHAR(data::date, 'MM') = $1 AND TO_CHAR(data::date, 'YYYY') = $2
    `, [String(mesAtual).padStart(2, '0'), String(anoAtual)]);
    
    const compras = await get(`
      SELECT COUNT(*) as count, COALESCE(SUM(valor_total), 0) as total, COALESCE(SUM(quantidade_animais), 0) as animais
      FROM negociacoes WHERE tipo = 'compra' AND TO_CHAR(data::date, 'MM') = $1 AND TO_CHAR(data::date, 'YYYY') = $2
    `, [String(mesAtual).padStart(2, '0'), String(anoAtual)]);
    
    res.json({
      mes: mesAtual,
      ano: anoAtual,
      vendas: { ...vendas, total: parseFloat(vendas.total) || 0 },
      compras: { ...compras, total: parseFloat(compras.total) || 0 },
      lucro: (parseFloat(vendas.total) || 0) - (parseFloat(compras.total) || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
