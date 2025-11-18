#!/bin/bash

#############################################
# Ultra Creators - Production Setup Script
# Este script automatiza a configuração inicial do servidor
#############################################

echo "=========================================="
echo "  Ultra Creators - Production Setup"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Verificar se está rodando como root
if [ "$EUID" -eq 0 ]; then
    print_error "Não execute este script como root. Use seu usuário normal."
    exit 1
fi

echo "Este script irá:"
echo "  1. Atualizar o sistema"
echo "  2. Instalar Node.js 18.x"
echo "  3. Instalar PM2"
echo "  4. Instalar Nginx"
echo "  5. Instalar Certbot"
echo "  6. Instalar MongoDB (opcional)"
echo ""
read -p "Deseja continuar? (s/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    print_info "Instalação cancelada."
    exit 0
fi

# 1. Atualizar sistema
print_info "Atualizando sistema..."
sudo apt update
sudo apt upgrade -y
print_success "Sistema atualizado"

# 2. Instalar Node.js 18.x
print_info "Instalando Node.js 18.x..."
if command -v node &> /dev/null; then
    print_info "Node.js já está instalado ($(node -v))"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js instalado ($(node -v))"
fi

# 3. Instalar PM2
print_info "Instalando PM2..."
if command -v pm2 &> /dev/null; then
    print_info "PM2 já está instalado"
else
    sudo npm install -g pm2
    print_success "PM2 instalado"
fi

# 4. Instalar Nginx
print_info "Instalando Nginx..."
if command -v nginx &> /dev/null; then
    print_info "Nginx já está instalado"
else
    sudo apt install -y nginx
    print_success "Nginx instalado"
fi

# 5. Instalar Certbot
print_info "Instalando Certbot..."
if command -v certbot &> /dev/null; then
    print_info "Certbot já está instalado"
else
    sudo apt install -y certbot python3-certbot-nginx
    print_success "Certbot instalado"
fi

# 6. MongoDB (opcional)
echo ""
read -p "Deseja instalar MongoDB localmente? (s/n - escolha 'n' se usar MongoDB Atlas) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_info "Instalando MongoDB..."

    # Importar chave pública
    wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

    # Adicionar repositório
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

    # Instalar
    sudo apt update
    sudo apt install -y mongodb-org

    # Iniciar e habilitar
    sudo systemctl start mongod
    sudo systemctl enable mongod

    print_success "MongoDB instalado e iniciado"
else
    print_info "MongoDB não instalado (certifique-se de configurar MongoDB Atlas)"
fi

# 7. Configurar UFW Firewall
print_info "Configurando firewall (UFW)..."
sudo ufw --force enable
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
print_success "Firewall configurado"

# 8. Instalar Fail2Ban
print_info "Instalando Fail2Ban..."
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
print_success "Fail2Ban instalado"

# 9. Criar diretório do projeto
print_info "Criando diretório do projeto..."
sudo mkdir -p /var/www/ultracreators
sudo chown -R $USER:$USER /var/www/ultracreators
print_success "Diretório criado em /var/www/ultracreators"

# 10. Instalar utilitários
print_info "Instalando utilitários..."
sudo apt install -y htop git curl wget unzip
print_success "Utilitários instalados"

echo ""
echo "=========================================="
print_success "Configuração inicial completa!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo ""
echo "1. Fazer upload dos arquivos do projeto para /var/www/ultracreators"
echo "   Exemplo: scp -r ./ultracreators usuario@servidor:/var/www/"
echo ""
echo "2. Criar arquivo .env no backend:"
echo "   cd /var/www/ultracreators/backend"
echo "   nano .env"
echo ""
echo "3. Instalar dependências:"
echo "   cd /var/www/ultracreators/backend"
echo "   npm install --production"
echo ""
echo "4. Criar master admin:"
echo "   node createAdmin.js"
echo ""
echo "5. Iniciar com PM2:"
echo "   pm2 start server.js --name ultracreators-api"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "6. Configurar Nginx (veja DEPLOY-PRODUCTION.md)"
echo ""
echo "7. Configurar SSL:"
echo "   sudo certbot --nginx -d seudominio.com -d www.seudominio.com"
echo ""
echo "=========================================="
echo ""
print_info "Consulte DEPLOY-PRODUCTION.md para instruções detalhadas!"
echo ""
