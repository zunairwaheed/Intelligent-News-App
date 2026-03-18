from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserSubmittedNews
from .serializers import NewsSubmitSerializer, UserNewsListSerializer, NewsReviewSerializer
from .services.newsdata_client import fetch_news_by_location


class ExternalNewsView(APIView):
    """Proxy to newsdata.io — returns news based on country code and optional city query."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        country_code = request.query_params.get('country', 'us')
        query = request.query_params.get('q', '')
        page = request.query_params.get('page', None)
        language = request.query_params.get('language', 'en')
        category = request.query_params.get('category', None)
        domain = request.query_params.get('domain', None)
        timeframe = request.query_params.get('timeframe', None)
        prioritydomain = request.query_params.get('prioritydomain', None)

        data = fetch_news_by_location(
            country_code=country_code,
            query=query or None,
            language=language,
            page=page,
            category=category,
            domain=domain,
            timeframe=timeframe,
            prioritydomain=prioritydomain,
        )
        return Response(data)


class CommunityNewsFeedView(generics.ListAPIView):
    """Returns all approved user-submitted news, filtered by country."""
    permission_classes = (IsAuthenticated,)
    serializer_class = UserNewsListSerializer

    def get_queryset(self):
        qs = UserSubmittedNews.objects.filter(status=UserSubmittedNews.STATUS_APPROVED)
        country = self.request.query_params.get('country')
        if country:
            qs = qs.filter(country_code__iexact=country)
        return qs


class SubmitNewsView(generics.CreateAPIView):
    """Authenticated users submit news; starts as 'pending'."""
    permission_classes = (IsAuthenticated,)
    serializer_class = NewsSubmitSerializer


class MySubmissionsView(generics.ListAPIView):
    """Returns the current user's submitted news with statuses."""
    permission_classes = (IsAuthenticated,)
    serializer_class = UserNewsListSerializer

    def get_queryset(self):
        return UserSubmittedNews.objects.filter(author=self.request.user)


class NewsDetailView(generics.RetrieveAPIView):
    queryset = UserSubmittedNews.objects.filter(status=UserSubmittedNews.STATUS_APPROVED)
    permission_classes = (IsAuthenticated,)
    serializer_class = UserNewsListSerializer


# ── Admin-only: Review submitted news ──────────────────────────────────────

class PendingNewsListView(generics.ListAPIView):
    """Admin sees all pending submissions."""
    permission_classes = (IsAdminUser,)
    serializer_class = UserNewsListSerializer
    queryset = UserSubmittedNews.objects.filter(status=UserSubmittedNews.STATUS_PENDING)


class ReviewNewsView(APIView):
    """Admin approves or rejects a pending submission."""
    permission_classes = (IsAdminUser,)

    def post(self, request, pk):
        try:
            article = UserSubmittedNews.objects.get(pk=pk)
        except UserSubmittedNews.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = NewsReviewSerializer(article, data=request.data, partial=True)
        if serializer.is_valid():
            article.status = serializer.validated_data['status']
            article.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            article.reviewed_by = request.user
            article.reviewed_at = timezone.now()
            article.save()
            return Response(UserNewsListSerializer(article).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
