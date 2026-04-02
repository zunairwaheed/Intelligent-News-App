from django.db import models
from django.conf import settings


class UserSubmittedNews(models.Model):
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='submitted_news'
    )
    title = models.CharField(max_length=500)
    content = models.TextField()
    image = models.ImageField(upload_to='news_images/', blank=True, null=True)

    # Location of the news event
    location_name = models.CharField(max_length=255)
    country_code = models.CharField(max_length=5, default='us')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    # ML Fields
    embedding_vector = models.BinaryField(null=True, blank=True)
    is_ai_generated = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User Submitted News'
        verbose_name_plural = 'User Submitted News'

    def __str__(self):
        return f"{self.title} {'(AI)' if self.is_ai_generated else ''}"
