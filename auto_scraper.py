"""
Automated Crime News Scraper for GitHub Actions
Runs periodically to fetch new crime news and update MongoDB
"""

import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import pymongo
import os
from dotenv import load_dotenv
import time

import feedparser
import hashlib

load_dotenv()

class AutoCrimeScraper:
    def __init__(self):
        # MongoDB connection
        self.mongo_uri = os.getenv("MONGO_URI")
        if not self.mongo_uri:
            raise ValueError("MONGO_URI not found in environment variables")
        
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client["fir_data"]
        self.collection = self.db["crime_news"]
        
        # Create unique index on URL to prevent duplicates
        self.collection.create_index([("news_url", 1)], unique=True)
        self.collection.create_index([("created_at", -1)])
        
        self.headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        
        print(f"✅ Connected to MongoDB. Current records: {self.collection.count_documents({})}")
    
    def scrape_times_of_india_rss(self):
        """Scrape Times of India Mumbai RSS feed"""
        print("\n📡 Fetching Times of India RSS...")
        
        rss_urls = [
            'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',  # Mumbai News
            'https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms'  # India News
        ]
        
        new_articles = []
        
        for rss_url in rss_urls:
            try:
                feed = feedparser.parse(rss_url)
                print(f"  Found {len(feed.entries)} articles in feed")
                
                for entry in feed.entries[:20]:  # Process latest 20
                    title = entry.get('title', '')
                    url = entry.get('link', '')
                    
                    # Check if crime-related
                    crime_keywords = ['murder', 'rape', 'theft', 'robbery', 'assault', 'kidnap', 
                                     'crime', 'arrested', 'police', 'killed', 'attack', 'molest']
                    
                    if any(keyword in title.lower() for keyword in crime_keywords):
                        # Check for Mumbai
                        if 'mumbai' in title.lower() or 'mumbai' in url.lower():
                            new_articles.append({
                                'title': title,
                                'url': url,
                                'source': 'Times of India',
                                'published': entry.get('published', '')
                            })
            except Exception as e:
                print(f"  ❌ Error fetching RSS: {e}")
        
        print(f"  ✅ Found {len(new_articles)} crime-related articles")
        return new_articles
    
    def scrape_hindustan_times_rss(self):
        """Scrape Hindustan Times Mumbai RSS"""
        print("\n📡 Fetching Hindustan Times RSS...")
        
        rss_url = 'https://www.hindustantimes.com/feeds/rss/mumbai-news/rssfeed.xml'
        new_articles = []
        
        try:
            feed = feedparser.parse(rss_url)
            print(f"  Found {len(feed.entries)} articles in feed")
            
            for entry in feed.entries[:20]:
                title = entry.get('title', '')
                url = entry.get('link', '')
                
                crime_keywords = ['murder', 'rape', 'theft', 'robbery', 'assault', 'kidnap', 
                                 'crime', 'arrested', 'police', 'killed', 'attack']
                
                if any(keyword in title.lower() for keyword in crime_keywords):
                    new_articles.append({
                        'title': title,
                        'url': url,
                        'source': 'Hindustan Times',
                        'published': entry.get('published', '')
                    })
        except Exception as e:
            print(f"  ❌ Error fetching RSS: {e}")
        
        print(f"  ✅ Found {len(new_articles)} crime-related articles")
        return new_articles
    
    def classify_crime_type(self, text):
        """Classify crime type from text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['murder', 'killed', 'homicide', 'stabbed', 'shot dead']):
            return 'murder'
        elif any(word in text_lower for word in ['rape', 'sexual assault', 'molest', 'harassment']):
            return 'rape'
        elif any(word in text_lower for word in ['theft', 'stolen', 'burglary', 'robbery', 'loot', 'robbed']):
            return 'theft'
        elif any(word in text_lower for word in ['kidnap', 'abduct', 'missing']):
            return 'kidnapping'
        elif any(word in text_lower for word in ['extortion', 'blackmail', 'ransom']):
            return 'extortion'
        else:
            return 'other'
    
    def determine_severity(self, crime_type):
        """Determine severity level"""
        severity_map = {
            'murder': 'Critical',
            'rape': 'Critical',
            'kidnapping': 'High',
            'extortion': 'High',
            'theft': 'Medium',
            'other': 'Low'
        }
        return severity_map.get(crime_type, 'Low')
    
    def extract_location(self, text):
        """Extract Mumbai location from text"""
        mumbai_areas = [
            'Andheri', 'Bandra', 'Borivali', 'Churchgate', 'Colaba', 'Dadar', 'Goregaon',
            'Juhu', 'Kandivali', 'Kurla', 'Malad', 'Mulund', 'Powai', 'Santacruz',
            'Vile Parle', 'Worli', 'Ghatkopar', 'Vikhroli', 'Bhandup', 'Chembur'
        ]
        
        text_lower = text.lower()
        for area in mumbai_areas:
            if area.lower() in text_lower:
                return area
        return "Mumbai"
    
    def get_coordinates(self, location):
        """Get approximate coordinates for Mumbai areas"""
        # Hardcoded coordinates for common Mumbai areas (faster than geocoding)
        coords_map = {
            'Andheri': (19.1136, 72.8697),
            'Bandra': (19.0596, 72.8295),
            'Borivali': (19.2403, 72.8565),
            'Colaba': (18.9067, 72.8147),
            'Dadar': (19.0178, 72.8478),
            'Mumbai': (19.0760, 72.8777),
            'Kurla': (19.0728, 72.8826),
            'Malad': (19.1864, 72.8493),
            'Worli': (19.0183, 72.8169),
            'Ghatkopar': (19.0864, 72.9081),
            'Powai': (19.1176, 72.9060)
        }
        
        lat, lon = coords_map.get(location, coords_map['Mumbai'])
        return lat, lon
    
    def process_and_save_article(self, article):
        """Process article and save to MongoDB"""
        try:
            # Check if already exists
            if self.collection.find_one({"news_url": article['url']}):
                return False  # Already exists
            
            crime_type = self.classify_crime_type(article['title'])
            location = self.extract_location(article['title'])
            latitude, longitude = self.get_coordinates(location)
            severity = self.determine_severity(crime_type)
            
            # Create FIR number from hash
            fir_hash = hashlib.md5(article['url'].encode()).hexdigest()[:8].upper()
            fir_number = f"FIR/{datetime.now().year}/{fir_hash}"
            
            crime_record = {
                'fir_number': fir_number,
                'crime_type': crime_type,
                'title': article['title'],
                'description': article['title'],  # Use title as description for RSS
                'location': location,
                'latitude': latitude,
                'longitude': longitude,
                'incident_date': article.get('published', datetime.now().isoformat()),
                'source': article['source'],
                'news_url': article['url'],
                'image_url': None,  # Can be enhanced later
                'severity_level': severity,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            # Insert into MongoDB
            self.collection.insert_one(crime_record)
            print(f"  ✅ Added: {article['title'][:60]}...")
            return True
            
        except pymongo.errors.DuplicateKeyError:
            return False  # Duplicate
        except Exception as e:
            print(f"  ❌ Error saving article: {e}")
            return False
    
    def run(self):
        """Main scraping process"""
        print("\n" + "="*80)
        print("🚨 AUTOMATED CRIME NEWS SCRAPER")
        print("="*80)
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Collect articles from all sources
        all_articles = []
        all_articles.extend(self.scrape_times_of_india_rss())
        all_articles.extend(self.scrape_hindustan_times_rss())
        
        print(f"\n📊 Total articles found: {len(all_articles)}")
        
        # Process and save
        new_count = 0
        for article in all_articles:
            if self.process_and_save_article(article):
                new_count += 1
        
        print("\n" + "="*80)
        print(f"✅ SCRAPING COMPLETE")
        print(f"   New articles added: {new_count}")
        print(f"   Total in database: {self.collection.count_documents({})}")
        print(f"   Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")
        
        self.client.close()
        return new_count


if __name__ == "__main__":
    scraper = AutoCrimeScraper()
    scraper.run()
