# CST Portal Interno — Guia de Implantação (Self-Hosting)

**Casa Santa Teresinha — Portal de Gestão Interna**  
Versão: 2026.06 | Stack: Node.js 24 + PostgreSQL + React 19

---

## Pré-requisitos

| Componente | Versão mínima |
|-----------|--------------|
| Node.js   | 24.x         |
| pnpm      | 9.x          |
| PostgreSQL | 14+         |
| (Opcional) Nginx | qualquer |

---

## 1. Clonar / copiar o projeto

```bash
git clone <URL-do-repositório> cst-portal
cd cst-portal
pnpm install
```

---

## 2. Configurar variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto (ou configure no painel do servidor):

```env
# Banco de dados PostgreSQL
DATABASE_URL=postgresql://USUARIO:SENHA@localhost:5432/cst_portal

# Segredo da sessão (gere com: openssl rand -hex 32)
SESSION_SECRET=seu-segredo-aqui-32-chars-minimo

# Ambiente
NODE_ENV=production
```

> ⚠️ **Nunca commite o arquivo `.env` no repositório.**

---

## 3. Criar o banco de dados

```bash
# Criar o banco
psql -U postgres -c "CREATE DATABASE cst_portal;"

# Aplicar o schema (tabelas)
pnpm --filter @workspace/db run push

# Popular com usuários iniciais
pnpm --filter @workspace/scripts run seed
```

---

## 4. Build de produção

```bash
# Build do servidor API
pnpm --filter @workspace/api-server run build

# Build do frontend React
pnpm --filter @workspace/cst-portal run build
```

Saída:
- API: `artifacts/api-server/dist/index.js`
- Frontend: `artifacts/cst-portal/dist/` (arquivos estáticos)

---

## 5. Iniciar em produção

```bash
# Iniciar o servidor API
node artifacts/api-server/dist/index.js
# Escuta na porta definida por $PORT (padrão: 8080)
```

Para servir o frontend React, use o Nginx (ver seção 6) ou um servidor estático como `serve`:

```bash
npx serve artifacts/cst-portal/dist -s -l 3000
```

---

## 6. Configuração do Nginx (recomendado)

```nginx
server {
    listen 80;
    server_name seu-dominio.org.br;

    # Redirecionar HTTP → HTTPS (em produção com certificado)
    # return 301 https://$host$request_uri;

    # Frontend estático
    root /caminho/para/cst-portal/artifacts/cst-portal/dist;
    index index.html;

    # API — proxy para o servidor Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SPA fallback (React Router / Wouter)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> Se usar HTTPS (recomendado), adicione `proxy_cookie_path / "/; SameSite=None; Secure"` no bloco `location /api/`.

---

## 7. Gerenciamento de processos (PM2)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar o servidor API
pm2 start artifacts/api-server/dist/index.js \
  --name cst-api \
  --env production

# Salvar e configurar para reiniciar no boot
pm2 save
pm2 startup
```

---

## 8. Usuários iniciais

Após rodar o seed, os seguintes usuários estarão disponíveis:

| E-mail | Senha | Papel |
|--------|-------|-------|
| admin@cst.org.br | Admin@2026 | Administrador |
| gestor@cst.org.br | Gestor@2026 | Gestor de Setor |
| colab@cst.org.br | Colab@2026 | Colaborador |

> ⚠️ **Troque as senhas imediatamente após o primeiro login em produção.**  
> Use a funcionalidade de redefinição de senha com token para usuários existentes.

---

## 9. Funcionalidades do sistema

### Segurança
- **Senhas temporárias**: Admin pode criar usuários com senha temporária — o sistema força a troca no primeiro login.
- **Autenticação em dois fatores (2FA/TOTP)**: Cada usuário pode ativar o 2FA no perfil (compatível com Google Authenticator, Authy, etc.).
- **Reset de senha por token**: Admin gera token de 24h na tela de Administração → usuário usa na tela de login.
- **Bloqueio por tentativas**: Conta bloqueada por 15 minutos após 3 tentativas inválidas.

### Gestão
- **Documentos**: Admin/Gestores podem fazer upload e excluir. Colaboradores apenas visualizam e baixam.
- **Avisos & Eventos**: Admin/Gestores criam comunicados. Aparecem como popup no Dashboard para todos.
- **Kanban de Tarefas**: Drag-and-drop com colunas Pendente → Em andamento → Concluído.
- **Chat por departamento**: Mensagens em tempo real por polling.

---

## 10. Atualização do sistema

```bash
# Puxar atualizações
git pull

# Instalar novas dependências
pnpm install

# Aplicar mudanças no banco (se houver)
pnpm --filter @workspace/db run push

# Rebuild
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/cst-portal run build

# Reiniciar
pm2 restart cst-api
```

---

## Suporte

Para dúvidas técnicas sobre o portal, entre em contato com a equipe de TI da Casa Santa Teresinha.

