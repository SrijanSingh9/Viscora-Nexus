from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import signup, get_user_profile
from .views import reflections_view

urlpatterns = [
    # Authentication Endpoints
    path('signup/', signup, name='signup'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'), # Takes username(email) & password
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Protected Data Endpoints
    path('profile/', get_user_profile, name='user_profile'),
    path('reflections/', reflections_view, name='reflections'),
]

