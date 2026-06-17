from django.contrib import admin
from django.urls import path
from students.api import api
from students.auth_api import auth_api
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
    path('api/auth/', auth_api.urls),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
