import { useState, useEffect, useMemo } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import MapView from './components/MapView'
import AnalyticsPage from './components/AnalyticsPage'
import AuthPage from './components/AuthPage'
import LandingPage from './components/LandingPage'
import ProfilePage from './components/ProfilePage'
import Dock from './components/Dock'
import { Home, Map, BarChart3, User } from 'lucide-react'
import './App.css'

// Protected Route Component
function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/auth" replace />
}

// Navigation Dock Component
function NavigationDock({ onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const items = [
    { 
      icon: <Home size={18} />, 
      label: 'Home', 
      onClick: () => navigate('/map') 
    },
    { 
      icon: <Map className='text-white' size={18} />, 
      label: 'Map', 
      onClick: () => navigate('/map') 
    },
    { 
      icon: <BarChart3 size={18} />, 
      label: 'Analytics', 
      onClick: () => navigate('/analytics') 
    },
    { 
      icon: <User size={18} />, 
      label: 'Profile', 
      onClick: () => navigate('/profile') 
    },
  ]

  return (
    <div className="dock-container">
      <Dock 
        items={items}
        panelHeight={60}
        baseItemSize={50}
        magnification={70}
      />
    </div>
  )
}

function App() {
  const [crimeData, setCrimeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState({
    hotspots: [],
    patterns: null,
    trends: null,
    patrolRoutes: []
  })
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState(new Set())
  const [lastFetchTime, setLastFetchTime] = useState(new Date().toISOString())
  
  // Authentication state
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
      
      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
  }, [])

  // Handle login
  const handleLogin = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    setIsAuthenticated(true)
    
    // Set axios default authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    
    // Remove axios authorization header
    delete axios.defaults.headers.common['Authorization']
  }

  // Get unique crime types from data
  const availableCrimeTypes = useMemo(() => {
    const types = new Set()
    crimeData.forEach(crime => {
      if (crime.crime_type) {
        types.add(crime.crime_type.toLowerCase())
      }
    })
    return Array.from(types).sort()
  }, [crimeData])

  // Initialize selected crime types when data loads
  useEffect(() => {
    if (availableCrimeTypes.length > 0 && selectedCrimeTypes.size === 0) {
      setSelectedCrimeTypes(new Set(availableCrimeTypes))
    }
  }, [availableCrimeTypes])

  // Filter crime data based on selected types
  const filteredCrimeData = useMemo(() => {
    if (selectedCrimeTypes.size === 0) return crimeData
    return crimeData.filter(crime => 
      selectedCrimeTypes.has(crime.crime_type?.toLowerCase())
    )
  }, [crimeData, selectedCrimeTypes])

  // Toggle crime type selection
  const toggleCrimeType = (type) => {
    setSelectedCrimeTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  // Select all crime types
  const selectAllCrimeTypes = () => {
    setSelectedCrimeTypes(new Set(availableCrimeTypes))
  }

  // Deselect all crime types
  const deselectAllCrimeTypes = () => {
    setSelectedCrimeTypes(new Set())
  }

  const fetchAnalytics = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
      const [hotspotsRes, patternsRes, trendsRes, patrolRes] = await Promise.all([
        axios.get(`${API_URL}/api/analytics/hotspots`),
        axios.get(`${API_URL}/api/analytics/patterns`),
        axios.get(`${API_URL}/api/analytics/trends?days=30`),
        axios.get(`${API_URL}/api/analytics/patrol-routes?officers=5`)
      ])
      
      setAnalytics({
        hotspots: hotspotsRes.data.data || [],
        patterns: patternsRes.data.data || null,
        trends: trendsRes.data.data || null,
        patrolRoutes: patrolRes.data.data || []
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  useEffect(() => {
    // Fetch crime data from API
    const fetchData = async () => {
      try {
        console.log('Fetching crime data...')
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const [crimeResponse, statsResponse] = await Promise.all([
          axios.get(`${API_URL}/api/crime-data`),
          axios.get(`${API_URL}/api/stats`)
        ])
        
        console.log('Crime data received:', crimeResponse.data.data.length, 'crimes')
        setCrimeData(crimeResponse.data.data)
        setStats(statsResponse.data)
        setLoading(false)
        
        // Fetch analytics after initial data load
        fetchAnalytics()
      } catch (error) {
        console.error('Error fetching data:', error)
        // Set loading to false even on error so map can render
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Poll for new data every 60 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const response = await axios.get(`${API_URL}/api/crime-data/new?since=${lastFetchTime}`)
        
        if (response.data.success && response.data.data.length > 0) {
          const newCrimes = response.data.data
          console.log(`🆕 Found ${newCrimes.length} new crime(s)`)
          
          setCrimeData(prev => [...newCrimes, ...prev])
          
          const statsResponse = await axios.get(`${API_URL}/api/stats`)
          setStats(statsResponse.data)
          
          fetchAnalytics()
          setLastFetchTime(response.data.timestamp)
        }
      } catch (error) {
        console.error('Error fetching new data:', error)
      }
    }, 60000) // 60 seconds

    return () => clearInterval(pollInterval)
  }, [lastFetchTime])

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/map" replace />
            ) : (
              <LandingPage />
            )
          } 
        />
        <Route 
          path="/auth" 
          element={
            isAuthenticated ? <Navigate to="/map" replace /> : <AuthPage onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/login" 
          element={<Navigate to="/auth" replace />} 
        />
        <Route 
          path="/signup" 
          element={<Navigate to="/auth" replace />} 
        />
        <Route 
          path="/map" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <MapView 
                crimeData={crimeData}
                stats={stats}
                loading={loading}
                selectedCrimeTypes={selectedCrimeTypes}
                availableCrimeTypes={availableCrimeTypes}
                toggleCrimeType={toggleCrimeType}
                selectAllCrimeTypes={selectAllCrimeTypes}
                deselectAllCrimeTypes={deselectAllCrimeTypes}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AnalyticsPage 
                crimeData={crimeData}
                analytics={analytics}
                filteredCrimeData={filteredCrimeData}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <ProfilePage 
                user={user}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          } 
        />
      </Routes>
      {isAuthenticated && <NavigationDock onLogout={handleLogout} />}
    </Router>
  )
}

export default App
