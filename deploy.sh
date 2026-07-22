#!/bin/bash
# ============================================================================
# BuildScience — production deploy skripti
# Ishlatish (Mac Terminal'da):  cd ~/Desktop/Qurilish && bash deploy.sh
#
# Nima qiladi:
#   1. Serverga ulanadi va holatini ko'rsatadi (disk, xotira, docker, nginx)
#   2. Eski frontend loyihalarni topib, HAR BIRINI SIZDAN SO'RAB o'chiradi
#   3. Kerakli dasturlarni o'rnatadi (docker, nginx, certbot)
#   4. Loyihani rsync qiladi va docker orqali ishga tushiradi (port 127.0.0.1:4001)
#   5. qurilishapi.webportfolio.uz uchun nginx + SSL (DNS tayyor bo'lsa) sozlaydi
#   6. Healthcheck bilan tekshiradi
#
# Boshqa loyihalarga tegmaydi: alohida compose project (buildscience),
# port faqat localhost:4001, alohida nginx site-fayl.
# ============================================================================
set -euo pipefail

SERVER_IP="13.60.104.64"
DOMAIN="qurilishapi.webportfolio.uz"
SSH_KEY="$HOME/Downloads/newserver.pem"
REMOTE_DIR="/var/www/buildscience"

if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH kalit topilmadi: $SSH_KEY"; exit 1
fi
chmod 400 "$SSH_KEY"

SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)

# --- SSH foydalanuvchini aniqlash -------------------------------------------
REMOTE_USER=""
for u in ubuntu ec2-user admin root debian; do
  if ssh "${SSH_OPTS[@]}" -o BatchMode=yes "$u@$SERVER_IP" "true" 2>/dev/null; then
    REMOTE_USER="$u"; break
  fi
done
[ -z "$REMOTE_USER" ] && { echo "❌ SSH orqali kirib bo'lmadi (ubuntu/ec2-user/root sinab ko'rildi)."; exit 1; }
echo "✅ Serverga ulanish OK: $REMOTE_USER@$SERVER_IP"

rssh() { ssh "${SSH_OPTS[@]}" "$REMOTE_USER@$SERVER_IP" "$@"; }
rsudo() { rssh "sudo bash -c $(printf '%q' "$*")"; }

# --- 1. Server holati ---------------------------------------------------------
echo ""
echo "════════════ 1/6: SERVER HOLATI ════════════"
rssh 'echo "OS:    $(. /etc/os-release && echo $PRETTY_NAME)";
      echo "Disk:  $(df -h / | awk "NR==2{print \$3\" band / \"\$2\" (\"\$5\")\"}")";
      echo "RAM:   $(free -h | awk "NR==2{print \$3\" band / \"\$2}")";
      echo "CPU:   $(nproc) yadro";
      echo "";
      echo "--- Docker konteynerlar ---";
      command -v docker >/dev/null && sudo docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "docker o'\''rnatilmagan";
      echo "";
      echo "--- Nginx saytlar ---";
      ls /etc/nginx/sites-enabled/ 2>/dev/null || echo "nginx o'\''rnatilmagan yoki saytlar yo'\''q";
      echo "";
      echo "--- /var/www tarkibi ---";
      ls -la /var/www/ 2>/dev/null || echo "/var/www mavjud emas";
      echo "";
      echo "--- Band portlar (80,443,4000-4010,5432) ---";
      sudo ss -tlnp 2>/dev/null | grep -E ":(80|443|400[0-9]|4010|5432)\b" || echo "hech narsa topilmadi"'

# --- 2. Eski frontendni interaktiv o'chirish ---------------------------------
echo ""
echo "════════════ 2/6: ESKI LOYIHALARNI TOZALASH ════════════"
echo "Quyida serverda topilgan narsalar. Har biri uchun o'chirishni tasdiqlaysiz."
echo ""

# /var/www ichidagi papkalar (buildscience'dan tashqari)
for dir in $(rssh 'ls /var/www/ 2>/dev/null' | grep -v -e '^buildscience$' -e '^html$' || true); do
  read -r -p "🗂  /var/www/$dir papkasini O'CHIRAYMI? [y/N] " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    rsudo "rm -rf /var/www/$dir"
    echo "   ✅ o'chirildi: /var/www/$dir"
  fi
done

# nginx saytlar (bizniki emas)
for site in $(rssh 'ls /etc/nginx/sites-enabled/ 2>/dev/null' | grep -v -e "^$DOMAIN\$" -e '^default$' || true); do
  read -r -p "🌐 nginx sayti '$site' ni O'CHIRAYMI? [y/N] " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    rsudo "rm -f /etc/nginx/sites-enabled/$site /etc/nginx/sites-available/$site"
    echo "   ✅ o'chirildi: $site"
  fi
done

# docker konteynerlar (buildscience'dan tashqari)
for c in $(rssh 'command -v docker >/dev/null && sudo docker ps -a --format "{{.Names}}" || true' | grep -v '^buildscience' || true); do
  read -r -p "🐳 docker konteyner '$c' ni TO'XTATIB O'CHIRAYMI? [y/N] " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    rsudo "docker rm -f $c"
    echo "   ✅ o'chirildi: $c"
  fi
done

# --- 3. Kerakli dasturlar ------------------------------------------------------
echo ""
echo "════════════ 3/6: DASTURLARNI O'RNATISH ════════════"
rsudo 'export DEBIAN_FRONTEND=noninteractive
  command -v docker >/dev/null || { curl -fsSL https://get.docker.com | sh; }
  docker compose version >/dev/null 2>&1 || apt-get install -y docker-compose-plugin
  command -v nginx  >/dev/null || apt-get install -y nginx
  command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx
  command -v rsync  >/dev/null || apt-get install -y rsync
  echo "docker, nginx, certbot, rsync tayyor"'

# --- 4. Kodni yuklash va .env.production --------------------------------------
echo ""
echo "════════════ 4/6: KODNI YUKLASH ════════════"
rsudo "mkdir -p $REMOTE_DIR && chown $REMOTE_USER:$REMOTE_USER $REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .git \
  --exclude 'apps/api/uploads' --exclude 'apps/api/uploads-test' \
  --exclude '.env' --exclude 'apps/api/.env' --exclude '.env.production' \
  -e "ssh ${SSH_OPTS[*]}" ./ "$REMOTE_USER@$SERVER_IP:$REMOTE_DIR/"
echo "✅ Kod yuklandi: $REMOTE_DIR"

# .env.production — faqat birinchi marta, kuchli parollar bilan
if ! rssh "test -f $REMOTE_DIR/.env.production" 2>/dev/null; then
  PG_PASS=$(openssl rand -hex 24)
  SESS_SECRET=$(openssl rand -hex 48)
  ADM_PASS="Adm!$(openssl rand -hex 8)"
  rssh "cat > $REMOTE_DIR/.env.production <<EOF
POSTGRES_PASSWORD=$PG_PASS
SESSION_SECRET=$SESS_SECRET
WEB_ORIGIN=*
COOKIE_SAMESITE=none
ADMIN_NAME=BuildScience Administrator
ADMIN_EMAIL=admin@buildscience.uz
ADMIN_PHONE=+998901234567
ADMIN_PASSWORD=$ADM_PASS
EOF
chmod 600 $REMOTE_DIR/.env.production"
  echo ""
  echo "🔑 YANGI ADMIN: admin@buildscience.uz / $ADM_PASS  (SAQLAB QO'YING!)"
  echo "   To'liq maxfiy kalitlar serverda: $REMOTE_DIR/.env.production"
fi

# --- 5. Docker build + ishga tushirish -----------------------------------------
echo ""
echo "════════════ 5/6: DOCKER ISHGA TUSHIRISH ════════════"
rsudo "cd $REMOTE_DIR && docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build postgres api"
echo "⏳ API tayyor bo'lishini kutyapmiz..."
API_OK=0
for i in $(seq 1 30); do
  if rssh "curl -sf http://127.0.0.1:4001/api/health" >/dev/null 2>&1; then API_OK=1; break; fi
  sleep 2
done
if [ "$API_OK" = "1" ]; then
  rssh "curl -s http://127.0.0.1:4001/api/health"; echo ""
  echo "✅ API ishlayapti (127.0.0.1:4001)"
else
  echo "❌ API 60 soniyada javob bermadi. Loglar:"
  rsudo "cd $REMOTE_DIR && docker compose --env-file .env.production -f docker-compose.prod.yml logs --tail=50 api"
  exit 1
fi

# Admin yaratish (prod seed — faqat admin, demo ma'lumotlarsiz)
rsudo "cd $REMOTE_DIR && docker compose --env-file .env.production -f docker-compose.prod.yml exec -T api npm run db:seed" || \
  echo "⚠️  Seed xato berdi (admin allaqachon mavjud bo'lishi mumkin) — davom etamiz."

# --- 6. Nginx + SSL -------------------------------------------------------------
echo ""
echo "════════════ 6/6: NGINX + SSL ($DOMAIN) ════════════"
rsudo "cp $REMOTE_DIR/nginx/$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN
  ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
  nginx -t && systemctl reload nginx"
echo "✅ Nginx sozlandi"

DNS_IP=$(dig +short "$DOMAIN" @8.8.8.8 2>/dev/null | tail -1 || true)
if [ "$DNS_IP" = "$SERVER_IP" ]; then
  echo "✅ DNS to'g'ri ($DOMAIN → $SERVER_IP), SSL o'rnatilmoqda..."
  rsudo "certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m maqsudjonsoliyev72@gmail.com --redirect" \
    && echo "✅ SSL tayyor: https://$DOMAIN" \
    || echo "⚠️  Certbot xato berdi — serverda qo'lda: sudo certbot --nginx -d $DOMAIN"
  echo ""
  curl -sf "https://$DOMAIN/api/health" >/dev/null && echo "🎉 TAYYOR: https://$DOMAIN/api/health"
else
  echo "⚠️  DNS hali ulanmagan: $DOMAIN → ${DNS_IP:-topilmadi} (kerak: $SERVER_IP)"
  echo "   DNS panelda A-yozuv qo'ying: qurilishapi → $SERVER_IP"
  echo "   Keyin shu skriptni QAYTA ishga tushiring — SSL avtomatik o'rnatiladi."
  echo "   Hozircha API HTTP orqali: http://$SERVER_IP/api/health"
fi

echo ""
echo "═══════════════════════════════════════════"
echo "✅ Deploy yakunlandi."
echo "   Health:  https://$DOMAIN/api/health"
echo "   Swagger: https://$DOMAIN/api/docs"
echo "   Loglar:  ssh -i $SSH_KEY $REMOTE_USER@$SERVER_IP"
echo "            cd $REMOTE_DIR && sudo docker compose logs -f api"
echo "═══════════════════════════════════════════"
