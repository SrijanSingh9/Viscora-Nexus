from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import requests

from .models import UserProfile, DailyReflection
from .serializers import UserProfileSerializer, DailyReflectionSerializer

# ==========================================
# AUTHENTICATION & PROFILE VIEWS
# ==========================================

@api_view(['POST'])
@permission_classes([AllowAny])
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
        # Create the user and their associated profile
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
                "name": f"{first_name} {last_name}".strip(),
                "email": email,
                "persona": persona
            }
        }, status=201)

    except Exception as e:
        return Response({"error": str(e)}, status=400)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    profile = UserProfile.objects.get(user=request.user)
    
    # Allow the user to update their persona from the dashboard
    if request.method == 'PATCH':
        new_persona = request.data.get('persona')
        if new_persona:
            profile.persona = new_persona
            profile.save()
            
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)


# ==========================================
# REFLECTION ENGINE VIEWS (WITH OLLAMA)
# ==========================================

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
        history_text = "\n".join([f"Past Entry: {r.content}" for r in reversed(past_reflections)])
        
        # 2. Get the User's Persona to customize the AI prompt
        try:
            persona = request.user.userprofile.persona
        except UserProfile.DoesNotExist:
            persona = 'guest'

        if persona == 'student':
            persona_context = "They are a student. Focus your insight on learning, growth, managing academic stress, and fueling curiosity."
        elif persona == 'professional':
            persona_context = "They are a professional. Focus your insight on career growth, work-life balance, leadership, and resilience."
        elif persona == 'homemaker':
            persona_context = "They are a homemaker. Focus your insight on self-care, finding peace in daily rhythms, and validating their vital emotional labor."
        else:
            persona_context = "They are exploring their path. Provide a philosophical, empathetic, and grounding perspective."

        system_prompt = f"""You are Viscora Nexus, an empathetic, highly intelligent AI journal companion. 
{persona_context}
Read their past entries (if any) and their current entry. 
Provide a very short, poetic, and motivating insight (maximum 2 sentences) that connects the dots of their thoughts.
At the very end, on a new line, provide exactly 3 single-word themes or tags starting with a hashtag (e.g., #Growth #Clarity #Patience)."""

        full_prompt = f"{system_prompt}\n\n{history_text}\n\nCurrent Entry: {content}\n\nYour Insight:"

        # 3. Call the local LLM (Ollama)
        ai_insight = "The Nexus is quiet right now. (Make sure Ollama is running locally!)"
        try:
            ollama_payload = {
                "model": "gemma:2b", 
                "prompt": full_prompt,
                "stream": False
            }
            # Using 127.0.0.1 instead of localhost for Windows compatibility
            ollama_response = requests.post('http://127.0.0.1:11434/api/generate', json=ollama_payload, timeout=45)
            
            if ollama_response.status_code == 200:
                ai_insight = ollama_response.json().get('response', '').strip()
            else:
                print(f"Ollama error: {ollama_response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"Failed to connect to local LLM: {e}")

        # 4. Save everything to the database
        reflection = DailyReflection.objects.create(
            user=request.user, 
            content=content, 
            mood=mood, 
            ai_insight=ai_insight
        )
        serializer = DailyReflectionSerializer(reflection)
        return Response(serializer.data, status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def reflection_detail_view(request, pk):
    try:
        # Ensure a user can only edit/delete their OWN reflections
        reflection = DailyReflection.objects.get(pk=pk, user=request.user)
    except DailyReflection.DoesNotExist:
        return Response({"error": "Reflection not found."}, status=404)
    
    if request.method == 'DELETE':
        reflection.delete()
        return Response(status=204)
        
    elif request.method == 'PATCH':
        reflection.content = request.data.get('content', reflection.content)
        
        # --- NEW: Re-run Ollama when a reflection is edited ---
        # Fetch up to 3 past reflections that occurred BEFORE this edited reflection
        past_reflections = DailyReflection.objects.filter(
            user=request.user, 
            created_at__lt=reflection.created_at
        ).order_by('-created_at')[:3]
        
        history_text = "\n".join([f"Past Entry: {r.content}" for r in reversed(past_reflections)])
        
        try:
            persona = request.user.userprofile.persona
        except UserProfile.DoesNotExist:
            persona = 'guest'

        if persona == 'student':
            persona_context = "They are a student. Focus your insight on learning, growth, managing academic stress, and fueling curiosity."
        elif persona == 'professional':
            persona_context = "They are a professional. Focus your insight on career growth, work-life balance, leadership, and resilience."
        elif persona == 'homemaker':
            persona_context = "They are a homemaker. Focus your insight on self-care, finding peace in daily rhythms, and validating their vital emotional labor."
        else:
            persona_context = "They are exploring their path. Provide a philosophical, empathetic, and grounding perspective."

        system_prompt = f"""You are Viscora Nexus, an empathetic, highly intelligent AI journal companion. 
{persona_context}
Read their past entries (if any) and their current entry. 
Provide a very short, poetic, and motivating insight (maximum 2 sentences) that connects the dots of their thoughts.
At the very end, on a new line, provide exactly 3 single-word themes or tags starting with a hashtag (e.g., #Growth #Clarity #Patience)."""

        full_prompt = f"{system_prompt}\n\n{history_text}\n\nCurrent Entry: {reflection.content}\n\nYour Insight:"

        try:
            ollama_payload = {
                "model": "gemma:2b", 
                "prompt": full_prompt,
                "stream": False
            }
            ollama_response = requests.post('http://127.0.0.1:11434/api/generate', json=ollama_payload, timeout=45)
            
            if ollama_response.status_code == 200:
                reflection.ai_insight = ollama_response.json().get('response', '').strip()
            else:
                print(f"Ollama error: {ollama_response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"Failed to connect to local LLM: {e}")

        # Save the updated text AND the brand new AI insight
        reflection.save()
        
        serializer = DailyReflectionSerializer(reflection)
        return Response(serializer.data)