# 🎯 GUIA RÁPIDO - PUBLICAR FAZENDACONTROL

## PASSO 1: Criar Contas Gratuitas

1. **Render.com** (para Backend + Banco de Dados)
   - Acesse: https://render.com
   - Cadastre com GitHub ou Email

2. **Vercel.com** (para Frontend)
   - Acesse: https://vercel.com
   - Cadastre com GitHub

## PASSO 2: Deploy do Backend

### 2.1 Criar Banco de Dados PostgreSQL

1. No Render, clique **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `fazendacontrol-db`
   - **Database:** `fazendacontrol`
   - **User:** `fazendacontrol`
3. Clique **"Create Database"**
4. **AGUARDE** criar (2-3 minutos)
5. Na página do banco, copie a **"Internal Database URL"**
   - Formato: `postgres://...`

### 2.2 Criar Web Service

1. Clique **"New +"** → **"Web Service"**
2. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
3. Na seção **"Environment Variables"**, adicione:
   - **Key:** `DATABASE_URL`
   - **Value:** (cole a URL do PostgreSQL acima)
4. Clique **"Create Web Service"**
5. **AGUARDE** o deploy (5-10 minutos)
6. Quando pronto, copie a URL do seu backend
   - Exemplo: `https://fazendacontrol-api.onrender.com`

## PASSO 3: Deploy do Frontend

### 3.1 Preparar o Frontend

Edite o arquivo `client/src/utils/api.js` e altere a linha do API_BASE:

```javascript
const API_BASE = 'https://SEU-BACKEND-URL.onrender.com/api';
```

### 3.2 Deploy no Vercel

1. No Vercel, clique **"Add New..."** → **"Project"**
2. Importe o projeto do GitHub ou arraste a pasta
3. Na configuração:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` ou `client`
4. Clique **"Deploy"**
5. **AGUARDE** (2-3 minutos)
6. Pronto! Você terá uma URL como:
   - `https://fazendacontrol.vercel.app`

## PASSO 4: Testar

1. Acesse a URL do Vercel
2. Teste todas as funcionalidades
3. Compartilhe com quem quiser!

---

## 📝 NOTAS IMPORTANTES

### Plano Gratuito - Limitações

| Serviço | Limitação |
|---------|-----------|
| Render | Banco "dorme" após 90 dias |
| Vercel | 100GB banda/mês |
| Ambos | Primeiro acesso pode demorar (cold start) |

### Manter o Banco Ativo

Para evitar que o banco de dados "durma", você pode:
- Fazer uma requisição automática ao backend (use um cron job gratuito)
- Ou aceitar que na primeira vez demora ~30 segundos

### Erros Comuns

**CORS Error:**
- Verifique se o backend permite conexões do frontend
- Ajuste a variável `origin` no `cors()` do backend

**Database Error:**
- Verifique se a `DATABASE_URL` está correta
- Verifique se o banco foi criado corretamente

---

## 🎉 PRONTO!

Agora você tem o sistema publicado e pode compartilhar a URL do Vercel com qualquer pessoa!
