from django.contrib.auth.models import AbstractUser
from django.db import models


from django.core.validators import RegexValidator

class User(AbstractUser):
    username = models.CharField(
        max_length=150,
        unique=True,
        help_text='Required. 150 characters or fewer. Letters, digits and spaces only.',
        validators=[
            RegexValidator(
                regex=r'^[\w ]+$',
                message='Username can only contain letters, digits, and spaces.',
                code='invalid_username'
            ),
        ],
        error_messages={
            'unique': "A user with that username already exists.",
        },
    )
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Location preferences
    city = models.CharField(max_length=100, blank=True)
    country_code = models.CharField(max_length=5, blank=True, default='gb')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email
