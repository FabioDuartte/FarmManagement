# FazendaControl - Sistema de Gestão Rural

Sistema completo para gestão de propriedades rurais, com foco em pecuária, agricultura (milho) e ordenha.

## Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão geral do negócio |
| **Animais** | Cadastro e gestão do rebanho |
| **Negociações** | Registro de compras e vendas |
| **Clientes** | Gestão de parceiros comerciais |
| **Finanças** | Contas a pagar e receber |
| **Milho** | Plantação de milho |
| **Ordenha** | Produção leiteira |
| **Relatórios** | Análise de indicadores |

## Tecnologias

- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React + Vite
- **Banco de Dados:** PostgreSQL
- **Gráficos:** Recharts

## Desenvolvimento Local

```bash
# Backend
cd server
npm install
npm start

# Frontend
cd client
npm install
npm run dev
```

Acesse: http://localhost:3000

## Deploy na Nuvem

### Backend (Render.com)

1. Criar conta em https://render.com
2. Criar PostgreSQL (Free)
3. Criar Web Service com `DATABASE_URL`

### Frontend (Vercel)

1. Criar conta em https://vercel.com
2. Importar projeto
3. Configurar `VITE_API_URL`

## Estrutura

```
FazendaControl/
├── server/          # API REST
│   └── src/
│       ├── routes/  # Endpoints
│       └── models/ # Banco de dados
├── client/         # Interface React
│   └── src/
│       └── pages/  # Páginas
├── vercel.json     # Config Vercel
├── DEPLOY.md       # Guia de deploy
└── README.md
```

## Versão Online

Acesse a versão demo: **https://fazendacontrol.vercel.app**

*(Backend pode estar em sleep - primeira requisição pode demorar)*
