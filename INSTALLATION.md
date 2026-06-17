# Hasbahçe Akademi Takip Sistemi - Kurulum Rehberi

Bu projeyi yeni bir bilgisayara kurmak için aşağıdaki adımları sırasıyla uygulayın.

## 1. Ön Gereksinimler (Mecburi)

Öncelikle bilgisayarınızda şu iki programın kurulu olması gerekir. Eğer kurulu değilse linklerden indirip kurun ("Next" diyerek kurulum yapabilirsiniz).

*   **Python:** [İndir (Windows Installer)](https://www.python.org/downloads/)
    *   *ÖNEMLİ:* Kurarken en alttaki **"Add Python to PATH"** kutucuğunu mutlaka işaretleyin.
*   **Node.js:** [İndir (LTS Version)](https://nodejs.org/en)

## 2. Proje Kurulumu (Tek Seferlik)

Dosyaları yeni bilgisayara kopyaladıktan sonra:

1.  `setup_project.bat` dosyasına **çift tıklayın**.
2.  Siyah bir pencere açılacak ve gerekli yüklemeleri yapacaktır.
3.  İşlem bittiğinde "KURULUM TAMAMLANDI" yazısını göreceksiniz.
    *   *Bu işlem internet hızınıza göre 2-5 dakika sürebilir.*

## 3. Uygulamayı Başlatma (Her Zaman)

Kurulum bir kez yapıldıktan sonra, projeyi açmak için her zaman:

1.  `start_app.bat` dosyasına **çift tıklayın**.
2.  İki ayrı pencere açılacak (Biri Backend, Biri Frontend). Bu pencereleri **kapatmayın**.
3.  Tarayıcınız otomatik açılmazsa, kendiniz şu adrese gidin: `http://localhost:5173`

## Sorun Giderme

*   **Python bulunamadı hatası:** Python'u kurarken "Add to Path" seçeneğini unuttunuz. Python'u silip tekrar kurun ve o kutuyu işaretleyin.
*   **npm bulunamadı hatası:** Node.js düzgün kurulmamış.
*   **Sayfa açılmıyor:** Siyah pencerelerde kırmızı hata yazıları var mı kontrol edin. Pencereleri kapatıp `start_app.bat`'a tekrar tıklayın.
