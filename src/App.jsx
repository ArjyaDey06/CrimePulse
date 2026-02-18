import { useState, useEffect, useMemo } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import MapView from './components/MapView'
import AnalyticsPage from './components/AnalyticsPage'
import AuthPage from './components/AuthPage'
import { MapPin, BarChart3, LogOut, User } from 'lucide-react'
import './App.css'

// Protected Route Component
function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/auth" replace />
}

// Header Component with User Info
function Header({ user, onLogout }) {
  const navigate = useNavigate()
  
  if (!user) return null
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-1000 border-b border-gray-200">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#667eea" }}>
              <div className="w-6 h-6 rounded-sm bg-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="#667eea" className="w-full h-full p-1">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-linear-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
              CrimePulse
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 font-medium text-sm"
            >
              <MapPin className="w-4 h-4" />
              Map View
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 font-medium text-sm"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user.name || user.email}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium text-sm transition-all duration-300 hover:opacity-90 hover:shadow-lg active:scale-95"
              style={{ backgroundColor: "#667eea" }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
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
      const [hotspotsRes, patternsRes, trendsRes, patrolRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/hotspots'),
        axios.get('http://localhost:5000/api/analytics/patterns'),
        axios.get('http://localhost:5000/api/analytics/trends?days=30'),
        axios.get('http://localhost:5000/api/analytics/patrol-routes?officers=5')
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
        const [crimeResponse, statsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/crime-data'),
          axios.get('http://localhost:5000/api/stats')
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
        const response = await axios.get(`http://localhost:5000/api/crime-data/new?since=${lastFetchTime}`)
        
        if (response.data.success && response.data.data.length > 0) {
          const newCrimes = response.data.data
          console.log(`🆕 Found ${newCrimes.length} new crime(s)`)
          
          setCrimeData(prev => [...newCrimes, ...prev])
          
          const statsResponse = await axios.get('http://localhost:5000/api/stats')
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
      <Header user={user} onLogout={handleLogout} />
      <Routes>
        <Route 
          path="/auth" 
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <AuthPage onLogin={handleLogin} />
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
          path="/" 
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
      </Routes>
    </Router>
  )
}

export default App
