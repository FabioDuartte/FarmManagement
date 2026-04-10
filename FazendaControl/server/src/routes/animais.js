import { Router } from 'express';
import { get, all, run } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { status, tipo, sexo } = req.query;
    let query = `
      SELECT a.*, 
        c_origem.nome as origem_nome,
        c_destino.nome as destino_nome
      FROM animais a
      LEFT JOIN clientes c_origem ON a.origem_id = c_origem.id
      LEFT JOIN clientes c_destino ON a.destino_id = c_destino.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }
    if (tipo) {
      paramCount++;
      query += ` AND a.tipo = $${paramCount}`;
      params.push(tipo);
    }
    if (sexo) {
      paramCount++;
      query += ` AND a.sexo = $${paramCount}`;
      params.push(sexo);
    }
    
    query += ' ORDER BY a.brinco';
    
    const animais = await all(query, params);
    res.json(animais);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const animal = await get(`
      SELECT a.*, 
        c_origem.nome as origem_nome,
        c_destino.nome as destino_nome
      FROM animais a
      LEFT JOIN clientes c_origem ON a.origem_id = c_origem.id
      LEFT JOIN clientes c_destino ON a.destino_id = c_destino.id
      WHERE a.id = $1
    `, [req.params.id]);
    
    if (!animal) {
      return res.status(404).json({ error: 'Animal não encontrado' });
    }
    
    const historico = await all(`
      SELECT n.*, na.animal_id 
      FROM negociacao_animais na
      JOIN negociacoes n ON na.negociacao_id = n.id
      WHERE na.animal_id = $1
      ORDER BY n.data DESC
    `, [req.params.id]);
    
    res.json({ ...animal, historico });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/brinco/:brinco', async (req, res) => {
  try {
    const animal = await get('SELECT * FROM animais WHERE brinco = $1', [req.params.brinco]);
    
    if (!animal) {
      return res.status(404).json({ error: 'Animal não encontrado' });
    }
    
    res.json(animal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { brinco, tipo, sexo, raca, idade, peso_atual, categoria, foto_url, origem_id, observacoes } = req.body;
    const id = uuidv4();
    
    const existe = await get('SELECT id FROM animais WHERE brinco = $1', [brinco]);
    if (existe) {
      return res.status(400).json({ error: 'Já existe um animal com este brinco' });
    }
    
    await run(`
      INSERT INTO animais (id, brinco, tipo, sexo, raca, idade, peso_atual, categoria, foto_url, origem_id, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [id, brinco, tipo, sexo, raca, idade, peso_atual, categoria, foto_url, origem_id, observacoes]);
    
    const animal = await get('SELECT * FROM animais WHERE id = $1', [id]);
    res.status(201).json(animal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { brinco, tipo, sexo, raca, idade, peso_atual, status, categoria, foto_url, destino_id, observacoes } = req.body;
    
    await run(`
      UPDATE animais SET 
        brinco = $1, tipo = $2, sexo = $3, raca = $4, idade = $5,
        peso_atual = $6, status = $7, categoria = $8, foto_url = $9,
        destino_id = $10, observacoes = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
    `, [brinco, tipo, sexo, raca, idade, peso_atual, status, categoria, foto_url, destino_id, observacoes, req.params.id]);
    
    const animal = await get('SELECT * FROM animais WHERE id = $1', [req.params.id]);
    res.json(animal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/peso', async (req, res) => {
  try {
    const { peso } = req.body;
    await run('UPDATE animais SET peso_atual = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [peso, req.params.id]);
    const animal = await get('SELECT * FROM animais WHERE id = $1', [req.params.id]);
    res.json(animal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM animais WHERE id = $1', [req.params.id]);
    res.json({ message: 'Animal deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/resumo', async (req, res) => {
  try {
    const total = await get('SELECT COUNT(*) as count FROM animais');
    const porStatus = await all('SELECT status, COUNT(*) as count FROM animais GROUP BY status');
    const porSexo = await all('SELECT sexo, COUNT(*) as count FROM animais GROUP BY sexo');
    const porTipo = await all('SELECT tipo, COUNT(*) as count FROM animais GROUP BY tipo');
    const pesoMedio = await get('SELECT AVG(peso_atual) as peso_medio FROM animais WHERE peso_atual IS NOT NULL');
    
    res.json({
      total: parseInt(total?.count) || 0,
      porStatus,
      porSexo,
      porTipo,
      pesoMedio: pesoMedio?.peso_medio || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
