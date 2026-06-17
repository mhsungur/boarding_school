#!/bin/bash

echo "========================================="
echo "  Hasbahçe Talebe Takip Başlatıcı (Mac)  "
echo "========================================="

# Betiğin çalıştığı klasöre (ana dizine) git
cd "$(dirname "$0")"

echo "[1/2] Arka yüz (Backend) başlatılıyor..."
# Sanal ortamı aktif et ve Django'yu arka planda çalıştır
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

echo "[2/2] Ön yüz (Frontend) başlatılıyor..."
# Frontend klasörüne git ve Vite'i çalıştır
cd frontend
npm run dev

# Kullanıcı ön yüzü (Ctrl+C ile) kapattığında, arka plandaki Django'yu da otomatik kapat
trap "echo 'Sistem Kapatılıyor...'; kill $BACKEND_PID" EXIT
