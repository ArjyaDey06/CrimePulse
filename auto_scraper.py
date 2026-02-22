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
        """Scrape Times of India India-wide RSS feed"""
        print("\n📡 Fetching Times of India RSS...")
        
        rss_urls = [
            'https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms',  # India News
            'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',  # Mumbai News
            'https://timesofindia.indiatimes.com/rssfeeds/2647163.cms',     # Delhi News
            'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms'      # Bangalore News
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
                        # Add all India crime news (removed Mumbai filter)
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
        """Scrape Hindustan Times India RSS"""
        print("\n📡 Fetching Hindustan Times RSS...")
        
        rss_urls = [
            'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
            'https://www.hindustantimes.com/feeds/rss/mumbai-news/rssfeed.xml',
            'https://www.hindustantimes.com/feeds/rss/delhi-news/rssfeed.xml'
        ]
        
        new_articles = []
        
        for rss_url in rss_urls:
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
        """Extract location from text - covers major Indian cities"""
        # Major Indian cities and their notable areas
        indian_locations = [
            # Mumbai areas
            'Andheri', 'Bandra', 'Borivali', 'Churchgate', 'Colaba', 'Dadar', 'Goregaon',
            'Juhu', 'Kandivali', 'Kurla', 'Malad', 'Mulund', 'Powai', 'Santacruz',
            'Vile Parle', 'Worli', 'Ghatkopar', 'Vikhroli', 'Bhandup', 'Chembur',
            # Major cities
            'Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad',
            'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
            'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
            'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut',
            'Rajkot', 'Kalyan', 'Vasai', 'Varanasi', 'Srinagar', 'Aurangabad',
            'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah',
            'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai',
            'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Noida', 'Gurugram', 'Gurgaon'
        ]
        
        text_lower = text.lower()
        for location in indian_locations:
            if location.lower() in text_lower:
                return location
        return "India"  # Default if no specific location found
    
    def get_coordinates(self, location):
        """Get approximate coordinates for Indian cities and areas"""
        # Hardcoded coordinates for Indian cities and areas (faster than geocoding)
        coords_map = {
            # Mumbai and areas
            'Mumbai': (19.0760, 72.8777),
            'Andheri': (19.1136, 72.8697),
            'Bandra': (19.0596, 72.8295),
            'Borivali': (19.2403, 72.8565),
            'Colaba': (18.9067, 72.8147),
            'Dadar': (19.0178, 72.8478),
            'Kurla': (19.0728, 72.8826),
            'Malad': (19.1864, 72.8493),
            'Worli': (19.0183, 72.8169),
            'Ghatkopar': (19.0864, 72.9081),
            'Powai': (19.1176, 72.9060),
            'Navi Mumbai': (19.0330, 73.0297),
            'Thane': (19.2183, 72.9781),
            # Major cities
            'Delhi': (28.7041, 77.1025),
            'Bangalore': (12.9716, 77.5946),
            'Bengaluru': (12.9716, 77.5946),
            'Chennai': (13.0827, 80.2707),
            'Kolkata': (22.5726, 88.3639),
            'Hyderabad': (17.3850, 78.4867),
            'Pune': (18.5204, 73.8567),
            'Ahmedabad': (23.0225, 72.5714),
            'Surat': (21.1702, 72.8311),
            'Jaipur': (26.9124, 75.7873),
            'Lucknow': (26.8467, 80.9462),
            'Kanpur': (26.4499, 80.3319),
            'Nagpur': (21.1458, 79.0882),
            'Indore': (22.7196, 75.8577),
            'Bhopal': (23.2599, 77.4126),
            'Visakhapatnam': (17.6868, 83.2185),
            'Patna': (25.5941, 85.1376),
            'Vadodara': (22.3072, 73.1812),
            'Ghaziabad': (28.6692, 77.4538),
            'Ludhiana': (30.9010, 75.8573),
            'Agra': (27.1767, 78.0081),
            'Nashik': (19.9975, 73.7898),
            'Faridabad': (28.4089, 77.3178),
            'Meerut': (28.9845, 77.7064),
            'Rajkot': (22.3039, 70.8022),
            'Varanasi': (25.3176, 82.9739),
            'Srinagar': (34.0837, 74.7973),
            'Aurangabad': (19.8762, 75.3433),
            'Amritsar': (31.6340, 74.8723),
            'Allahabad': (25.4358, 81.8463),
            'Ranchi': (23.3441, 85.3096),
            'Howrah': (22.5958, 88.2636),
            'Coimbatore': (11.0168, 76.9558),
            'Vijayawada': (16.5062, 80.6480),
            'Jodhpur': (26.2389, 73.0243),
            'Madurai': (9.9252, 78.1198),
            'Raipur': (21.2514, 81.6296),
            'Kota': (25.2138, 75.8648),
            'Chandigarh': (30.7333, 76.7794),
            'Guwahati': (26.1445, 91.7362),
            'Noida': (28.5355, 77.3910),
            'Gurugram': (28.4595, 77.0266),
            'Gurgaon': (28.4595, 77.0266),
            'India': (20.5937, 78.9629)  # Center of India
        }
        
        lat, lon = coords_map.get(location, coords_map['India'])
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
