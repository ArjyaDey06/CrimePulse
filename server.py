from flask import Flask, jsonify
from flask_cors import CORS
import pymongo
import urllib.parse
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGODB_URI = os.getenv("MONGO_URI")
if not MONGODB_URI:
    raise ValueError("MONGO_URI not found in environment variables")

client = pymongo.MongoClient(MONGODB_URI)
db = client["fir_data"]
collection = db["firs"]
crime_news_collection = db["crime_news"]

@app.route('/api/crime-data', methods=['GET'])
def get_crime_data():
    try:
        # Fetch all crime news data with images and coordinates
        crimes = list(crime_news_collection.find({}, {
            'latitude': 1,
            'longitude': 1,
            'crime_type': 1,
            'severity_level': 1,
            'location': 1,
            'incident_date': 1,
            'fir_number': 1,
            'title': 1,
            'description': 1,
            'image_url': 1,
            'source': 1,
            'news_url': 1,
            '_id': 0
        }))
        
        return jsonify({
            'success': True,
            'data': crimes,
            'count': len(crimes)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        # Get crime statistics from crime_news collection
        stats = list(crime_news_collection.aggregate([
            {"$group": {"_id": "$crime_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        severity_stats = list(crime_news_collection.aggregate([
            {"$group": {"_id": "$severity_level", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        return jsonify({
            'success': True,
            'crime_types': stats,
            'severity_levels': severity_stats,
            'total_records': crime_news_collection.count_documents({})
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
