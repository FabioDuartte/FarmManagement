import { Router } from 'express';
import { get, all, run } from '../models/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const clientes = await all('SELECT * FROM clientes ORDER BY nome');
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cliente = await get('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    const negociacoes = await all('SELECT * FROM negociacoes WHERE cliente_id = $1 ORDER BY data DESC', [req.params.id]);
    
    const aReceber = await get('SELECT COALESCE(SUM(valor_total - valor_recebido), 0) as total FROM contas_receber WHERE cliente_id = $1 AND situacao != $2', [req.params.id, 'quitada']);
    
    const aPagar = await get('SELECT COALESCE(SUM(valor_total - valor_pago), 0) as total FROM contas_pagar WHERE cliente_id = $1 AND situacao != $2', [req.params.id, 'quitada']);
    
    res.json({
      ...cliente,
      negociacoes,
      total_a_receber: aReceber?.total || 0,
      total_a_pagar: aPagar?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, tipo, cpf_cnpj, telefone, email, endereco, observacoes } = req.body;
    const id = uuidv4();
    
    await run(`
      INSERT INTO clientes (id, nome, tipo, cpf_cnpj, telefone, email, endereco, observacoes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, nome, tipo || 'ambos', cpf_cnpj, telefone, email, endereco, observacoes]);
    
    const cliente = await get('SELECT * FROM clientes WHERE id = $1', [id]);
    res.status(201).json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, tipo, cpf_cnpj, telefone, email, endereco, observacoes } = req.body;
    
    await run(`
      UPDATE clientes SET 
        nome = $1, tipo = $2, cpf_cnpj = $3, telefone = $4, 
        email = $5, endereco = $6, observacoes = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
    `, [nome, tipo, cpf_cnpj, telefone, email, endereco, observacoes, req.params.id]);
    
    const cliente = await get('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM clientes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
