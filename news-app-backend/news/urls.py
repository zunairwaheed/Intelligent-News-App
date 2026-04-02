from django.urls import path
from . import views

urlpatterns = [
    # Public / user endpoints
    path('external/', views.external_news, name='external_news'),
    path('community/', views.community_news_feed, name='community_news'),
    path('submit/', views.submit_news, name='submit_news'),
    path('my-submissions/', views.my_submissions, name='my_submissions'),
    path('delete/<int:pk>/', views.delete_news, name='delete_news'),
    path('<int:pk>/', views.news_detail, name='news_detail'),
    path('suggestions/', views.news_suggestions, name='news_suggestions'),
]
