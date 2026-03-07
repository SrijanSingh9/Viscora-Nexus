from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import UserProfile
from .serializers import UserProfileSerializer
from rest_framework_simplejwt.tokens import RefreshToken

@api_view(['POST'])
@permission_classes([AllowAny])  # Anyone can sign up
def signup(request):
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    email = request.data.get('email')
    password = request.data.get('password')
    persona = request.data.get('persona', 'guest')

    if not email or not password:
        return Response({"error": "Email and password are required."}, status=400)

    # Check if user already exists
    if User.objects.filter(email=email).exists():
        return Response({"error": "A user with this email already exists."}, status=400)

    try:
        # We use email as the username to allow email-based logins seamlessly
        user = User.objects.create_user(
            username=email, 
            email=email, 
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        profile = UserProfile.objects.create(user=user, persona=persona)
        
        # Auto-generate JWT Tokens for immediate login
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "User created successfully!",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "name": f"{first_name} {last_name}",
                "email": email,
                "persona": persona
            }
        }, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated]) # Only logged-in users with a token can see this
def get_user_profile(request):
    # The JWT token automatically identifies the user making the request
    profile = UserProfile.objects.get(user=request.user)
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)
# Add these imports at the top
import requests
from .models import DailyReflection
from .serializers import DailyReflectionSerializer

# Add this new view
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def reflections_view(request):
    if request.method == 'GET':
        reflections = DailyReflection.objects.filter(user=request.user)
        serializer = DailyReflectionSerializer(reflections, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        content = request.data.get('content')
        mood = request.data.get('mood')
        
        if not content:
            return Response({"error": "Reflection content is required."}, status=400)

        # 1. Fetch the user's past 3 reflections to "connect the dots"
        past_reflections = DailyReflection.objects.filter(user=request.user).order_by('-created_at')[:3]
        
        # 2. Build the context prompt for the AI
        history_text = "\n".join([
            f"Past Entry ({r.created_at.strftime('%b %d')}): {r.content}" 
            for r in reversed(past_reflections)
        ])
        
        system_prompt = f"""You are Viscora Nexus, an empathetic, highly intelligent AI journal companion. 
The user is a {request.user.userprofile.persona}. 
Read their past entries (if any) and their current entry. 
Provide a short, poetic, and motivating insight (2-3 sentences max) that connects the dots of their thoughts and encourages them."""

        full_prompt = f"{system_prompt}\n\n{history_text}\n\nCurrent Entry: {content}\n\nYour Insight:"

        # 3. Call the local LLM (Assuming Ollama is running on default port 11434)
        ai_insight = "The Nexus is quiet right now. (Make sure Ollama is running locally!)"
        try:
            # Change "gemma" to "qwen" if you are using Qwen!
            ollama_payload = {
                "model": "gemma", 
                "prompt": full_prompt,
                "stream": False
            }
            ollama_response = requests.post('http://localhost:11434/api/generate', json=ollama_payload, timeout=30)
            if ollama_response.status_code == 200:
                ai_insight = ollama_response.json().get('response', '').strip()
        except requests.exceptions.RequestException as e:
            print("Failed to connect to local LLM:", e)

        # 4. Save everything to the database
        reflection = DailyReflection.objects.create(
            user=request.user,
            content=content,
            mood=mood,
            ai_insight=ai_insight
        )

        serializer = DailyReflectionSerializer(reflection)
        return Response(serializer.data, status=201)