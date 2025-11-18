# Guia de Deploy - Ultra Creators Platform
## Deploy para VPS em Produção

Este guia fornece instruções passo a passo para fazer o deploy da plataforma Ultra Creators em um VPS de produção.

---

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04 LTS ou superior (mínimo 2GB RAM, 2 CPU cores)
- Domínio apontando para o IP do VPS
- Acesso SSH ao servidor
- MongoDB Atlas account OU MongoDB instalado localmente

---

## 🚀 Passo 1: Preparar o Servidor

### 1.1 Conectar ao VPS via SSH

```bash
ssh root@seu-ip-do-vps
# ou
ssh usuario@seu-ip-do-vps
```

### 1.2 Atualizar o Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Instalar Node.js 18.x

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalação
node -v  # Deve mostrar v18.x.x
npm -v   # Deve mostrar 9.x.x ou superior
```

### 1.4 Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 1.5 Instalar Nginx

```bash
sudo apt install -y nginx
```

### 1.6 Instalar Certbot (para SSL/HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 💾 Passo 2: Configurar MongoDB

**Opção A: Usar MongoDB Atlas (Recomendado para produção)**

1. Acesse [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crie uma conta gratuita
3. Crie um novo cluster (Free Tier é suficiente para começar)
4. Configure Network Access:
   - Add IP Address → Add Current IP Address
   - Ou adicione `0.0.0.0/0` (permite de qualquer IP - menos seguro)
5. Crie um Database User:
   - Username: `ultracreators`
   - Password: Gere uma senha forte e salve
6. Copie a Connection String:
   - Formato: `mongodb+srv://ultracreators:<password>@cluster0.xxxxx.mongodb.net/ultracreators?retryWrites=true&w=majority`

**Opção B: Instalar MongoDB Localmente**

```bash
# Importar chave pública do MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Adicionar repositório
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Instalar MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar status
sudo systemctl status mongod
```

---

## 📦 Passo 3: Fazer Upload do Projeto

### 3.1 Criar Diretório para o Projeto

```bash
sudo mkdir -p /var/www/ultracreators
sudo chown -R $USER:$USER /var/www/ultracreators
cd /var/www/ultracreators
```

### 3.2 Fazer Upload dos Arquivos

**Opção A: Via Git (Recomendado)**

```bash
# No seu computador local, inicialize um repositório Git se ainda não tiver
cd C:\Users\Vinicius\ultracreators
git init
git add .
git commit -m "Initial production setup"

# Crie um repositório no GitHub/GitLab e faça push

# No servidor VPS
git clone https://github.com/seu-usuario/ultracreators.git .
```

**Opção B: Via SCP/SFTP**

```bash
# No seu computador local (Windows PowerShell)
scp -r C:\Users\Vinicius\ultracreators usuario@seu-ip-do-vps:/var/www/ultracreators
```

**Opção C: Via FTP (FileZilla, WinSCP, etc.)**
- Conecte via SFTP ao seu VPS
- Faça upload de todos os arquivos para `/var/www/ultracreators`

### 3.3 Instalar Dependências do Backend

```bash
cd /var/www/ultracreators/backend
npm install --production
```

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

### 4.1 Criar arquivo `.env` no backend

```bash
cd /var/www/ultracreators/backend
nano .env
```

### 4.2 Adicionar as seguintes variáveis:

```env
# Ambiente
NODE_ENV=production

# Servidor
PORT=5000

# MongoDB - ESCOLHA UMA DAS OPÇÕES:
# Opção A: MongoDB Atlas
MONGODB_URI=mongodb+srv://ultracreators:SUA_SENHA_AQUI@cluster0.xxxxx.mongodb.net/ultracreators?retryWrites=true&w=majority

# Opção B: MongoDB Local
# MONGODB_URI=mongodb://localhost:27017/ultracreators

# JWT Secret (GERE UMA SENHA FORTE!)
JWT_SECRET=sua-chave-super-secreta-e-longa-aqui-pelo-menos-32-caracteres

# JWT Expiration
JWT_EXPIRE=30d

# CORS - Seu domínio de produção
CORS_ORIGIN=https://seudominio.com

# Master Admin (credenciais iniciais)
MASTER_ADMIN_EMAIL=admin@ultracreators.com
MASTER_ADMIN_PASSWORD=SenhaSeguraParaProducao123!
```

**💡 Dicas de Segurança:**
- Gere um JWT_SECRET forte usando: `openssl rand -base64 32`
- Use senhas fortes para o master admin
- Substitua `seudominio.com` pelo seu domínio real

### 4.3 Salvar e Fechar
- Pressione `Ctrl+X`
- Pressione `Y` para confirmar
- Pressione `Enter`

---

## 🔧 Passo 5: Atualizar URLs do Frontend

### 5.1 Atualizar API_URL nos arquivos HTML

Você precisa atualizar o `API_URL` em todos os arquivos HTML para apontar para seu domínio de produção:

```bash
cd /var/www/ultracreators

# Substitua 'seudominio.com' pelo seu domínio real
sed -i 's|http://localhost:5000/api|https://seudominio.com/api|g' admin.html
sed -i 's|http://localhost:5000/api|https://seudominio.com/api|g' users.html
sed -i 's|http://localhost:5000/api|https://seudominio.com/api|g' treinamento.html
sed -i 's|http://localhost:5000/api|https://seudominio.com/api|g' curso.html
sed -i 's|http://localhost:5000/api|https://seudominio.com/api|g' login.html
sed -i 's|http://localhost:5000/api|https://seudominio.com/api|g' register.html
```

**OU manualmente:**

```bash
nano admin.html
# Encontre: const API_URL = 'http://localhost:5000/api';
# Substitua por: const API_URL = 'https://seudominio.com/api';
# Repita para todos os arquivos HTML
```

---

## 🚦 Passo 6: Iniciar o Backend com PM2

### 6.1 Criar o Master Admin

```bash
cd /var/www/ultracreators/backend
node createAdmin.js
```

Você deverá ver: `✅ Master admin criado com sucesso!`

### 6.2 Iniciar a aplicação com PM2

```bash
cd /var/www/ultracreators/backend
pm2 start server.js --name "ultracreators-api"
```

### 6.3 Configurar PM2 para iniciar no boot

```bash
pm2 startup
# Execute o comando que o PM2 sugerir (começa com sudo env PATH=...)

pm2 save
```

### 6.4 Verificar status

```bash
pm2 status
pm2 logs ultracreators-api
```

---

## 🌐 Passo 7: Configurar Nginx

### 7.1 Criar arquivo de configuração do Nginx

```bash
sudo nano /etc/nginx/sites-available/ultracreators
```

### 7.2 Adicionar a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Logs
    access_log /var/log/nginx/ultracreators-access.log;
    error_log /var/log/nginx/ultracreators-error.log;

    # Servir arquivos estáticos (HTML, CSS, JS, imagens)
    root /var/www/ultracreators;
    index indexoficial.html index.html;

    # Aumentar tamanho máximo de upload (para imagens de anúncios)
    client_max_body_size 10M;

    # Servir arquivos estáticos
    location / {
        try_files $uri $uri/ =404;
    }

    # Proxy para a API Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache para arquivos estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**📝 IMPORTANTE:** Substitua `seudominio.com` pelo seu domínio real!

### 7.3 Ativar o site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/ultracreators /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 🔒 Passo 8: Configurar SSL/HTTPS com Let's Encrypt

### 8.1 Obter Certificado SSL

```bash
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

### 8.2 Seguir as instruções:
- Digite seu email
- Aceite os termos
- Escolha redirecionar HTTP para HTTPS (opção 2)

### 8.3 Testar renovação automática

```bash
sudo certbot renew --dry-run
```

O Certbot configurará automaticamente a renovação via cron.

---

## 🔐 Passo 9: Segurança Adicional

### 9.1 Configurar Firewall (UFW)

```bash
# Ativar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow OpenSSH

# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'

# Verificar status
sudo ufw status
```

### 9.2 Proteger SSH

```bash
sudo nano /etc/ssh/sshd_config
```

Altere/adicione:
```
PermitRootLogin no
PasswordAuthentication no  # Se usar chaves SSH
```

Reinicie SSH:
```bash
sudo systemctl restart sshd
```

### 9.3 Instalar Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 💾 Passo 10: Backup do Banco de Dados

### 10.1 Criar script de backup

```bash
sudo nano /usr/local/bin/backup-mongodb.sh
```

### 10.2 Adicionar conteúdo:

**Para MongoDB Local:**
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR

mongodump --db ultracreators --out $BACKUP_DIR/backup_$TIMESTAMP

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -type d -name "backup_*" -mtime +7 -exec rm -rf {} \;
```

**Para MongoDB Atlas:**
- O Atlas já faz backups automáticos
- Configure através do painel do Atlas

### 10.3 Tornar executável e agendar

```bash
sudo chmod +x /usr/local/bin/backup-mongodb.sh

# Adicionar ao crontab (backup diário às 2h da manhã)
sudo crontab -e
```

Adicione:
```
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

---

## 📊 Passo 11: Monitoramento

### 11.1 Ver logs do PM2

```bash
pm2 logs ultracreators-api
pm2 logs ultracreators-api --lines 100
```

### 11.2 Ver logs do Nginx

```bash
sudo tail -f /var/log/nginx/ultracreators-access.log
sudo tail -f /var/log/nginx/ultracreators-error.log
```

### 11.3 Monitorar status do sistema

```bash
pm2 monit
htop  # Instale com: sudo apt install htop
```

---

## 🔄 Passo 12: Atualizar a Aplicação

Quando precisar fazer updates:

```bash
cd /var/www/ultracreators

# Opção A: Via Git
git pull origin main

# Opção B: Upload manual via SCP/FTP

# Atualizar dependências do backend (se necessário)
cd backend
npm install --production

# Reiniciar aplicação
pm2 restart ultracreators-api

# Ver logs
pm2 logs ultracreators-api --lines 50
```

---

## ✅ Passo 13: Verificar Deployment

### 13.1 Testar a aplicação

1. **Acesse seu domínio:** `https://seudominio.com`
2. **Teste o login:** `https://seudominio.com/login.html`
   - Email: `admin@ultracreators.com`
   - Senha: (a que você configurou no .env)
3. **Acesse o painel admin:** `https://seudominio.com/admin.html`
4. **Teste criar um curso**
5. **Teste criar um anúncio**

### 13.2 Verificar API

```bash
# Teste a API diretamente
curl https://seudominio.com/api/public/courses

# Deve retornar JSON com os cursos
```

### 13.3 Checklist Final

- [ ] Site acessível via HTTPS
- [ ] Redirecionamento HTTP → HTTPS funcionando
- [ ] Login funcionando
- [ ] Painel admin funcionando
- [ ] Criação de cursos funcionando
- [ ] Criação de anúncios funcionando
- [ ] Visualização de cursos para usuários funcionando
- [ ] Progresso de cursos sendo salvo
- [ ] Backup configurado
- [ ] PM2 configurado para reiniciar no boot
- [ ] Firewall configurado
- [ ] SSL válido e renovação automática configurada

---

## 🆘 Troubleshooting

### Problema: API não responde

```bash
# Verificar se o backend está rodando
pm2 status

# Ver logs de erro
pm2 logs ultracreators-api --err

# Reiniciar backend
pm2 restart ultracreators-api
```

### Problema: Erro 502 Bad Gateway

```bash
# Verificar se o backend está rodando na porta correta
netstat -tlnp | grep 5000

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/ultracreators-error.log

# Verificar configuração do Nginx
sudo nginx -t
```

### Problema: Erro de conexão com MongoDB

```bash
# Verificar se MongoDB está rodando (se local)
sudo systemctl status mongod

# Ver logs do backend
pm2 logs ultracreators-api

# Verificar .env
cat /var/www/ultracreators/backend/.env
```

### Problema: CORS errors

- Verifique o `CORS_ORIGIN` no arquivo `.env`
- Deve ser `https://seudominio.com` (sem barra no final)
- Reinicie o backend após alterar: `pm2 restart ultracreators-api`

### Problema: SSL não renovando

```bash
# Testar renovação manual
sudo certbot renew --dry-run

# Forçar renovação
sudo certbot renew --force-renewal
```

---

## 📱 Recursos Adicionais

### Configurar Email (Opcional)

Para enviar emails de recuperação de senha, etc:

1. Configure um serviço SMTP (Gmail, SendGrid, etc.)
2. Adicione ao `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app
```

### CDN para Assets (Opcional)

Para melhor performance, use um CDN:
- Cloudflare (gratuito)
- AWS CloudFront
- Google Cloud CDN

### Analytics (Opcional)

Adicione Google Analytics ou similar aos arquivos HTML.

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `pm2 logs ultracreators-api`
2. Verifique os logs do Nginx: `sudo tail -f /var/log/nginx/ultracreators-error.log`
3. Verifique se todas as variáveis de ambiente estão corretas
4. Reinicie os serviços: `pm2 restart all && sudo systemctl restart nginx`

---

## 🎉 Parabéns!

Sua plataforma Ultra Creators está agora em produção! 🚀

**Próximos passos recomendados:**
- Configure backups regulares
- Configure monitoramento (UptimeRobot, StatusCake)
- Configure alertas por email para downtime
- Monitore uso de recursos do servidor
- Considere implementar rate limiting na API
- Configure Google Search Console
- Adicione sitemap.xml para SEO

---

**Última atualização:** Novembro 2025
**Versão da plataforma:** 2.1.5
