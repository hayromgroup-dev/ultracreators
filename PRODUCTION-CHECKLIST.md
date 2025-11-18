# 📋 Checklist de Deploy - Ultra Creators

Use este checklist para garantir que todos os passos foram executados corretamente.

---

## ✅ Pré-Deploy (No seu computador)

- [ ] Teste local completo realizado
- [ ] Todos os recursos funcionando corretamente
- [ ] Código commitado no Git (se usar)
- [ ] Documentação atualizada
- [ ] Credenciais de produção preparadas

---

## 🖥️ Preparação do Servidor

- [ ] VPS contratado (mínimo 2GB RAM)
- [ ] Domínio registrado e DNS configurado
- [ ] Acesso SSH funcionando
- [ ] Sistema operacional atualizado (`sudo apt update && upgrade`)
- [ ] Node.js 18.x instalado
- [ ] PM2 instalado globalmente
- [ ] Nginx instalado
- [ ] Certbot instalado
- [ ] Firewall (UFW) configurado

---

## 💾 Banco de Dados

**Escolha uma opção:**

### Opção A: MongoDB Atlas (Recomendado)
- [ ] Conta criada no MongoDB Atlas
- [ ] Cluster criado
- [ ] Network Access configurado
- [ ] Database User criado
- [ ] Connection String copiada

### Opção B: MongoDB Local
- [ ] MongoDB instalado no servidor
- [ ] MongoDB iniciado e habilitado no boot
- [ ] Testado conexão local

---

## 📦 Deploy da Aplicação

- [ ] Código enviado para `/var/www/ultracreators`
- [ ] Dependências instaladas (`npm install --production`)
- [ ] Arquivo `.env` criado no backend
- [ ] Variáveis de ambiente configuradas:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`
  - [ ] `MONGODB_URI` (correta)
  - [ ] `JWT_SECRET` (forte, 32+ caracteres)
  - [ ] `CORS_ORIGIN` (seu domínio com https)
  - [ ] `MASTER_ADMIN_EMAIL`
  - [ ] `MASTER_ADMIN_PASSWORD`
- [ ] Master admin criado (`node createAdmin.js`)
- [ ] API_URL atualizado em todos os arquivos HTML
- [ ] Backend iniciado com PM2
- [ ] PM2 configurado para auto-start no boot
- [ ] Backend respondendo na porta 5000

---

## 🌐 Nginx & SSL

- [ ] Arquivo de configuração criado (`/etc/nginx/sites-available/ultracreators`)
- [ ] Domínio correto no arquivo de configuração
- [ ] Link simbólico criado em sites-enabled
- [ ] Configuração testada (`sudo nginx -t`)
- [ ] Nginx recarregado
- [ ] Site acessível via HTTP
- [ ] Certificado SSL obtido via Certbot
- [ ] Redirecionamento HTTP → HTTPS configurado
- [ ] Site acessível via HTTPS
- [ ] Renovação automática do SSL testada

---

## 🔐 Segurança

- [ ] Firewall UFW ativo
- [ ] Portas corretas abertas (SSH, HTTP, HTTPS)
- [ ] SSH protegido (root login desabilitado)
- [ ] Fail2Ban instalado e ativo
- [ ] Senhas fortes configuradas
- [ ] JWT_SECRET único e forte
- [ ] Backup automático configurado

---

## ✅ Testes de Produção

- [ ] **Página principal:** `https://seudominio.com` carrega
- [ ] **Redirecionamento:** HTTP → HTTPS funciona
- [ ] **SSL:** Cadeado verde no navegador
- [ ] **Login:** `/login.html` funciona
  - [ ] Login com master admin bem-sucedido
- [ ] **Painel Admin:** `/admin.html` acessível
  - [ ] Tab Cursos funciona
  - [ ] Tab Anúncios funciona
  - [ ] Tab Usuários funciona
- [ ] **Criação de Curso:**
  - [ ] Criar curso inativo
  - [ ] Criar curso ativo
  - [ ] Adicionar aulas
  - [ ] Reordenar aulas com setas
  - [ ] Visualizar preview do curso
  - [ ] Editar curso
  - [ ] Ativar/Desativar curso
- [ ] **Criação de Anúncio:**
  - [ ] Criar anúncio inativo
  - [ ] Criar anúncio ativo
  - [ ] Selecionar posição visual
  - [ ] Visualizar preview do anúncio
  - [ ] Preview mostra posição correta
  - [ ] Editar anúncio
  - [ ] Ativar/Desativar anúncio
- [ ] **Registro de Usuário:** `/register.html`
  - [ ] Novo usuário pode se registrar
- [ ] **Página de Usuários:** `/users.html`
  - [ ] Cursos aparecem
  - [ ] Anúncios aparecem na sidebar correta
- [ ] **Página de Treinamentos:** `/treinamento.html`
  - [ ] Cursos carregam
  - [ ] Progresso é salvo
  - [ ] Estatísticas corretas
  - [ ] Anúncios aparecem
- [ ] **Página de Curso:** `/curso.html`
  - [ ] Vídeo carrega
  - [ ] Aulas listadas
  - [ ] Botão "Próxima Aula" funciona
  - [ ] Progresso é salvo
  - [ ] Navegação entre aulas funciona

---

## 🔄 Funcionalidades Críticas

- [ ] **Autenticação:**
  - [ ] Login funciona
  - [ ] Logout funciona
  - [ ] Token JWT válido
  - [ ] Sessão persiste após reload
- [ ] **Progresso de Cursos:**
  - [ ] Aulas marcadas como completas
  - [ ] Progresso salvo no banco
  - [ ] Progresso aparece em treinamentos
  - [ ] Cursos completados ficam cinza
- [ ] **Reordenação:**
  - [ ] Setas up/down funcionam para aulas
  - [ ] Setas up/down funcionam para cursos
  - [ ] Ordem salva corretamente
- [ ] **Status Ativo/Inativo:**
  - [ ] Cursos inativos não aparecem para usuários
  - [ ] Anúncios inativos não aparecem para usuários
  - [ ] Toggle de status funciona

---

## 📊 Monitoramento & Manutenção

- [ ] PM2 status verificado
- [ ] Logs do PM2 verificados (sem erros)
- [ ] Logs do Nginx verificados (sem erros)
- [ ] Uso de CPU/RAM aceitável
- [ ] Backup automático testado
- [ ] Cron job de backup configurado
- [ ] Monitoramento de uptime configurado (opcional)

---

## 📱 Recursos Opcionais

- [ ] Google Analytics adicionado
- [ ] CDN configurado (Cloudflare, etc.)
- [ ] Email SMTP configurado
- [ ] Rate limiting implementado
- [ ] Google Search Console configurado
- [ ] Sitemap.xml criado

---

## 🆘 Informações de Emergência

### Comandos Úteis

```bash
# Ver logs do backend
pm2 logs ultracreators-api

# Reiniciar backend
pm2 restart ultracreators-api

# Ver logs do Nginx
sudo tail -f /var/log/nginx/ultracreators-error.log

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar status do MongoDB (se local)
sudo systemctl status mongod

# Ver uso de recursos
htop
pm2 monit
```

### Arquivos Importantes

- Backend: `/var/www/ultracreators/backend/`
- Logs Nginx: `/var/log/nginx/`
- Configuração Nginx: `/etc/nginx/sites-available/ultracreators`
- Env file: `/var/www/ultracreators/backend/.env`

### Credenciais Salvas

- [ ] Master admin email e senha salvos em local seguro
- [ ] MongoDB URI salva
- [ ] JWT_SECRET salvo
- [ ] Credenciais SSH salvas
- [ ] Credenciais do domínio salvas

---

## 🎯 Pós-Deploy

- [ ] Backup manual realizado
- [ ] Monitoramento configurado
- [ ] Equipe notificada sobre go-live
- [ ] Documentação atualizada
- [ ] Próximas melhorias planejadas

---

## ✅ Status Final

Data do deploy: ___/___/______
Horário: ___:___
Deploy realizado por: _________________
Status: [ ] Sucesso  [ ] Parcial  [ ] Falha

Observações:
_________________________________________________
_________________________________________________
_________________________________________________

---

**Tudo funcionando? Parabéns! 🎉🚀**

Sua plataforma Ultra Creators está em produção!
