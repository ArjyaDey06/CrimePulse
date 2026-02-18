import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, ArrowLeft } from "lucide-react"

export default function AuthPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentView, setCurrentView] = useState("login")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (currentView === "register") {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long")
        return
      }
    }

    if (currentView === "forgot") {
      setError("Password reset functionality coming soon!")
      return
    }

    setLoading(true)

    try {
      const endpoint = currentView === "login" ? "/api/auth/login" : "/api/auth/register"
      const response = await axios.post(`http://localhost:5000${endpoint}`, {
        email: formData.email,
        password: formData.password,
        name: formData.name
      })

      if (response.data.success) {
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
        onLogin(response.data.user, response.data.token)
        navigate("/")
      }
    } catch (err) {
      setError(err.response?.data?.error || `${currentView === "login" ? "Login" : "Registration"} failed. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ backgroundColor: "#667eea" }}>
        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
              <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: "#667eea" }}>
                <svg viewBox="0 0 24 24" fill="white" className="w-full h-full p-1">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white">CrimePulse</h1>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl text-white mb-6 leading-tight font-bold">
              Real-time Crime Analytics & Monitoring
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              Access comprehensive crime data visualization, analytics, and insights to make informed decisions for public safety.
            </p>
          </div>

          <div className="flex justify-between items-center text-white/70 text-sm">
            <span>© 2026 CrimePulse. All rights reserved.</span>
            <span className="cursor-pointer hover:text-white/90 transition-colors">Privacy Policy</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: "#667eea" }}
            >
              <div className="w-6 h-6 bg-white rounded-sm"></div>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#667eea" }}>CrimePulse</h1>
          </div>

          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 text-center relative">
              {currentView === "forgot" && (
                <Button
                  variant="ghost"
                  onClick={() => setCurrentView("login")}
                  className="absolute left-0 top-0 p-2 hover:bg-gray-100 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <h2 className="text-3xl font-bold text-gray-900">
                {currentView === "login" && "Welcome Back"}
                {currentView === "register" && "Create Account"}
                {currentView === "forgot" && "Reset Password"}
              </h2>
              <p className="text-gray-600">
                {currentView === "login" && "Sign in to access crime analytics and insights"}
                {currentView === "register" && "Create your account to get started with CrimePulse"}
                {currentView === "forgot" && "Enter your email address and we'll send you a reset link"}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {currentView === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-900">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#667eea]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-12 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#667eea]"
                />
              </div>

              {currentView !== "forgot" && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#667eea]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {currentView === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="h-12 pr-10 border-gray-200 focus:ring-0 shadow-none rounded-lg bg-white focus:border-[#667eea]"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {currentView === "login" && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="rounded border-gray-300 cursor-pointer h-4 w-4"
                      style={{ accentColor: "#667eea" }}
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                      Remember Me
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm hover:text-opacity-80 cursor-pointer"
                    style={{ color: "#667eea" }}
                    onClick={() => setCurrentView("forgot")}
                  >
                    Forgot Password?
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-sm font-medium text-white hover:opacity-90 rounded-lg shadow-none cursor-pointer transition-opacity"
                style={{ backgroundColor: "#667eea" }}
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    {currentView === "login" && "Log In"}
                    {currentView === "register" && "Create Account"}
                    {currentView === "forgot" && "Send Reset Link"}
                  </>
                )}
              </Button>
            </form>

            {currentView !== "forgot" && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">
                      Or {currentView === "login" ? "Login" : "Sign Up"} With
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg bg-white shadow-none cursor-pointer"
                    onClick={() => setError("Google sign-in coming soon!")}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 border-gray-200 hover:bg-gray-50 hover:text-gray-900 rounded-lg bg-white shadow-none cursor-pointer"
                    onClick={() => setError("Apple sign-in coming soon!")}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.96 3.64-.82 1.57.06 2.75.63 3.54 1.51-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Apple
                  </Button>
                </div>
              </>
            )}

            <div className="text-center text-sm text-gray-600">
              {currentView === "login" && (
                <>
                  Don't Have An Account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer"
                    style={{ color: "#667eea" }}
                    onClick={() => setCurrentView("register")}
                  >
                    Register Now
                  </Button>
                </>
              )}
              {currentView === "register" && (
                <>
                  Already Have An Account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer"
                    style={{ color: "#667eea" }}
                    onClick={() => setCurrentView("login")}
                  >
                    Sign In
                  </Button>
                </>
              )}
              {currentView === "forgot" && (
                <>
                  Remember Your Password?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-sm hover:text-opacity-80 font-medium cursor-pointer"
                    style={{ color: "#667eea" }}
                    onClick={() => setCurrentView("login")}
                  >
                    Back to Login
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
