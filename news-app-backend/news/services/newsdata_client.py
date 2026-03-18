import requests
from django.conf import settings


NEWSDATA_BASE_URL = 'https://newsdata.io/api/1/news'


def fetch_news_by_location(
    country_code='us', 
    query=None, 
    language='en', 
    page=None,
    category=None,
    domain=None,
    timeframe=None,
    prioritydomain=None
):
    """
    Fetch news from newsdata.io for a given country.
    country_code: 2-letter ISO country code (e.g. 'us', 'pk', 'gb')
    query: optional search term (city name etc.)
    page: pagination cursor from newsdata.io
    """
    api_key = settings.NEWSDATA_API_KEY
    if not api_key:
        return {'error': 'NEWSDATA_API_KEY not configured.', 'results': []}

    params = {
        'apikey': api_key,
        'language': language,
        'country': country_code.lower(),
    }

    if query:
        params['q'] = query

    if page:
        params['page'] = page
        
    if category:
        params['category'] = category
        
    if domain:
        params['domain'] = domain
        
    if timeframe:
        params['timeframe'] = timeframe
        
    if prioritydomain:
        params['prioritydomain'] = prioritydomain

    try:
        response = requests.get(NEWSDATA_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        return {
            'results': data.get('results', []),
            'nextPage': data.get('nextPage'),
            'totalResults': data.get('totalResults', 0),
        }
    except requests.exceptions.RequestException as e:
        return {'error': str(e), 'results': []}
