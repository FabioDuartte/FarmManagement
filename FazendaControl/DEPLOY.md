# Deploy do FazendaControl

## Opção 1: Deploy Rápido (Gratuito)

### Backend - Render.com

1. **Criar conta** em https://render.com
2. **Criar PostgreSQL** (Free Tier):
   - Dashboard → New → PostgreSQL
   - Anote a "Internal Database URL"

3. **Criar Web Service**:
   - Dashboard → New → Web Service
   - Conecte seu GitHub ou faça upload do código
   - Configure:
     - **Root Directory:** `server`
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
   - **Environment Variables:**
     - `DATABASE_URL` = (a URL do PostgreSQL criado acima)
     - `NODE_ENV` = `production`

4. **Deploy!** 
   - Após deploy, anote a URL do seu serviço (ex: `https://fazendacontrol-api.onrender.com`)

### Frontend - Vercel

1. **Criar conta** em https://vercel.com
2. **Importar projeto** do GitHub ou upload direto
3. **Configurar variáveis de ambiente:**
   - `VITE_API_URL` = URL do seu backend (ex: `https://fazendacontrol-api.onrender.com`)
4. **Deploy!**

---

## Opção 2: Deploy Completo (Tudo junto)

### 1. Fork/Copie o projeto para GitHub

```bash
git init
git add .
git commit -m "FazendaControl v1.0"
git remote add origin https://github.com/SEU_USUARIO/fazendacontrol.git
git push -u origin main
```

### 2. Render - PostgreSQL

1. Acesse https://render.com
2. New → PostgreSQL
3. Aguarde criar e copie a "Connection Details" → "Internal Database URL"

### 3. Render - Backend

1. New → Web Service
2. Conecte ao GitHub (repo do FazendaControl)
3. Configure:
   ```
   Root Directory: server
   Build Command: npm install
   Start Command: npm start
   Environment: Node
   ```
4. Add Environment Variable:
   - Key: `DATABASE_URL`
   - Value: (cole a URL do PostgreSQL)

### 4. Vercel - Frontend

1. Acesse https://vercel.com
2. New Project → Import from GitHub
3. Adicione Variable:
   - `VITE_API_URL` = URL do seu backend no Render (sem barra no final)
4. Deploy!

---

## URLs de Exemplo

Após deploy, você terá:
- **Frontend:** `https://fazendacontrol.vercel.app`
- **Backend:** `https://fazendacontrol-api.onrender.com`

---

## Problemas Comuns

### CORS Error
Se receber erro de CORS, verifique:
- Backend tem `origin` configurado para URL do frontend
- Variável `DATABASE_URL` está setada

### Banco de Dados
- Render Free tier: banco "dorme" após 90 dias sem uso
- Para manter ativo: faça uma requisição ao banco periodicamente

### Timeout
- Render Free: 30 segundos de timeout
- Para operações longas, considere otimizar queries

---

## Alternativa: Supabase (Mais fácil)

Se quiser algo ainda mais simples, use Supabase:

1. Crie projeto em https://supabase.com
2. Use o SQL Editor para criar as tabelas
3. Pegue a "Connection string" (URI)
4. Substitua no Render como `DATABASE_URL`

---

## Suporte

Precisa de ajuda? Entre em contato!
