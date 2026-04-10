import { Router } from 'express';
import { get, all, run } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/talhoes', async (req, res) => {
  try { const r = await all('SELECT * FROM talhoes ORDER BY nome'); res.json(r); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/talhoes', async (req, res) => {
  try {
    const { nome, area_hectares, localizacao, observacoes } = req.body;
    const id = uuidv4();
    await run(`INSERT INTO talhoes (id, nome, area_hectares, localizacao, observacoes) VALUES ($1, $2, $3, $4, $5)`, [id, nome, area_hectares, localizacao, observacoes]);
    const r = await get('SELECT * FROM talhoes WHERE id = $1', [id]);
    res.status(201).json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/talhoes/:id', async (req, res) => {
  try {
    const { nome, area_hectares, localizacao, observacoes } = req.body;
    await run(`UPDATE talhoes SET nome = $1, area_hectares = $2, localizacao = $3, observacoes = $4 WHERE id = $5`, [nome, area_hectares, localizacao, observacoes, req.params.id]);
    const r = await get('SELECT * FROM talhoes WHERE id = $1', [req.params.id]);
    res.json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/talhoes/:id', async (req, res) => {
  try { await run('DELETE FROM talhoes WHERE id = $1', [req.params.id]); res.json({ message: 'Talhão deletado' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/safras', async (req, res) => {
  try {
    const { ano, talhao_id } = req.query;
    let query = `SELECT s.*, t.nome as talhao_nome, t.area_hectares FROM safras_milho s JOIN talhoes t ON s.talhao_id = t.id WHERE 1=1`;
    const params = []; let i = 1;
    if (ano) { query += ` AND s.ano = $${i++}`; params.push(ano); }
    if (talhao_id) { query += ` AND s.talhao_id = $${i++}`; params.push(talhao_id); }
    query += ' ORDER BY s.ano DESC, s.data_plantio DESC';
    
    const safras = await all(query, params);
    const result = await Promise.all(safras.map(async (s) => {
      const custos = await get('SELECT COALESCE(SUM(custo), 0) as total FROM atividades_agricolas WHERE safra_id = $1', [s.id]);
      const atividades = await all('SELECT * FROM atividades_agricolas WHERE safra_id = $1 ORDER BY data DESC', [s.id]);
      return { ...s, custo_total: parseFloat(custos?.total) || 0, atividades };
    }));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/safras', async (req, res) => {
  try {
    const { talhao_id, ano, variedade, data_plantio, data_colheita_prevista, area_plantada, producao_prevista } = req.body;
    const id = uuidv4();
    await run(`INSERT INTO safras_milho (id, talhao_id, ano, variedade, data_plantio, data_colheita_prevista, area_plantada, producao_prevista) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, talhao_id, ano, variedade, data_plantio, data_colheita_prevista, area_plantada, producao_prevista]);
    const r = await get(`SELECT s.*, t.nome as talhao_nome FROM safras_milho s JOIN talhoes t ON s.talhao_id = t.id WHERE s.id = $1`, [id]);
    res.status(201).json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/safras/:id', async (req, res) => {
  try {
    const { variedade, data_plantio, data_colheita_prevista, producao_real, situacao } = req.body;
    await run(`UPDATE safras_milho SET variedade = $1, data_plantio = $2, data_colheita_prevista = $3, producao_real = $4, situacao = $5 WHERE id = $6`, [variedade, data_plantio, data_colheita_prevista, producao_real, situacao, req.params.id]);
    const r = await get('SELECT * FROM safras_milho WHERE id = $1', [req.params.id]);
    res.json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/safras/:id', async (req, res) => {
  try { await run('DELETE FROM atividades_agricolas WHERE safra_id = $1', [req.params.id]); await run('DELETE FROM safras_milho WHERE id = $1', [req.params.id]); res.json({ message: 'Safra deletada' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/atividades', async (req, res) => {
  try {
    const { safra_id, tipo, descricao, data, custo, insumos, observacoes } = req.body;
    const id = uuidv4();
    await run(`INSERT INTO atividades_agricolas (id, safra_id, tipo, descricao, data, custo, insumos, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, safra_id, tipo, descricao, data, custo, insumos, observacoes]);
    const r = await get('SELECT * FROM atividades_agricolas WHERE id = $1', [id]);
    res.status(201).json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/atividades/:id', async (req, res) => {
  try { await run('DELETE FROM atividades_agricolas WHERE id = $1', [req.params.id]); res.json({ message: 'Atividade deletada' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/stats/resumo', async (req, res) => {
  try {
    const { ano } = req.query;
    const anoAtual = ano || new Date().getFullYear();
    const talhoes = await get('SELECT COUNT(*) as total, COALESCE(SUM(area_hectares), 0) as area_total FROM talhoes');
    const safras = await get('SELECT COUNT(*) as total FROM safras_milho WHERE ano = $1', [anoAtual]);
    const producao = await get(`SELECT COALESCE(SUM(producao_real), 0) as total, COALESCE(SUM(area_plantada), 0) as area_plantada FROM safras_milho WHERE ano = $1 AND producao_real IS NOT NULL`, [anoAtual]);
    const custos = await get(`SELECT COALESCE(SUM(a.custo), 0) as total FROM atividades_agricolas a JOIN safras_milho s ON a.safra_id = s.id WHERE s.ano = $1`, [anoAtual]);
    
    const prod = parseFloat(producao?.area_plantada) || 0;
    const total = parseFloat(producao?.total) || 0;
    const custoTotal = parseFloat(custos?.total) || 0;
    
    res.json({
      ano: anoAtual,
      total_talhoes: parseInt(talhoes?.total) || 0,
      area_total: parseFloat(talhoes?.area_total) || 0,
      total_safras: parseInt(safras?.total) || 0,
      producao_total: total,
      area_plantada: prod,
      custo_total: custoTotal,
      produtividade_media: prod > 0 ? total / prod : 0,
      custo_por_saca: total > 0 ? custoTotal / total : 0
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
