from rest_framework import serializers
from .models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'persona', 'created_at']
# Add this below your UserProfileSerializer

from .models import DailyReflection

class DailyReflectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyReflection
        fields = ['id', 'content', 'ai_insight', 'mood', 'created_at']