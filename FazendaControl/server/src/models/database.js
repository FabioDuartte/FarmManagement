import pg from 'pg';
import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;
let pool = null;
const USE_POSTGRES = !!process.env.DATABASE_URL;
const dataDir = join(__dirname, '../../data');
const dbPath = join(dataDir, 'fazendacontrol.db');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

export async function initDatabase() {
  if (USE_POSTGRES) {
    console.log('📦 Using PostgreSQL...');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE NOT NULL,
          senha TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS clientes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nome TEXT NOT NULL,
          tipo TEXT DEFAULT 'ambos',
          cpf_cnpj TEXT,
          telefone TEXT,
          email TEXT,
          endereco TEXT,
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS animais (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          brinco TEXT UNIQUE NOT NULL,
          tipo TEXT NOT NULL,
          sexo TEXT NOT NULL,
          raca TEXT,
          idade TEXT,
          peso_atual REAL,
          status TEXT DEFAULT 'disponivel',
          categoria TEXT,
          foto_url TEXT,
          origem_id UUID REFERENCES clientes(id),
          destino_id UUID REFERENCES clientes(id),
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS negociacoes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tipo TEXT NOT NULL,
          cliente_id UUID NOT NULL REFERENCES clientes(id),
          data TEXT NOT NULL,
          quantidade_animais INTEGER,
          peso_total REAL,
          peso_medio REAL,
          preco_arroba REAL,
          valor_total REAL,
          situacao TEXT DEFAULT 'concluida',
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS negociacao_animais (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          negociacao_id UUID NOT NULL REFERENCES negociacoes(id),
          animal_id UUID NOT NULL REFERENCES animais(id),
          peso REAL,
          valor REAL
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS contas_pagar (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          negociacao_id UUID REFERENCES negociacoes(id),
          cliente_id UUID NOT NULL REFERENCES clientes(id),
          descricao TEXT NOT NULL,
          valor_total REAL NOT NULL,
          valor_pago REAL DEFAULT 0,
          data_vencimento TEXT NOT NULL,
          data_pagamento TEXT,
          situacao TEXT DEFAULT 'pendente',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS contas_receber (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          negociacao_id UUID REFERENCES negociacoes(id),
          cliente_id UUID NOT NULL REFERENCES clientes(id),
          descricao TEXT NOT NULL,
          valor_total REAL NOT NULL,
          valor_recebido REAL DEFAULT 0,
          data_vencimento TEXT NOT NULL,
          data_recebimento TEXT,
          situacao TEXT DEFAULT 'pendente',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS talhoes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          nome TEXT NOT NULL,
          area_hectares REAL,
          localizacao TEXT,
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS safras_milho (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          talhao_id UUID NOT NULL REFERENCES talhoes(id),
          ano INTEGER NOT NULL,
          variedade TEXT,
          data_plantio TEXT,
          data_colheita_prevista TEXT,
          area_plantada REAL,
          producao_prevista REAL,
          producao_real REAL,
          situacao TEXT DEFAULT 'planejada',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS atividades_agricolas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          safra_id UUID NOT NULL REFERENCES safras_milho(id),
          tipo TEXT NOT NULL,
          descricao TEXT,
          data TEXT NOT NULL,
          custo REAL,
          insumos TEXT,
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS vacas_leiteiras (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          brinco TEXT UNIQUE NOT NULL,
          nome TEXT,
          raca TEXT,
          data_nascimento TEXT,
          data_parto TEXT,
          producao_media_diaria REAL,
          status TEXT DEFAULT 'ativa',
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS registros_ordenha (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vaca_id UUID NOT NULL REFERENCES vacas_leiteiras(id),
          data TEXT NOT NULL,
          horario TEXT NOT NULL,
          litros REAL NOT NULL,
          gordura REAL,
          proteina REAL,
          ccs INTEGER,
          observacoes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ PostgreSQL tables created');
    } finally {
      client.release();
    }
    return pool;
  } else {
    console.log('📦 Using SQLite (local)...');
    const SQL = await initSqlJs();
    if (existsSync(dbPath)) {
      const buffer = readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    
    db.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        tipo TEXT DEFAULT 'ambos',
        cpf_cnpj TEXT,
        telefone TEXT,
        email TEXT,
        endereco TEXT,
        observacoes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS animais (
        id TEXT PRIMARY KEY,
        brinco TEXT UNIQUE NOT NULL,
        tipo TEXT NOT NULL,
        sexo TEXT NOT NULL,
        raca TEXT,
        idade TEXT,
        peso_atual REAL,
        status TEXT DEFAULT 'disponivel',
        categoria TEXT,
        foto_url TEXT,
        origem_id TEXT,
        destino_id TEXT,
        observacoes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS negociacoes (
        id TEXT PRIMARY KEY,
        tipo TEXT NOT NULL,
        cliente_id TEXT NOT NULL,
        data TEXT NOT NULL,
        quantidade_animais INTEGER,
        peso_total REAL,
        peso_medio REAL,
        preco_arroba REAL,
        valor_total REAL,
        situacao TEXT DEFAULT 'concluida',
        observacoes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS negociacao_animais (
        id TEXT PRIMARY KEY,
        negociacao_id TEXT NOT NULL,
        animal_id TEXT NOT NULL,
        peso REAL,
        valor REAL
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS contas_pagar (
        id TEXT PRIMARY KEY,
        negociacao_id TEXT,
        cliente_id TEXT NOT NULL,
        descricao TEXT NOT NULL,
        valor_total REAL NOT NULL,
        valor_pago REAL DEFAULT 0,
        data_vencimento TEXT NOT NULL,
        data_pagamento TEXT,
        situacao TEXT DEFAULT 'pendente',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS contas_receber (
        id TEXT PRIMARY KEY,
        negociacao_id TEXT,
        cliente_id TEXT NOT NULL,
        descricao TEXT NOT NULL,
        valor_total REAL NOT NULL,
        valor_recebido REAL DEFAULT 0,
        data_vencimento TEXT NOT NULL,
        data_recebimento TEXT,
        situacao TEXT DEFAULT 'pendente',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS talhoes (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        area_hectares REAL,
        localizacao TEXT,
        observacoes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS safras_milho (
        id TEXT PRIMARY KEY,
        talhao_id TEXT NOT NULL,
        ano INTEGER NOT NULL,
        variedade TEXT,
        data_plantio TEXT,
        data_colheita_prevista TEXT,
        area_plantada REAL,
        producao_prevista REAL,
        producao_real REAL,
        situacao TEXT DEFAULT 'planejada',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS atividades_agricolas (
        id TEXT PRIMARY KEY,
        safra_id TEXT NOT NULL,
        tipo TEXT NOT NULL,
        descricao TEXT,
        data TEXT NOT NULL,
        custo REAL,
        insumos TEXT,
        observacoes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS vacas_leiteiras (
        id TEXT PRIMARY KEY,
        brinco TEXT UNIQUE NOT NULL,
        nome TEXT,
        raca TEXT,
        data_nascimento TEXT,
        data_parto TEXT,
        producao_media_diaria REAL,
        status TEXT DEFAULT 'ativa',
        observacoes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS registros_ordenha (
        id TEXT PRIMARY KEY,
        vaca_id TEXT NOT NULL,
        data TEXT NOT NULL,
        horario TEXT NOT NULL,
        litros REAL NOT NULL,
        gordura REAL,
        proteina REAL,
        ccs INTEGER,
        observacoes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    saveDatabase();
    console.log('✅ SQLite database initialized');
    return db;
  }
}

export function saveDatabase() {
  if (db && !USE_POSTGRES) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

export async function run(sql, params = []) {
  if (USE_POSTGRES) {
    return pool.query(sql, params);
  } else {
    db.run(sql, params);
    saveDatabase();
  }
}

export async function get(sql, params = []) {
  if (USE_POSTGRES) {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } else {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }
}

export async function all(sql, params = []) {
  if (USE_POSTGRES) {
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
    const results = [];
    const stmt = db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }
}

export async function transaction(callback) {
  if (USE_POSTGRES) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await callback(client);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } else {
    db.run('BEGIN TRANSACTION');
    try {
      callback();
      db.run('COMMIT');
      saveDatabase();
    } catch (e) {
      db.run('ROLLBACK');
      throw e;
    }
  }
}
