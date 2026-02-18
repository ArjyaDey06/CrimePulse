import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import mapboxgl from 'mapbox-gl'
import { Activity, TrendingUp, Shield, Layers, MapPin, BarChart3, Filter } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYXJqeWEyNCIsImEiOiJjbWw1ZG02MjkwMjl3M2ZyMGdpM3l3anZqIn0.amXOnuDpokBI82nJKfYUlw'
mapboxgl.accessToken = MAPBOX_TOKEN

function MapView({ crimeData, stats, loading, selectedCrimeTypes, availableCrimeTypes, toggleCrimeType, selectAllCrimeTypes, deselectAllCrimeTypes }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapStyle, setMapStyle] = useState('dark')
  const [showFilters, setShowFilters] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)

  const mapStyles = {
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    streets: 'mapbox://styles/mapbox/streets-v12',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12'
  }

  // Filter crime data based on selected types
  const filteredCrimeData = useMemo(() => {
    if (selectedCrimeTypes.size === 0) return crimeData
    return crimeData.filter(crime => 
      selectedCrimeTypes.has(crime.crime_type?.toLowerCase())
    )
  }, [crimeData, selectedCrimeTypes])

  const toggleMapStyle = () => {
    const newStyle = mapStyle === 'satellite' ? 'streets' : 'satellite'
    setMapStyle(newStyle)
    if (map.current) {
      map.current.setStyle(mapStyles[newStyle])
    }
  }

  // Update map when filters change
  useEffect(() => {
    if (mapLoaded && map.current && map.current.getSource('crimes')) {
      map.current.getSource('crimes').setData({
        type: 'FeatureCollection',
        features: filteredCrimeData.map(crime => ({
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
            weight: crime.severity_level === 'Critical' ? 4 : 
                   crime.severity_level === 'High' ? 3 : 
                   crime.severity_level === 'Medium' ? 2 : 1
          }
        }))
      })
    }
  }, [filteredCrimeData, mapLoaded])

  useEffect(() => {
    if (!mapContainer.current) {
      console.log('Map container not ready')
      return
    }
    if (map.current) {
      console.log('Map already initialized')
      return // Prevent re-initialization
    }

    console.log('Initializing map...')
    
    // Initialize map with globe projection
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyles[mapStyle],
      center: [72.8777, 19.0760],
      zoom: 3,
      pitch: 60,
      bearing: 0,
      projection: 'globe',
      minZoom: 1,
      maxZoom: 18
    })

    console.log('Map instance created:', map.current)

    // Add controls
    map.current.addControl(new mapboxgl.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: true
    }), 'top-right')

    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserLocation: true,
      showUserHeading: true
    }), 'top-right')

    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 150,
      unit: 'metric'
    }), 'bottom-left')

    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    map.current.addControl(new mapboxgl.AttributionControl({
      compact: true
    }), 'bottom-right')

    // Custom controls
    class ResetGlobeControl {
      onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
        this._container.innerHTML = `
          <button class="control-button" title="Reset to Globe View">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
            </svg>
          </button>
        `
        this._container.addEventListener('click', () => {
          map.flyTo({ center: [72.8777, 19.0760], zoom: 3, pitch: 60, bearing: 0, duration: 2000 })
        })
        return this._container
      }
      onRemove() {
        this._container.parentNode.removeChild(this._container)
        this._map = undefined
      }
    }
    map.current.addControl(new ResetGlobeControl(), 'top-right')

    class FocusMumbaiControl {
      onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
        this._container.innerHTML = `
          <button class="control-button" title="Focus on Mumbai">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </button>
        `
        this._container.addEventListener('click', () => {
          map.flyTo({ center: [72.8777, 19.0760], zoom: 11, pitch: 60, bearing: 0, duration: 2000 })
        })
        return this._container
      }
      onRemove() {
        this._container.parentNode.removeChild(this._container)
        this._map = undefined
      }
    }
    map.current.addControl(new FocusMumbaiControl(), 'top-right')

    class MapStyleControl {
      onAdd(map) {
        this._map = map
        this._container = document.createElement('div')
        this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group'
        this._container.innerHTML = `
          <button id="style-toggle-btn" class="control-button" title="Toggle Satellite/Street View">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
            </svg>
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

    setTimeout(() => {
      const styleBtn = document.getElementById('style-toggle-btn')
      if (styleBtn) {
        styleBtn.addEventListener('click', toggleMapStyle)
      }
    }, 100)

    map.current.on('style.load', () => {
      map.current.setFog({
        'horizon-blend': 0.1,
        'color': '#303036',
        'high-color': '#245cdf',
        'space-color': '#000',
        'star-intensity': 0.15
      })
    })

    map.current.on('load', () => {
      console.log('Map loaded event fired. Crime data count:', filteredCrimeData.length)
      map.current.addSource('crimes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: filteredCrimeData.map(crime => ({
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
              weight: crime.severity_level === 'Critical' ? 4 : 
                     crime.severity_level === 'High' ? 3 : 
                     crime.severity_level === 'Medium' ? 2 : 1
            }
          }))
        }
      })

      map.current.addLayer({
        id: 'crime-heatmap',
        type: 'heatmap',
        source: 'crimes',
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 0.8, 2, 1.5, 3, 2.5, 4, 4],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 2, 3, 3, 8, 4, 12, 5, 15, 6, 18, 8],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.05, 'rgba(0,255,0,0.6)', 0.15, 'rgba(50,205,50,0.7)', 0.25, 'rgba(124,252,0,0.8)',
            0.35, 'rgba(255,255,0,0.9)', 0.45, 'rgba(255,215,0,1)', 0.55, 'rgba(255,165,0,1)',
            0.65, 'rgba(255,140,0,1)', 0.75, 'rgba(255,69,0,1)',
            0.8, 'rgba(255,0,0,1)', 0.85, 'rgba(220,20,60,1)', 0.9, 'rgba(178,34,34,1)',
            0.95, 'rgba(139,0,0,1)', 1, 'rgba(100,0,0,1)'
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 25, 3, 30, 8, 40, 12, 50, 15, 60, 18, 80],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.8, 3, 0.85, 8, 0.9, 12, 0.95, 15, 1]
        }
      }, 'waterway-label')

      map.current.addLayer({
        id: 'crime-points',
        type: 'circle',
        source: 'crimes',
        minzoom: 2,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, ['*', ['get', 'weight'], 8], 5, ['*', ['get', 'weight'], 12], 10, ['*', ['get', 'weight'], 15], 15, ['*', ['get', 'weight'], 20], 18, ['*', ['get', 'weight'], 25]],
          'circle-color': ['match', ['get', 'severity'], 'Low', '#00FF00', 'Medium', '#FFD700', 'High', '#FF8C00', 'Critical', '#FF0000', '#FFFFFF'],
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 3,
          'circle-opacity': 1,
          'circle-blur': ['match', ['get', 'severity'], 'Critical', 2, 'High', 1.5, 'Medium', 1, 'Low', 0.5, 0]
        }
      })

      map.current.on('click', 'crime-points', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice()
        const props = e.features[0].properties

        const popup = new mapboxgl.Popup({ maxWidth: '340px' })
          .setLngLat(coordinates)
          .setHTML(`
            <div class="popup-content" style="max-width: 320px;">
              ${props.image_url ? `<img src="${props.image_url}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;" onerror="this.style.display='none'"/>` : ''}
              <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #ffffff; font-weight: 600;">${props.title || 'Crime Incident'}</h3>
              <div style="margin-bottom: 10px; padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
                <p style="margin: 6px 0; font-size: 13px; color: #d1d5db; display: flex; justify-content: space-between;">
                  <strong style="color: #9ca3af;">Type</strong>
                  <span style="color: #f87171; font-weight: 500;">${props.crime_type || 'N/A'}</span>
                </p>
                <p style="margin: 6px 0; font-size: 13px; color: #d1d5db; display: flex; justify-content: space-between;">
                  <strong style="color: #9ca3af;">Severity</strong>
                  <span style="color: ${props.severity === 'Critical' ? '#ef4444' : props.severity === 'High' ? '#f97316' : props.severity === 'Medium' ? '#fbbf24' : '#22c55e'}; font-weight: 600;">${props.severity || 'N/A'}</span>
                </p>
                <p style="margin: 6px 0; font-size: 13px; color: #d1d5db; display: flex; justify-content: space-between;">
                  <strong style="color: #9ca3af;">Location</strong>
                  <span style="color: #e5e7eb;">${props.location || 'N/A'}</span>
                </p>
                <p style="margin: 6px 0; font-size: 13px; color: #d1d5db; display: flex; justify-content: space-between;">
                  <strong style="color: #9ca3af;">Date</strong>
                  <span style="color: #e5e7eb;">${props.date || 'N/A'}</span>
                </p>
              </div>
              ${props.news_url ? `<a href="${props.news_url}" target="_blank" style="display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: rgba(59, 130, 246, 0.2); color: #60a5fa; text-decoration: none; border-radius: 8px; font-size: 13px;">Read Article</a>` : ''}
            </div>
          `)
          .addTo(map.current)
      })

      map.current.on('mouseenter', 'crime-points', () => {
        map.current.getCanvas().style.cursor = 'pointer'
      })
      map.current.on('mouseleave', 'crime-points', () => {
        map.current.getCanvas().style.cursor = ''
      })

      // Add 3D buildings layer with dark styling
      try {
        const layers = map.current.getStyle().layers
        const labelLayerId = layers.find(
          (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
        )?.id

        map.current.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#131314',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 1
            }
          },
          labelLayerId
        )
      } catch (error) {
        console.log('3D buildings layer not added:', error)
      }
      
      // Mark map as loaded
      console.log('Map fully loaded and ready')
      setMapLoaded(true)
    })

    return () => {
      console.log('Cleaning up map...')
      if (map.current) {
        map.current.remove()
        map.current = null
      }
      setMapLoaded(false)
    }
  }, [])

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
      {loading && (
        <div className="loading-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, background: '#000000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>Loading crime data from Mumbai...</div>
        </div>
      )}
      
      {/* Filter Panel - Right Side */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.92)',
        backdropFilter: 'blur(20px)',
        padding: showFilters ? '20px' : '16px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        maxWidth: '320px',
        zIndex: 1,
        transition: 'all 0.3s ease',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: showFilters ? '16px' : '0',
          paddingBottom: showFilters ? '12px' : '0',
          borderBottom: showFilters ? '2px solid rgba(255, 255, 255, 0.1)' : 'none',
          cursor: 'pointer'
        }} onClick={() => setShowFilters(!showFilters)}>
          <h3 style={{
            margin: 0,
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Filter size={18} />
            Crime Filters
          </h3>
          <span style={{ color: '#9ca3af', fontSize: '20px' }}>
            {showFilters ? '▼' : '▶'}
          </span>
        </div>

        {showFilters && (
          <>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <button
                onClick={selectAllCrimeTypes}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  borderRadius: '8px',
                  color: '#22c55e',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)'
                }}
              >
                Select All
              </button>
              <button
                onClick={deselectAllCrimeTypes}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
                }}
              >
                Clear All
              </button>
            </div>

            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {availableCrimeTypes.map(type => {
                const isSelected = selectedCrimeTypes.has(type)
                const count = crimeData.filter(c => c.crime_type?.toLowerCase() === type).length
                
                return (
                  <div
                    key={type}
                    onClick={() => toggleCrimeType(type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      marginBottom: '8px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      userSelect: 'none'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: `2px solid ${isSelected ? '#60a5fa' : 'rgba(255, 255, 255, 0.3)'}`,
                        background: isSelected ? '#60a5fa' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <span style={{
                        color: isSelected ? '#ffffff' : '#9ca3af',
                        fontSize: '13px',
                        fontWeight: isSelected ? '600' : '500',
                        textTransform: 'capitalize'
                      }}>
                        {type}
                      </span>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      background: isSelected ? 'rgba(96, 165, 250, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#60a5fa' : '#9ca3af',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>

            <div style={{
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '12px',
              color: '#9ca3af',
              textAlign: 'center'
            }}>
              Showing <strong style={{ color: '#60a5fa' }}>{filteredCrimeData.length}</strong> of <strong style={{ color: '#ffffff' }}>{crimeData.length}</strong> crimes
            </div>
          </>
        )}
      </div>

      {/* Stats Panel */}
      <div className="stats-panel">
        <h3>
          <Activity size={22} />
          Crime Analytics
        </h3>
        
        <div className="stat-box">
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '13px' }}>
              <Shield size={15} />
              Total
            </span>
            <strong style={{ fontSize: '18px', color: '#ffffff' }}>{filteredCrimeData.length} / {crimeData.length}</strong>
          </p>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9ca3af', fontSize: '13px' }}>
              <Layers size={15} />
              Map Style
            </span>
            <strong style={{ fontSize: '14px', color: '#ffffff' }}>{mapStyle.charAt(0).toUpperCase() + mapStyle.slice(1)}</strong>
          </p>
        </div>
        
        <div className="severity-legend">
          <h4><TrendingUp size={15} />Heatmap Intensity</h4>
          <div className="heatmap-gradient"></div>
          <div className="gradient-labels">
            <span>Safe</span><span>Low</span><span>High</span><span>Critical</span>
          </div>
          
          <div className="section-divider"></div>
          
          <h4><MapPin size={15} />Incident Markers</h4>
          {['Low', 'Medium', 'High', 'Critical'].map(severity => {
            const colors = { Low: '#22c55e', Medium: '#fbbf24', High: '#f97316', Critical: '#ef4444' }
            const count = stats?.severity_levels.find(s => s._id === severity)?.count || 0
            return (
              <div className="severity-item" key={severity}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="severity-dot" style={{ backgroundColor: colors[severity], color: colors[severity] }}></div>
                  <span>{severity} Risk</span>
                </div>
                <strong style={{ fontSize: '13px' }}>{count}</strong>
              </div>
            )
          })}
        </div>

        <Link
          to="/analytics"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '20px',
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '10px',
            color: '#60a5fa',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.5))'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <BarChart3 size={18} />
          View Detailed Analytics
        </Link>
      </div>

      <div ref={mapContainer} className="map-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} />
    </div>
  )
}

export default MapView
