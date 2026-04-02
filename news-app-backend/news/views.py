import threading
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response

from .models import UserSubmittedNews
from .serializers import NewsSubmitSerializer, UserNewsListSerializer
from .services.newsdata_client import fetch_news_by_location
from .ml_worker import process_news_ml


@api_view(['GET'])
@permission_classes([AllowAny])
def external_news(request):
    """Proxy to newsdata.io — returns news based on country code and optional city query."""
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


@api_view(['GET'])
@permission_classes([AllowAny])
def community_news_feed(request):
    """Returns ONLY AI-generated synthesized news, filtered by user's location."""
    qs = UserSubmittedNews.objects.filter(is_ai_generated=True).order_by('-created_at')
    
    # 1. Check for manual override via query params (e.g. ?country=us&city=Austin)
    query_country = request.query_params.get('country')
    query_city = request.query_params.get('city')
    
    if query_country or query_city:
        if query_country:
            qs = qs.filter(country_code__iexact=query_country.strip())
        if query_city:
            qs = qs.filter(location_name__iexact=query_city.strip())
            
    # 2. Fallback to user's profile location ONLY if no override was provided
    elif request.user.is_authenticated:
        user_city = getattr(request.user, 'city', None)
        user_country = getattr(request.user, 'country_code', None)
        
        if user_city:
            qs = qs.filter(location_name__iexact=user_city)
        if user_country:
            qs = qs.filter(country_code__iexact=user_country)
    
    # 3. Handle Pagination manually for @api_view
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(qs, request)
    
    if page is not None:
        serializer = UserNewsListSerializer(page, many=True)
        # Return a structure that matches external_news (based on NewsData.io)
        return Response({
            'totalResults': qs.count(),
            'results': serializer.data,
            'nextPage': paginator.get_next_link()
        })
    
    serializer = UserNewsListSerializer(qs, many=True)
    return Response({
        'totalResults': qs.count(),
        'results': serializer.data,
        'nextPage': None
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_news(request):
    """Authenticated users submit news; defaults to their profile location if blank."""
    data = request.data.copy()
    
    # Defaulting to profile location if not provided
    if not data.get('location_name') and request.user.city:
        data['location_name'] = request.user.city
    if not data.get('country_code') and request.user.country_code:
        data['country_code'] = request.user.country_code

    serializer = NewsSubmitSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        article = serializer.save()
        
        # Fire and forget: Start ML background thread
        threading.Thread(target=process_news_ml, args=(article.id,), daemon=True).start()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_submissions(request):
    """Returns the current user's submitted news."""
    qs = UserSubmittedNews.objects.filter(author=request.user).order_by('-created_at')
    
    # Manual Pagination
    paginator = PageNumberPagination()
    page = paginator.paginate_queryset(qs, request)
    if page is not None:
        serializer = UserNewsListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
        
    serializer = UserNewsListSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def news_detail(request, pk):
    try:
        article = UserSubmittedNews.objects.get(pk=pk)
    except UserSubmittedNews.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    serializer = UserNewsListSerializer(article)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_news(request, pk):
    """Authenticated users can delete their own submissions."""
    try:
        article = UserSubmittedNews.objects.get(pk=pk, author=request.user)
    except UserSubmittedNews.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    article.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def news_suggestions(request):
    """Provides news title suggestions based on a query."""
    query = request.query_params.get('q', '').strip()
    if not query or len(query) < 2:
        return Response([])

    # 1. Search community news (local database)
    community_qs = UserSubmittedNews.objects.filter(
        title__icontains=query
    )[:5]
    suggestions = []
    for item in community_qs:
        suggestions.append({
            'title': item.title,
            'article_id': item.id,
            'type': 'community',
            'content': item.content,
            'location_name': item.location_name,
            'country_code': item.country_code,
            'is_ai_generated': item.is_ai_generated,
            'created_at': str(item.created_at),
            'author_name': item.author.username if item.author else '',
        })

    # 2. Search external news (limited)
    try:
        external_data = fetch_news_by_location(
            query=query,
            country_code=request.query_params.get('country', 'us'),
            language='en'
        )
        for item in (external_data.get('results', [])[:5]):
            if item.get('title'):
                suggestions.append({
                    'title': item.get('title'),
                    'article_id': item.get('article_id'),
                    'type': 'external',
                    'link': item.get('link'),
                    'source_id': item.get('source_id')
                })
    except:
        pass

    return Response(suggestions)
