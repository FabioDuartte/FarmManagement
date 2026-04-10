import { Router } from 'express';
import { get, all, run } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/vacas', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM vacas_leiteiras WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = $1'; params.push(status); }
    query += ' ORDER BY brinco';
    const r = await all(query, params);
    res.json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/vacas/:id', async (req, res) => {
  try {
    const vaca = await get('SELECT * FROM vacas_leiteiras WHERE id = $1', [req.params.id]);
    if (!vaca) return res.status(404).json({ error: 'Vaca não encontrada' });
    const producao = await all('SELECT * FROM registros_ordenha WHERE vaca_id = $1 ORDER BY data DESC, horario DESC LIMIT 30', [req.params.id]);
    res.json({ ...vaca, producao });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/vacas', async (req, res) => {
  try {
    const { brinco, nome, raca, data_nascimento, data_parto, producao_media_diaria, observacoes } = req.body;
    const existe = await get('SELECT id FROM vacas_leiteiras WHERE brinco = $1', [brinco]);
    if (existe) return res.status(400).json({ error: 'Já existe uma vaca com este brinco' });
    
    const id = uuidv4();
    await run(`INSERT INTO vacas_leiteiras (id, brinco, nome, raca, data_nascimento, data_parto, producao_media_diaria, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, brinco, nome, raca, data_nascimento, data_parto, producao_media_diaria, observacoes]);
    const r = await get('SELECT * FROM vacas_leiteiras WHERE id = $1', [id]);
    res.status(201).json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/vacas/:id', async (req, res) => {
  try {
    const { brinco, nome, raca, data_nascimento, data_parto, producao_media_diaria, status, observacoes } = req.body;
    await run(`UPDATE vacas_leiteiras SET brinco = $1, nome = $2, raca = $3, data_nascimento = $4, data_parto = $5, producao_media_diaria = $6, status = $7, observacoes = $8 WHERE id = $9`, [brinco, nome, raca, data_nascimento, data_parto, producao_media_diaria, status, observacoes, req.params.id]);
    const r = await get('SELECT * FROM vacas_leiteiras WHERE id = $1', [req.params.id]);
    res.json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/vacas/:id', async (req, res) => {
  try { await run('DELETE FROM registros_ordenha WHERE vaca_id = $1', [req.params.id]); await run('DELETE FROM vacas_leiteiras WHERE id = $1', [req.params.id]); res.json({ message: 'Vaca deletada' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/registros', async (req, res) => {
  try {
    const { data, vaca_id } = req.query;
    let query = `SELECT r.*, v.brinco, v.nome as vaca_nome FROM registros_ordenha r JOIN vacas_leiteiras v ON r.vaca_id = v.id WHERE 1=1`;
    const params = []; let i = 1;
    if (data) { query += ` AND r.data = $${i++}`; params.push(data); }
    if (vaca_id) { query += ` AND r.vaca_id = $${i++}`; params.push(vaca_id); }
    query += ' ORDER BY r.data DESC, r.horario DESC';
    const r = await all(query, params);
    res.json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/registros', async (req, res) => {
  try {
    const { vaca_id, data, horario, litros, gordura, proteina, ccs, observacoes } = req.body;
    const id = uuidv4();
    await run(`INSERT INTO registros_ordenha (id, vaca_id, data, horario, litros, gordura, proteina, ccs, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [id, vaca_id, data, horario, litros, gordura, proteina, ccs, observacoes]);
    const r = await get(`SELECT r.*, v.brinco, v.nome as vaca_nome FROM registros_ordenha r JOIN vacas_leiteiras v ON r.vaca_id = v.id WHERE r.id = $1`, [id]);
    res.status(201).json(r);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/registros/:id', async (req, res) => {
  try { await run('DELETE FROM registros_ordenha WHERE id = $1', [req.params.id]); res.json({ message: 'Registro deletado' }); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/stats/resumo', async (req, res) => {
  try {
    const { data } = req.query;
    const dataAtual = data || new Date().toISOString().split('T')[0];
    
    const rebanho = await get(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'ativa' THEN 1 ELSE 0 END) as ativas FROM vacas_leiteiras`);
    const producaoDiaria = await get(`SELECT COALESCE(SUM(litros), 0) as total_litros, COUNT(*) as total_ordenhas FROM registros_ordenha WHERE data = $1`, [dataAtual]);
    const producaoGeral = await all(`SELECT SUM(litros) as total FROM registros_ordenha WHERE data >= CURRENT_DATE - INTERVAL '30 days' GROUP BY data`, []);
    const mediaDiaria = producaoGeral.length > 0 ? producaoGeral.reduce((sum, r) => sum + parseFloat(r.total), 0) / producaoGeral.length : 0;
    const qualidade = await get(`SELECT AVG(gordura) as media_gordura, AVG(proteina) as media_proteina, AVG(ccs) as media_ccs FROM registros_ordenha WHERE data = $1 AND ccs IS NOT NULL`, [dataAtual]);
    const top = await all(`SELECT v.brinco, v.nome, SUM(r.litros) as total FROM registros_ordenha r JOIN vacas_leiteiras v ON r.vaca_id = v.id WHERE r.data = $1 GROUP BY v.id ORDER BY total DESC LIMIT 10`, [dataAtual]);
    
    res.json({
      data: dataAtual,
      rebanho: { total: parseInt(rebanho?.total) || 0, ativas: parseInt(rebanho?.ativas) || 0 },
      producao_diaria: { total_litros: parseFloat(producaoDiaria?.total_litros) || 0, total_ordenhas: parseInt(producaoDiaria?.total_ordenhas) || 0 },
      media_30_dias: mediaDiaria,
      qualidade: { media_gordura: parseFloat(qualidade?.media_gordura) || 0, media_proteina: parseFloat(qualidade?.media_proteina) || 0, media_ccs: parseFloat(qualidade?.media_ccs) || 0 },
      top_productoras: top
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/stats/historico', async (req, res) => {
  try {
    const { dias } = req.query;
    const diasParams = dias || 30;
    const historico = await all(`SELECT data, SUM(litros) as total_litros, COUNT(*) as total_ordenhas, AVG(gordura) as media_gordura, AVG(proteina) as media_proteina FROM registros_ordenha WHERE data >= CURRENT_DATE - INTERVAL '${diasParams}' DAY GROUP BY data ORDER BY data DESC`, []);
    res.json(historico);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

export default router;
