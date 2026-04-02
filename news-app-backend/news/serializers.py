from rest_framework import serializers
from .models import UserSubmittedNews


class NewsSubmitSerializer(serializers.ModelSerializer):
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
