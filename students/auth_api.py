from ninja import NinjaAPI, Schema
from django.contrib.auth import authenticate
from .models import AuthToken
from ninja.security import HttpBearer

class TokenAuth(HttpBearer):
    def authenticate(self, request, token):
        try:
            auth_token = AuthToken.objects.get(token=token)
            return auth_token.user
        except AuthToken.DoesNotExist:
            return None

auth_api = NinjaAPI(urls_namespace='auth')

class LoginSchema(Schema):
    username: str
    password: str

class LoginResponse(Schema):
    success: bool
    username: str = None
    token: str = None
    error: str = None

class StatusResponse(Schema):
    authenticated: bool
    username: str = None

class LogoutResponse(Schema):
    success: bool

@auth_api.post("/login", response=LoginResponse)
def login_view(request, credentials: LoginSchema):
    """
    Authenticate user and return token
    """
    user = authenticate(username=credentials.username, password=credentials.password)
    
    if user is not None:
        # Create new token
        token_obj = AuthToken.objects.create(user=user)
        return {
            "success": True,
            "username": user.username,
            "token": token_obj.token
        }
    else:
        return {
            "success": False,
            "error": "Kullanıcı adı veya şifre hatalı"
        }

@auth_api.get("/status", auth=TokenAuth(), response=StatusResponse)
def status_view(request):
    """
    Check if token is valid
    """
    return {
        "authenticated": True,
        "username": request.auth.username
    }

@auth_api.post("/logout", auth=TokenAuth(), response=LogoutResponse)
def logout_view(request):
    """
    Logout user (delete token)
    """
    # Token is already validated by TokenAuth
    # We need to find the token object to delete it
    # The token string is in the header: "Bearer <token>"
    auth_header = request.headers.get('Authorization')
    if auth_header:
        token_str = auth_header.split(' ')[1]
        AuthToken.objects.filter(token=token_str).delete()
    
    return {
        "success": True
    }
