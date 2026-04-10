import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import clientesRoutes from './routes/clientes.js';
import animaisRoutes from './routes/animais.js';
import negociacoesRoutes from './routes/negociacoes.js';
import financasRoutes from './routes/financas.js';
import agricolaRoutes from './routes/agricola.js';
import ordenhaRoutes from './routes/ordenha.js';
import authRoutes from './routes/auth.js';
import { initDatabase } from './models/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://fazendacontrol.vercel.app', /\.vercel\.app$/] 
    : '*',
  credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/clientes', clientesRoutes);
app.use('/api/animais', animaisRoutes);
app.use('/api/negociacoes', negociacoesRoutes);
app.use('/api/financas', financasRoutes);
app.use('/api/agricola', agricolaRoutes);
app.use('/api/ordenha', ordenhaRoutes);
app.use('/api/auth', authRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Database connected');
    
    app.listen(PORT, () => {
      console.log(`🚀 FazendaControl API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
