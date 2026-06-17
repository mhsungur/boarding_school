@echo off
@echo off
echo Boarding School Tracker Baslatiliyor...

echo Frontend baslatiliyor (Port 5173)...
start "Frontend - React" cmd /k "cd frontend & npm run dev"

echo Backend baslatiliyor (Port 8000)...
start "Backend - Django" cmd /k "call venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

echo.
echo Baslatma komutlari gonderildi.
echo Lutfen acilan pencereleri kontrol edin.
echo Tarayicinizda http://localhost:5173 adresine gidebilirsiniz.
pause
