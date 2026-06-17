@echo off
echo ================================================
echo HASBAHCE AKADEMI - TAM ONARIM ARACI
echo ================================================
echo.

echo [1/4] Eski Sanal Ortam (venv) Siliniyor...
if exist venv (
    rmdir /s /q venv
    echo Eski venv basariyla silindi.
) else (
    echo venv klasoru zaten yok.
)

echo.
echo [2/4] Python Kontrol Ediliyor...
python --version
echo.
echo ONEMLI: Eger yukarida "32 bit" goruyorsaniz veya surum 3.12 degilse,
echo lutfen Python'u silip "Python 3.12 (64-bit)" yukleyin.
echo Yoksa yine hata alirsiniz.
pause

echo.
echo [3/4] Yeni Sanal Ortam Kuruluyor...
python -m venv venv
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo [4/4] Veritabani Guncelleniyor...
python manage.py migrate

echo.
echo ================================================
echo ISLEM TAMAMLANDI!
echo ================================================
echo Simdi "start_app.bat" calistirabilirsiniz.
echo.
pause
