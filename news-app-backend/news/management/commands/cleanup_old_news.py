from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from news.models import UserSubmittedNews
import os

class Command(BaseCommand):
    help = 'Deletes news articles older than 14 days to keep the database and storage clean.'

    def handle(self, *args, **kwargs):
        threshold_date = timezone.now() - timedelta(days=14)
        old_articles = UserSubmittedNews.objects.filter(created_at__lt=threshold_date)
        
        count = old_articles.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No news articles older than 14 days were found.'))
            return

        deleted_count = 0
        for article in old_articles:
            # Delete physical image file from storage if it exists
            if article.image and hasattr(article.image, 'path'):
                try:
                    if os.path.isfile(article.image.path):
                        os.remove(article.image.path)
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Could not delete image file for article {article.id}: {e}'))
            
            article.delete()
            deleted_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully deleted {deleted_count} old news articles (and their associated images).'))
