@echo off
echo ================================================
echo HASBAHCE AKADEMI - ILK KURULUM SIHIRBAZI
echo ================================================
echo.

echo [1/4] Python Sanal Ortam (venv) Olusturuluyor...
python -m venv venv
if %errorlevel% neq 0 (
    echo HATA: Python bulunamadi veya venv olusturulamadi.
    echo Lutfen Python'un yuklu oldugundan emin olun.
    pause
    exit /b
)

echo.
echo [2/4] Python Kutuphaneleri Yukleniyor...
call venv\Scripts\activate
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo HATA: Kutuphaneler yuklenirken hata olustu.
    pause
    exit /b
)

echo.
echo [3/4] Veritabani Hazirlaniyor...
python manage.py migrate
if %errorlevel% neq 0 (
    echo HATA: Veritabani guncellenirken hata olustu.
    pause
    exit /b
)

echo.
echo [4/4] Frontend Paketleri Yukleniyor...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo HATA: Node.js paketleri yuklenirken hata olustu.
    echo Lutfen Node.js'in yuklu oldugundan emin olun.
    cd ..
    pause
    exit /b
)
cd ..

echo.
echo ================================================
echo KURULUM TAMAMLANDI!
echo ================================================
echo.
echo Artık "start_app.bat" dosyasini calistirarak projeyi baslatabilirsiniz.
echo.
pause
