from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserProfile
from .serializers import UserProfileSerializer

@api_view(['GET', 'POST'])
def signup_and_profiles(request):
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')
        persona = request.data.get('persona', 'guest') # Defaults to guest
        
        try:
            user = User.objects.create_user(username=username, password=password)
            profile = UserProfile.objects.create(user=user, persona=persona)
            return Response({"message": "User and Persona created successfully!"}, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

    # For GET requests, return the list of users
    profiles = UserProfile.objects.all()
    serializer = UserProfileSerializer(profiles, many=True)
    return Response(serializer.data)