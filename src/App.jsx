import { useState, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import axios from 'axios'
import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'


mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY

function App() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [crimeData, setCrimeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [mapStyle, setMapStyle] = useState('streets')

  const mapStyles = {
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    streets: 'mapbox://styles/mapbox/streets-v12',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12'
  }

  const toggleMapStyle = () => {
    const newStyle = mapStyle === 'satellite' ? 'streets' : 'satellite'
    setMapStyle(newStyle)
    if (map.current) {
      map.current.setStyle(mapStyles[newStyle])
    }
    
    // Update button icon
    const button = document.getElementById('style-toggle-btn')
    if (button) {
      button.innerHTML = newStyle === 'satellite' ? '🛰️' : '🏙️'
    }
  }

  useEffect(() => {
    // Fetch crime data from API
    const fetchData = async () => {
      try {
        const [crimeResponse, statsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/crime-data'),
          axios.get('http://localhost:5000/api/stats')
        ])
        
        setCrimeData(crimeResponse.data.data)
        setStats(statsResponse.data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (!mapContainer.current || crimeData.length === 0) return

    // Initialize map with globe projection
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyles[mapStyle],
      center: [72.8777, 19.0760], // Mumbai center
      zoom: 3, // Start with global view
      pitch: 60, // 60-degree tilt
      bearing: 0,
      projection: 'globe', // Enable globe projection
      minZoom: 1,
      maxZoom: 18
    })

    // Add all available Mapbox controls
    // 1. Navigation Control (zoom + rotation)
    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: true
    }), 'top-right')

    // 2. Geolocate Control (find user location)
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserLocation: true,
      showUserHeading: true
    }), 'top-right')

    // 3. Scale Control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 150,
      unit: 'metric'
    }), 'bottom-left')

    // 4. Fullscreen Control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    // 5. Attribution Control (move to bottom)
    map.current.addControl(new mapboxgl.AttributionControl({
      compact: true
    }), 'bottom-right')

    // Add custom controls for enhanced functionality
    // 6. Reset Globe View Button
    class ResetGlobeControl {
      onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
        this._container.innerHTML = `
          <button style="
            background: white;
            border: none;
            border-radius: 4px;
            padding: 8px;
            cursor: pointer;
            font-size: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          " title="Reset to Globe View">
            🌍
          </button>
        `
        this._container.addEventListener('click', () => {
          map.flyTo({
            center: [72.8777, 19.0760],
            zoom: 3,
            pitch: 60,
            bearing: 0,
            duration: 2000
          })
        })
        return this._container
      }
      onRemove() {
        this._container.parentNode.removeChild(this._container)
        this._map = undefined
      }
    }
    map.current.addControl(new ResetGlobeControl(), 'top-right')

    // 7. Focus Mumbai Button
    class FocusMumbaiControl {
      onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
        this._container.innerHTML = `
          <button style="
            background: white;
            border: none;
            border-radius: 4px;
            padding: 8px;
            cursor: pointer;
            font-size: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          " title="Focus on Mumbai">
            🎯
          </button>
        `
        this._container.addEventListener('click', () => {
          map.flyTo({
            center: [72.8777, 19.0760],
            zoom: 11,
            pitch: 60,
            bearing: 0,
            duration: 2000
          })
        })
        return this._container
      }
      onRemove() {
        this._container.parentNode.removeChild(this._container)
        this._map = undefined
      }
    }
    map.current.addControl(new FocusMumbaiControl(), 'top-right')

    // 8. Map Style Toggle Control
    class MapStyleControl {
      onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
        this._container.innerHTML = `
          <button id="style-toggle-btn" style="
            background: white;
            border: none;
            border-radius: 4px;
            padding: 8px;
            cursor: pointer;
            font-size: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          " title="Toggle Satellite/Street View">
            🛰️
          </button>
        `
        return this._container
      }
      onRemove() {
        this._container.parentNode.removeChild(this._container)
        this._map = undefined
      }
    }
    map.current.addControl(new MapStyleControl(), 'top-right')

    // Add click handler for style toggle
    document.getElementById('style-toggle-btn').addEventListener('click', toggleMapStyle)

    // Add atmosphere effect for globe
    map.current.on('style.load', () => {
      map.current.setFog({
        'horizon-blend': 0.1,
        'color': 'white',
        'high-color': '#245cdf',
        'space-color': '#000000',
        'star-intensity': 0.15
      })
    })

    // Wait for map to load before adding data
    map.current.on('load', () => {
      // Add crime data as source
      map.current.addSource('crimes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: crimeData.map(crime => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [crime.longitude, crime.latitude]
            },
            properties: {
              id: crime.fir_number,
              crime_type: crime.crime_type,
              severity: crime.severity_level,
              date: crime.incident_date,
              title: crime.title,
              description: crime.description,
              image_url: crime.image_url,
              location: crime.location,
              source: crime.source,
              news_url: crime.news_url,
              // Weight crimes by severity for heatmap intensity
              weight: crime.severity_level === 'Critical' ? 4 : 
                     crime.severity_level === 'High' ? 3 : 
                     crime.severity_level === 'Medium' ? 2 : 1
            }
          }))
        }
      })

      // Add advanced multi-colored heatmap layer
      map.current.addLayer({
        id: 'crime-heatmap',
        type: 'heatmap',
        source: 'crimes',
        paint: {
          // Weight by crime severity for more realistic heatmap
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'weight'],
            0, 0,
            1, 0.8,
            2, 1.5,
            3, 2.5,
            4, 4
          ],
          // Significantly increased heatmap intensity for better visibility
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            3, 3,
            8, 4,
            12, 5,
            15, 6,
            18, 8
          ],
          // Advanced multi-color gradient for crime severity with enhanced opacity
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            // No density - transparent
            0, 'rgba(0,0,0,0)',
            // Low density - bright green (safe areas)
            0.05, 'rgba(0,255,0,0.6)',
            0.15, 'rgba(50,205,50,0.7)',
            0.25, 'rgba(124,252,0,0.8)',
            // Medium density - yellow (moderate risk)
            0.35, 'rgba(255,255,0,0.9)',
            0.45, 'rgba(255,215,0,1)',
            0.55, 'rgba(255,165,0,1)',
            // High density - orange (high risk)
            0.65, 'rgba(255,140,0,1)',
            0.75, 'rgba(255,69,0,1)',
            // Critical density - red to dark red (danger zones)
            0.8, 'rgba(255,0,0,1)',
            0.85, 'rgba(220,20,60,1)',
            0.9, 'rgba(178,34,34,1)',
            0.95, 'rgba(139,0,0,1)',
            1, 'rgba(100,0,0,1)'
          ],
          // Significantly larger radius for better visibility at all zoom levels
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 25,
            3, 30,
            8, 40,
            12, 50,
            15, 60,
            18, 80
          ],
          // Enhanced opacity for better visibility
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.8,
            3, 0.85,
            8, 0.9,
            12, 0.95,
            15, 1
          ]
        }
      }, 'waterway-label')

      // Add 3D extrusion layer for buildings at high zoom (optional enhancement)
      map.current.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, 0,
            15.05, ['get', 'height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      })

      // Add individual crime points with enhanced visibility at all zoom levels
      map.current.addLayer({
        id: 'crime-points',
        type: 'circle',
        source: 'crimes',
        minzoom: 2, // Show points much earlier
        paint: {
          // Larger base sizes for better visibility
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            2, ['*', ['get', 'weight'], 8],
            5, ['*', ['get', 'weight'], 12],
            10, ['*', ['get', 'weight'], 15],
            15, ['*', ['get', 'weight'], 20],
            18, ['*', ['get', 'weight'], 25]
          ],
          // Multi-color based on severity with enhanced visibility
          'circle-color': [
            'match',
            ['get', 'severity'],
            'Low', '#00FF00',
            'Medium', '#FFD700',
            'High', '#FF8C00',
            'Critical', '#FF0000',
            '#FFFFFF'
          ],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 3,
          'circle-opacity': 1,
          // Enhanced glow effect for all crimes
          'circle-blur': [
            'match',
            ['get', 'severity'],
            'Critical', 2,
            'High', 1.5,
            'Medium', 1,
            'Low', 0.5,
            0
          ]
        }
      })

      // Add large Google-style location labels
      const locations = [
        { name: 'Mumbai', coordinates: [72.8777, 19.0760], zoom: [1, 18] },
        { name: 'Delhi', coordinates: [77.2090, 28.6139], zoom: [1, 8] },
        { name: 'Bangalore', coordinates: [77.5946, 12.9716], zoom: [1, 8] },
        { name: 'Kolkata', coordinates: [88.3639, 22.5726], zoom: [1, 8] },
        { name: 'Chennai', coordinates: [80.2707, 13.0827], zoom: [1, 8] },
        { name: 'Hyderabad', coordinates: [78.4867, 17.3850], zoom: [1, 8] },
        { name: 'Ahmedabad', coordinates: [72.5714, 23.0225], zoom: [1, 6] },
        { name: 'Pune', coordinates: [73.8567, 18.5204], zoom: [3, 12] },
        { name: 'Nagpur', coordinates: [79.0882, 21.1458], zoom: [3, 10] },
        { name: 'Jaipur', coordinates: [75.7873, 26.9124], zoom: [3, 8] },
        { name: 'Lucknow', coordinates: [80.9462, 26.8467], zoom: [3, 8] },
        { name: 'Surat', coordinates: [72.8311, 21.1702], zoom: [3, 10] },
        { name: 'Andheri', coordinates: [72.8355, 19.1183], zoom: [8, 18] },
        {name: 'Bandra', coordinates: [72.8392, 19.0612], zoom: [8, 18] },
        { name: 'Borivali', coordinates: [72.8567, 19.2333], zoom: [8, 18] },
        { name: 'Chembur', coordinates: [72.9087, 19.0511], zoom: [8, 18] },
        { name: 'Dahisar', coordinates: [72.8446, 19.2524], zoom: [8, 18] },
        { name: 'Ghatkopar', coordinates: [72.9087, 19.0815], zoom: [8, 18] },
        { name: 'Jogeshwari', coordinates: [72.8446, 19.1447], zoom: [8, 18] },
        { name: 'Kandivali', coordinates: [72.8333, 19.2083], zoom: [8, 18] },
        { name: 'Malwani', coordinates: [72.8000, 19.2333], zoom: [8, 18] },
        { name: 'Mulund', coordinates: [72.9583, 19.1750], zoom: [8, 18] },
        { name: 'Oshiwara', coordinates: [72.8250, 19.1333], zoom: [8, 18] },
        { name: 'Powai', coordinates: [72.9064, 19.1244], zoom: [8, 18] },
        { name: 'Vakola', coordinates: [72.8250, 19.0850], zoom: [8, 18] }
      ]

      // Add location labels as symbols
      locations.forEach((location, index) => {
        map.current.addLayer({
          id: `location-label-${index}`,
          type: 'symbol',
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: location.coordinates
                },
                properties: {
                  name: location.name,
                  title: location.name
                }
              }]
            }
          },
          minzoom: location.zoom[0],
          maxzoom: location.zoom[1],
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Arial Black', 'Arial Unicode MS Bold', 'Microsoft YaHei', 'SimHei', 'sans-serif'],
            'text-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              location.zoom[0], location.zoom[0] <= 3 ? 24 : location.zoom[0] <= 6 ? 18 : 14,
              location.zoom[0] + 2, location.zoom[0] <= 3 ? 32 : location.zoom[0] <= 6 ? 24 : 18,
              location.zoom[0] + 4, location.zoom[0] <= 3 ? 40 : location.zoom[0] <= 6 ? 30 : 22,
              location.zoom[1], location.zoom[0] <= 3 ? 48 : location.zoom[0] <= 6 ? 36 : 28
            ],
            'text-max-width': 10,
            'text-letter-spacing': 0.05,
            'text-anchor': 'center',
            'text-justify': 'center',
            'text-offset': [0, -0.5],
            'text-allow-overlap': false,
            'text-ignore-placement': false,
            'visibility': 'visible'
          },
          paint: {
            'text-color': location.name === 'Mumbai' ? '#FFFFFF' : '#FFFFFF',
            'text-halo-color': location.name === 'Mumbai' ? '#FF0000' : '#000000',
            'text-halo-width': location.name === 'Mumbai' ? 4 : 3,
            'text-halo-blur': 0.5,
            'text-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              location.zoom[0], 0.7,
              location.zoom[0] + 2, 0.8,
              location.zoom[0] + 4, 0.9,
              location.zoom[1], 1
            ]
          }
        })
      })

      // Add Mumbai city boundary highlight
      map.current.addLayer({
        id: 'mumbai-highlight',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [72.8777, 19.0760]
              },
              properties: {}
            }]
          }
        },
        minzoom: 1,
        maxzoom: 8,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1, 80,
            3, 120,
            5, 150,
            8, 200
          ],
          'circle-color': 'rgba(255,0,0,0.1)',
          'circle-stroke-color': '#FF0000',
          'circle-stroke-width': 3,
          'circle-opacity': 0.3
        }
      })

      // Add popup on click for crime points
      map.current.on('click', 'crime-points', (e) => showPopup(e))

      // Change cursor on hover for crime points
      map.current.on('mouseenter', 'crime-points', () => {
        map.current.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', 'crime-points', () => {
        map.current.getCanvas().style.cursor = ''
      })
    })

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [crimeData])

  const showPopup = (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice()
    const properties = e.features[0].properties

    // Create popup HTML with image and news article details
    const popupHTML = `
      <div class="popup-content" style="max-width: 320px; font-family: Arial, sans-serif;">
        ${properties.image_url ? `
          <img 
            src="${properties.image_url}" 
            alt="Crime scene" 
            style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;"
            onerror="this.style.display='none'"
          />
        ` : ''}
        
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333; line-height: 1.3;">
          ${properties.title || 'Crime Incident'}
        </h3>
        
        <div style="margin-bottom: 8px; padding: 8px; background: #f5f5f5; border-radius: 6px;">
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>🚨 Crime Type:</strong> <span style="color: #d32f2f;">${properties.crime_type || 'N/A'}</span>
          </p>
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>⚠️ Severity:</strong> <span style="color: ${
              properties.severity === 'Critical' ? '#d32f2f' : 
              properties.severity === 'High' ? '#ff8c00' : 
              properties.severity === 'Medium' ? '#ffd700' : '#00ff00'
            };">${properties.severity || 'N/A'}</span>
          </p>
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>📍 Location:</strong> ${properties.location || 'N/A'}
          </p>
          <p style="margin: 4px 0; font-size: 13px;">
            <strong>📅 Date:</strong> ${properties.date || 'N/A'}
          </p>
          ${properties.source ? `
            <p style="margin: 4px 0; font-size: 13px;">
              <strong>📰 Source:</strong> ${properties.source}
            </p>
          ` : ''}
        </div>
        
        ${properties.description ? `
          <p style="margin: 10px 0; font-size: 13px; color: #555; line-height: 1.4; max-height: 80px; overflow-y: auto;">
            ${properties.description.substring(0, 200)}${properties.description.length > 200 ? '...' : ''}
          </p>
        ` : ''}
        
        ${properties.news_url ? `
          <a 
            href="${properties.news_url}" 
            target="_blank" 
            rel="noopener noreferrer"
            style="
              display: inline-block; 
              margin-top: 10px; 
              padding: 8px 16px; 
              background: #1976d2; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px; 
              font-size: 13px;
              font-weight: 500;
              transition: background 0.3s;
            "
            onmouseover="this.style.background='#1565c0'"
            onmouseout="this.style.background='#1976d2'"
          >
            📖 Read Full Article →
          </a>
        ` : ''}
      </div>
    `

    new mapboxgl.Popup({ maxWidth: '340px' })
      .setLngLat(coordinates)
      .setHTML(popupHTML)
      .addTo(map.current)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading crime data from Mumbai...</div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      {/* Stats Panel */}
      <div className="stats-panel">
        <h3> Global Crime Heatmap</h3>
        <p>Total Incidents: <strong>{crimeData.length}</strong></p>
        <p>Map Style: <strong>{mapStyle.charAt(0).toUpperCase() + mapStyle.slice(1)}</strong></p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Globe View |  Atmosphere Effect |  Click map button to change style
        </p>
        
        {stats && (
          <>
            <h4>Severity Breakdown:</h4>
            {stats.severity_levels.map(stat => (
              <p key={stat._id}>
                {stat._id}: <strong>{stat.count}</strong>
              </p>
            ))}
          </>
        )}
        
        <div className="severity-legend">
          <h4>🔥 Crime Intensity Heatmap:</h4>
          
          {/* Advanced gradient legend */}
          <div style={{
            height: '20px',
            borderRadius: '10px',
            background: 'linear-gradient(to right, #00FF00, #32CD32, #7CFC00, #FFFF00, #FFD700, #FFA500, #FF8C00, #FF0000, #DC143C, #B22222, #8B0000)',
            marginBottom: '15px',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}></div>
          
          <div style={{ fontSize: '11px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>🟢 Safe</span>
              <span>🟡 Moderate</span>
              <span>🟠 High Risk</span>
              <span>🔴 Critical</span>
            </div>
          </div>
          
          <h4>🎮 Map Controls:</h4>
          <div style={{ fontSize: '11px', color: '#555', lineHeight: '1.4' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>🧭 Navigation:</strong><br/>
              • Zoom in/out buttons<br/>
              • Compass rotation<br/>
              • Pitch visualization
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>📍 Location:</strong><br/>
              • Find my location<br/>
              • Track user position
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>🌍 Custom:</strong><br/>
              • 🌍 Reset to globe view<br/>
              • 🎯 Focus on Mumbai<br/>
              • 🗺️ Toggle map style
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>🔧 Other:</strong><br/>
              • Scale indicator<br/>
              • Fullscreen mode<br/>
              • Attribution info
            </div>
          </div>
          
          <h4>📍 Crime Point Indicators:</h4>
          <div className="severity-item">
            <div className="severity-dot" style={{ 
              backgroundColor: '#00FF00', 
              boxShadow: '0 0 8px rgba(0,255,0,0.5)' 
            }}></div>
            Low Severity Crimes
          </div>
          <div className="severity-item">
            <div className="severity-dot" style={{ 
              backgroundColor: '#FFD700',
              boxShadow: '0 0 8px rgba(255,215,0,0.5)' 
            }}></div>
            Medium Severity Crimes
          </div>
          <div className="severity-item">
            <div className="severity-dot" style={{ 
              backgroundColor: '#FF8C00',
              boxShadow: '0 0 8px rgba(255,140,0,0.5)' 
            }}></div>
            High Severity Crimes
          </div>
          <div className="severity-item">
            <div className="severity-dot" style={{ 
              backgroundColor: '#FF0000',
              boxShadow: '0 0 12px rgba(255,0,0,0.8)'
            }}></div>
            Critical Crimes
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            borderRadius: '8px',
            fontSize: '11px',
            color: '#555'
          }}>
            <strong>🏙️ Location Labels:</strong><br/>
            • Google-style large city names<br/>
            • Mumbai highlighted in red<br/>
            • Major cities visible globally<br/>
            • Local areas visible when zoomed<br/>
            • Dynamic font sizing by zoom<br/>
            • White text with dark halos
          </div>
          
          <div style={{ 
            marginTop: '10px', 
            padding: '10px', 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            borderRadius: '8px',
            fontSize: '11px',
            color: '#555'
          }}>
            <strong>💡 Enhanced Visibility:</strong><br/>
            • Crime points visible from zoom 2<br/>
            • Critical crimes visible globally<br/>
            • Larger heatmap radius (25-80px)<br/>
            • Enhanced intensity & opacity<br/>
            • 3D buildings at high zoom
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainer} className="map-container" />
    </div>
  )
}

export default App
