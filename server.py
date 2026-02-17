from flask import Flask, jsonify, request
from flask_cors import CORS
import pymongo
import urllib.parse
import os
from dotenv import load_dotenv
from datetime import datetime
from crime_analytics import CrimeAnalytics

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

@app.route('/api/crime-data/new', methods=['GET'])
def get_new_crime_data():
    """Get only new crime data since a given timestamp"""
    try:
        # Get 'since' parameter (ISO format datetime string)
        since = request.args.get('since')
        
        query = {}
        if since:
            try:
                since_date = datetime.fromisoformat(since.replace('Z', '+00:00'))
                query = {'created_at': {'$gt': since_date}}
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date format. Use ISO format.'
                }), 400
        
        # Fetch new crimes
        new_crimes = list(crime_news_collection.find(query, {
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
            'created_at': 1,
            '_id': 0
        }).sort('created_at', -1))
        
        return jsonify({
            'success': True,
            'data': new_crimes,
            'count': len(new_crimes),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/hotspots', methods=['GET'])
def get_hotspots():
    """Get crime hotspots (high-risk areas)"""
    try:
        analytics = CrimeAnalytics()
        hotspots = analytics.get_hotspots()
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': hotspots,
            'count': len(hotspots)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/patterns', methods=['GET'])
def get_patterns():
    """Get crime time patterns"""
    try:
        analytics = CrimeAnalytics()
        patterns = analytics.get_time_patterns()
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': patterns
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/risk-score', methods=['GET'])
def get_risk_score():
    """Calculate risk score for a location"""
    try:
        lat = float(request.args.get('lat', 19.0760))
        lon = float(request.args.get('lon', 72.8777))
        radius = float(request.args.get('radius', 2))
        
        analytics = CrimeAnalytics()
        risk = analytics.get_risk_score(lat, lon, radius)
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': risk
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/trends', methods=['GET'])
def get_trends():
    """Get crime trends over time"""
    try:
        days = int(request.args.get('days', 30))
        
        analytics = CrimeAnalytics()
        trends = analytics.get_crime_trends(days)
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': trends
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/patrol-routes', methods=['GET'])
def get_patrol_routes():
    """Get suggested patrol routes for officers"""
    try:
        officer_count = int(request.args.get('officers', 5))
        
        analytics = CrimeAnalytics()
        routes = analytics.get_patrol_suggestions(officer_count)
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': routes,
            'count': len(routes)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
