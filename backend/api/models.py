from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    PERSONA_CHOICES = [
        ('guest', 'Guest / Prefer not to say'),
        ('student', 'Student'),
        ('homemaker', 'Homemaker'),
        ('professional', 'Professional'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    persona = models.CharField(max_length=30, choices=PERSONA_CHOICES, default='guest')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_persona_display()}"