import base64
import uuid
from django.core.files.base import ContentFile
from rest_framework import serializers
from .models import UserSubmittedNews


class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str) and data.startswith('data:image'):
            # base64 encoded image - decode
            format, imgstr = data.split(';base64,')
            ext = format.split('/')[-1]
            id = uuid.uuid4()
            data = ContentFile(base64.b64decode(imgstr), name=id.urn[9:] + '.' + ext)
        elif isinstance(data, str):
            try:
                decoded_file = base64.b64decode(data)
                id = uuid.uuid4()
                data = ContentFile(decoded_file, name=id.urn[9:] + '.jpg')
            except Exception:
                pass
        return super().to_internal_value(data)


class NewsSubmitSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(required=False, allow_blank=True)
    country_code = serializers.CharField(required=False, allow_blank=True)
    image = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = UserSubmittedNews
        fields = (
            'id', 'title', 'content', 'image',
            'location_name', 'country_code', 'latitude', 'longitude',
        )

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class UserNewsListSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    article_id = serializers.ReadOnlyField(source='id')

    class Meta:
        model = UserSubmittedNews
        fields = (
            'id', 'article_id', 'author', 'author_name', 'title', 'content', 'image',
            'location_name', 'country_code', 'latitude', 'longitude',
            'is_ai_generated', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'article_id', 'author', 'is_ai_generated', 'author_name', 'created_at', 'updated_at')
