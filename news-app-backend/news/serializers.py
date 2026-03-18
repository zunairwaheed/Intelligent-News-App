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

    class Meta:
        model = UserSubmittedNews
        fields = (
            'id', 'title', 'content', 'image',
            'location_name', 'country_code', 'latitude', 'longitude',
            'status', 'rejection_reason', 'author_name',
            'created_at', 'updated_at',
        )
        read_only_fields = ('status', 'rejection_reason', 'author_name', 'created_at', 'updated_at')


class NewsReviewSerializer(serializers.ModelSerializer):
    """Used by admin to approve or reject news."""
    class Meta:
        model = UserSubmittedNews
        fields = ('status', 'rejection_reason')
