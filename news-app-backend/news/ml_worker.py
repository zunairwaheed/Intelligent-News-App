import threading
import google.generativeai as genai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from django.db import transaction
from decouple import config
from .models import UserSubmittedNews

# Configure Gemini
genai.configure(api_key=config('GEMINI_API_KEY', default=''))

def process_news_ml(article_id):
    """
    Background worker to generate embeddings and check for news synthesis using Google Gemini.
    """
    try:
        article = UserSubmittedNews.objects.get(id=article_id)
        
        # 1. Generate Embedding using Gemini
        text_to_embed = f"{article.title}\n\n{article.content}"
        
        # Using Gemini's modern embedding model
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text_to_embed,
            task_type="retrieval_document",
            title=article.title
        )
        embedding = result['embedding']
        
        # Store as binary (float32 NumPy array)
        article.embedding_vector = np.array(embedding, dtype=np.float32).tobytes()
        article.save()
        
        print(f"[{article.id}] Gemini Embedding generated successfully.")
        
        # 2. Check for Similarity and Synthesis
        check_for_synthesis(article)
        
    except Exception as e:
        print(f"ML Worker Error (Article {article_id}): {e}")

def check_for_synthesis(new_article):
    """
    Finds similar articles and triggers synthesis if we reach the threshold (>= 5 articles).
    """
    if new_article.is_ai_generated:
        return
        
    threshold = 0.90 # Adjusted threshold for tighter clustering with Gemini embeddings
    new_vec = np.frombuffer(new_article.embedding_vector, dtype=np.float32).reshape(1, -1)
    
    # 1. Check if an AI Master article already exists for this event
    ai_others = UserSubmittedNews.objects.exclude(embedding_vector__isnull=True).filter(is_ai_generated=True)
    for ai_art in ai_others:
        ai_vec = np.frombuffer(ai_art.embedding_vector, dtype=np.float32).reshape(1, -1)
        if cosine_similarity(new_vec, ai_vec)[0][0] > threshold:
            print(f"[{new_article.id}] Master AI article already exists for this event, skipping synthesis.")
            return

    # 2. Find similar user-submitted articles
    others = UserSubmittedNews.objects.exclude(id=new_article.id).exclude(embedding_vector__isnull=True).filter(is_ai_generated=False)
    
    similar_articles = [new_article]
    
    for other in others:
        other_vec = np.frombuffer(other.embedding_vector, dtype=np.float32).reshape(1, -1)
        similarity = cosine_similarity(new_vec, other_vec)[0][0]
        
        if similarity > threshold:
            similar_articles.append(other)
    
    print(f"[{new_article.id}] Found {len(similar_articles)} similar articles under threshold {threshold}.")
    
    # Trigger synthesis if we have 5 or more similar articles
    if len(similar_articles) >= 5:
        synthesize_articles(similar_articles)

def synthesize_articles(articles):
    """
    Calls Gemini 1.5 Flash to synthesize multiple reports into one high-quality article.
    """
    print(f"Synthesizing {len(articles)} articles using Gemini...")
    
    combined_text = "\n---\n".join([f"Title: {a.title}\nContent: {a.content}" for a in articles])
    
    model = genai.GenerativeModel('models/gemini-flash-latest')
    
    prompt = f"""
    You are a professional news editor. Below are {len(articles)} different reports about the same event.
    Your task is to synthesize them into ONE definitive, high-quality news article.
    
    Requirements:
    1. Create a catchy and professional headline.
    2. Write a comprehensive body covering all key details from the sources.
    3. Maintain a neutral, journalistic tone.
    4. Provide the result in a clear format: 'Headline: [Title]' followed by the 'Body: [Content]'.
    
    Reports:
    {combined_text}
    """
    
    try:
        response = model.generate_content(prompt)
        result = response.text.strip()
        
        # Parsing Headline and Body
        if 'Headline:' in result and 'Body:' in result:
            parts = result.split('Body:', 1)
            title = parts[0].replace('Headline:', '').strip()
            content = parts[1].strip()
        else:
            # Fallback parsing
            lines = result.split('\n')
            title = lines[0]
            content = "\n".join(lines[1:])
            
        # Find the first available image from the source articles
        image_to_use = None
        for a in articles:
            if a.image:
                image_to_use = a.image
                break
                
        # Create the AI Generated Master Article
        with transaction.atomic():
            master = UserSubmittedNews.objects.create(
                title=title.strip(),
                content=content.strip(),
                author=articles[0].author, 
                location_name=articles[0].location_name,
                country_code=articles[0].country_code,
                is_ai_generated=True,
                image=image_to_use
            )
            print(f"AI Master Article created via Gemini: {master.id}")
            
        # Generate an embedding for the AI Master article to prevent future duplicate synthesis
        text_to_embed = f"{master.title}\n\n{master.content}"
        embed_result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=text_to_embed,
            task_type="retrieval_document",
            title=master.title
        )
        master.embedding_vector = np.array(embed_result['embedding'], dtype=np.float32).tobytes()
        master.save()
        print(f"[{master.id}] Master Article Embedding generated successfully.")
            
    except Exception as e:
        print(f"Gemini Synthesis Error: {e}")
