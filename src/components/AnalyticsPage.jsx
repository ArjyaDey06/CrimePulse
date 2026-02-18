import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, MapPin, ChevronLeft, TrendingUp } from 'lucide-react'

function AnalyticsPage({ crimeData, analytics, filteredCrimeData }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '40px 20px',
      color: '#ffffff'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <Link 
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#60a5fa',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              marginBottom: '20px',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.transform = 'translateX(-4px)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              e.currentTarget.style.transform = 'translateX(0)'
            }}
          >
            <ChevronLeft size={18} />
            Back to Map
          </Link>
          
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            margin: '20px 0 10px 0',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: '',
            backgroundClip: 'text'
          }}>
            Crime Analytics & Insights
          </h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', margin: 0 }}>
            Advanced crime data analysis and pattern detection
          </p>
        </div>

        {/* Stats Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Total Crimes</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#ffffff' }}>{crimeData.length}</div>
          </div>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Filtered Crimes</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#60a5fa' }}>{filteredCrimeData.length}</div>
          </div>
          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(20px)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Hotspots</div>
            <div style={{ fontSize: '36px', fontWeight: '700', color: '#ef4444' }}>{analytics.hotspots?.length || 0}</div>
          </div>
        </div>

        {/* Analytics Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Hotspots Section */}
          {analytics.hotspots && analytics.hotspots.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              padding: '30px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 0 24px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertTriangle size={28} color="#ef4444" />
                Crime Hotspots
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {analytics.hotspots.map((hotspot, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                    e.currentTarget.style.transform = 'translateX(8px)'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: '700',
                          color: '#60a5fa',
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(96, 165, 250, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          #{idx + 1}
                        </span>
                        <strong style={{ fontSize: '18px' }}>{hotspot.location}</strong>
                      </div>
                      <span style={{
                        background: hotspot.risk_score >= 70 ? '#ef4444' : hotspot.risk_score >= 50 ? '#f97316' : '#fbbf24',
                        color: '#000',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '700'
                      }}>
                        Risk {Math.round(hotspot.risk_score)}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                      <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Total Crimes</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#60a5fa' }}>{hotspot.crime_count}</div>
                      </div>
                      <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Critical Cases</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>{hotspot.critical_crimes}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns & Trends Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Time Patterns */}
            {analytics.patterns && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)',
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} />
                  Peak Crime Times
                </h3>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Peak Hour</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>
                    {analytics.patterns.peak_hour}:00
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>{analytics.patterns.peak_hour_count} crimes</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Peak Day</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#a78bfa' }}>
                    {analytics.patterns.peak_day}
                  </div>
                  <div style={{ fontSize: '13px', color: '#9ca3af' }}>{analytics.patterns.peak_day_count} crimes</div>
                </div>
              </div>
            )}

            {/* Trends */}
            {analytics.trends && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(20px)',
                padding: '24px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} />
                  30-Day Trend
                </h3>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Total Crimes</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffffff' }}>
                    {analytics.trends.total_crimes}
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px' }}>Trend</div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700',
                    color: analytics.trends.trend === 'increasing' ? '#ef4444' : '#22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {analytics.trends.trend === 'increasing' ? '↗' : '↘'}
                    {analytics.trends.trend} ({Math.abs(analytics.trends.change_percent)}%)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Patrol Routes */}
          {analytics.patrolRoutes && analytics.patrolRoutes.length > 0 && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              padding: '30px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 0 24px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <MapPin size={28} color="#60a5fa" />
                Patrol Priority Zones
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {analytics.patrolRoutes.map((route, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        background: '#60a5fa',
                        color: '#000',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '700'
                      }}>
                        {route.priority}
                      </span>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{route.location}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          {route.crime_count} crimes
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#60a5fa'
                    }}>
                      Risk {route.risk_score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage
