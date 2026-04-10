import { Router } from 'express';
import { get, all, run } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/pagar', async (req, res) => {
  try {
    const { situacao, mes, ano } = req.query;
    let query = `
      SELECT cp.*, c.nome as cliente_nome, n.tipo as negociacao_tipo
      FROM contas_pagar cp
      JOIN clientes c ON cp.cliente_id = c.id
      LEFT JOIN negociacoes n ON cp.negociacao_id = n.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    
    if (situacao) { query += ` AND cp.situacao = $${i++}`; params.push(situacao); }
    if (mes) { query += ` AND TO_CHAR(cp.data_vencimento::date, 'MM') = $${i++}`; params.push(mes.padStart(2, '0')); }
    if (ano) { query += ` AND TO_CHAR(cp.data_vencimento::date, 'YYYY') = $${i++}`; params.push(ano); }
    
    query += ' ORDER BY cp.data_vencimento';
    
    const contas = await all(query, params);
    res.json(contas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/receber', async (req, res) => {
  try {
    const { situacao, mes, ano } = req.query;
    let query = `
      SELECT cr.*, c.nome as cliente_nome, n.tipo as negociacao_tipo
      FROM contas_receber cr
      JOIN clientes c ON cr.cliente_id = c.id
      LEFT JOIN negociacoes n ON cr.negociacao_id = n.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    
    if (situacao) { query += ` AND cr.situacao = $${i++}`; params.push(situacao); }
    if (mes) { query += ` AND TO_CHAR(cr.data_vencimento::date, 'MM') = $${i++}`; params.push(mes.padStart(2, '0')); }
    if (ano) { query += ` AND TO_CHAR(cr.data_vencimento::date, 'YYYY') = $${i++}`; params.push(ano); }
    
    query += ' ORDER BY cr.data_vencimento';
    
    const contas = await all(query, params);
    res.json(contas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/pagar/:id/pagar', async (req, res) => {
  try {
    const { valor, data_pagamento } = req.body;
    const conta = await get('SELECT * FROM contas_pagar WHERE id = $1', [req.params.id]);
    if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });
    
    const novoValorPago = conta.valor_pago + valor;
    const novaSituacao = novoValorPago >= conta.valor_total ? 'quitada' : 'parcial';
    
    await run(`
      UPDATE contas_pagar SET valor_pago = $1, situacao = $2, data_pagamento = CASE WHEN $3 >= valor_total THEN $4 ELSE data_pagamento END
      WHERE id = $5
    `, [novoValorPago, novaSituacao, novoValorPago, data_pagamento, req.params.id]);
    
    const contaAtualizada = await get('SELECT * FROM contas_pagar WHERE id = $1', [req.params.id]);
    res.json(contaAtualizada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/receber/:id/receber', async (req, res) => {
  try {
    const { valor, data_recebimento } = req.body;
    const conta = await get('SELECT * FROM contas_receber WHERE id = $1', [req.params.id]);
    if (!conta) return res.status(404).json({ error: 'Conta não encontrada' });
    
    const novoValorRecebido = conta.valor_recebido + valor;
    const novaSituacao = novoValorRecebido >= conta.valor_total ? 'quitada' : 'parcial';
    
    await run(`
      UPDATE contas_receber SET valor_recebido = $1, situacao = $2, data_recebimento = CASE WHEN $3 >= valor_total THEN $4 ELSE data_recebimento END
      WHERE id = $5
    `, [novoValorRecebido, novaSituacao, novoValorRecebido, data_recebimento, req.params.id]);
    
    const contaAtualizada = await get('SELECT * FROM contas_receber WHERE id = $1', [req.params.id]);
    res.json(contaAtualizada);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pagar', async (req, res) => {
  try {
    const { cliente_id, descricao, valor_total, data_vencimento, negociacao_id } = req.body;
    const id = uuidv4();
    await run(`INSERT INTO contas_pagar (id, cliente_id, descricao, valor_total, data_vencimento, negociacao_id) VALUES ($1, $2, $3, $4, $5, $6)`, [id, cliente_id, descricao, valor_total, data_vencimento, negociacao_id]);
    const conta = await get('SELECT * FROM contas_pagar WHERE id = $1', [id]);
    res.status(201).json(conta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/receber', async (req, res) => {
  try {
    const { cliente_id, descricao, valor_total, data_vencimento, negociacao_id } = req.body;
    const id = uuidv4();
    await run(`INSERT INTO contas_receber (id, cliente_id, descricao, valor_total, data_vencimento, negociacao_id) VALUES ($1, $2, $3, $4, $5, $6)`, [id, cliente_id, descricao, valor_total, data_vencimento, negociacao_id]);
    const conta = await get('SELECT * FROM contas_receber WHERE id = $1', [id]);
    res.status(201).json(conta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/pagar/:id', async (req, res) => {
  try { await run('DELETE FROM contas_pagar WHERE id = $1', [req.params.id]); res.json({ message: 'Conta deletada' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/receber/:id', async (req, res) => {
  try { await run('DELETE FROM contas_receber WHERE id = $1', [req.params.id]); res.json({ message: 'Conta deletada' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/resumo', async (req, res) => {
  try {
    const totalPagar = await get(`SELECT COALESCE(SUM(valor_total - valor_pago), 0) as total FROM contas_pagar WHERE situacao != 'quitada'`);
    const totalReceber = await get(`SELECT COALESCE(SUM(valor_total - valor_recebido), 0) as total FROM contas_receber WHERE situacao != 'quitada'`);
    
    res.json({
      total_a_pagar: parseFloat(totalPagar?.total) || 0,
      total_a_receber: parseFloat(totalReceber?.total) || 0,
      saldo_previsto: (parseFloat(totalReceber?.total) || 0) - (parseFloat(totalPagar?.total) || 0),
      pagar_vencidas: { count: 0, total: 0 },
      receber_vencidas: { count: 0, total: 0 },
      pagar_proximo: { count: 0, total: 0 },
      receber_proximo: { count: 0, total: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
