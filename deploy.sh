#!/bin/bash

# Qurilish loyihasini (Backend) serverga yuklash uchun avtomatlashtirilgan skript
SERVER_IP="13.60.104.64"
SSH_KEY="~/Downloads/newserver.pem"
REMOTE_USER="root" # yoki ubuntu, ec2-user, va hokazo
REMOTE_DIR="/var/www/buildscience"

echo "🚀 BuildScience: Serverga yuklash boshlanmoqda ($SERVER_IP)..."

# Serverda loyiha jildini yaratish
ssh -i $SSH_KEY $REMOTE_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"

# Fayllarni nusxalash (rsync - node_modules, dist va h.k ni o'tkazib yuboramiz)
echo "📦 Fayllar nusxalanmoqda..."
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' --exclude 'apps/web/dist' --exclude 'apps/api/dist' -e "ssh -i $SSH_KEY" ./ $REMOTE_USER@$SERVER_IP:$REMOTE_DIR/

# Docker orqali serverda ishga tushirish (Faqatgina api va postgres)
echo "🐳 Docker konteynerlar yig'ilmoqda va ishga tushmoqda..."
ssh -i $SSH_KEY $REMOTE_USER@$SERVER_IP "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml up -d --build postgres api"

echo "✅ Barcha ishlar muvaffaqiyatli yakunlandi!"
echo "📄 Swagger hujjatlarini ko'rish uchun: http://$SERVER_IP:4000/api/docs"
