from django.urls import path
from .views import (
    ExternalNewsView,
    CommunityNewsFeedView,
    SubmitNewsView,
    MySubmissionsView,
    NewsDetailView,
    PendingNewsListView,
    ReviewNewsView,
)

urlpatterns = [
    # Public / user endpoints
    path('external/', ExternalNewsView.as_view(), name='external_news'),
    path('community/', CommunityNewsFeedView.as_view(), name='community_news'),
    path('submit/', SubmitNewsView.as_view(), name='submit_news'),
    path('my-submissions/', MySubmissionsView.as_view(), name='my_submissions'),
    path('<int:pk>/', NewsDetailView.as_view(), name='news_detail'),

    # Admin endpoints
    path('admin/pending/', PendingNewsListView.as_view(), name='pending_news'),
    path('admin/review/<int:pk>/', ReviewNewsView.as_view(), name='review_news'),
]
