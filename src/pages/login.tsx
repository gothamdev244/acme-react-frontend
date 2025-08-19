import { useState } from 'react'
import { useAuth } from '../contexts/auth-context'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Loader2, Lock, Mail, Shield, TrendingUp, Users, Headphones } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (!success) {
        setError('Invalid email or password. Try agent@hsbc.com / demo123')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('agent@hsbc.com')
    setPassword('demo123')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
            src="/hsbc-logo.png" 
            alt="HSBC" 
            className="h-8 w-auto"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="hidden md:block space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                HSBC Contact Center
              </h1>
              <p className="text-xl text-gray-600">
                AI-Powered Agent Support Platform
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-red-100 p-3">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Smart Call Assistance
                  </h3>
                  <p className="text-sm text-gray-600">
                    Get instant customer mood insights and call summaries powered by AI
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-red-100 p-3">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Enhanced Customer Service
                  </h3>
                  <p className="text-sm text-gray-600">
                    Deliver exceptional banking support with intelligent recommendations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-red-100 p-3">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Secure & Compliant
                  </h3>
                  <p className="text-sm text-gray-600">
                    Bank-grade security with full regulatory compliance
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-red-100 p-3">
                  <Headphones className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Instant Updates
                  </h3>
                  <p className="text-sm text-gray-600">
                    Real-time call information delivered instantly to your screen
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Trusted by over 10,000 agents worldwide
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div>
            <Card className="w-full max-w-md mx-auto shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                <CardDescription>
                  Sign in to your HSBC agent account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="agent@hsbc.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <div className="mt-6 space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Demo Accounts
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fillDemoCredentials()}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Use Demo Account
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Demo account: agent@hsbc.com / demo123
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 text-center">
                <div className="text-xs text-muted-foreground">
                  By signing in, you agree to HSBC's Terms of Service and Privacy Policy
                </div>
                <div className="text-xs text-muted-foreground">
                  © 2025 HSBC Holdings plc. All rights reserved.
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
