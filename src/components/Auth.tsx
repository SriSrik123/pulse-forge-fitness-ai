import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Logo } from "./Logo"

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Check if email is already registered
        const { data: existingUser } = await supabase.auth.signInWithPassword({
          email,
          password: "dummy-check"
        })
        
        if (existingUser.user) {
          throw new Error('An account with this email already exists. Please sign in instead.')
        }

        // Check if username is available
        const { data: existingUsername } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single()

        if (existingUsername) {
          throw new Error('Username is already taken')
        }

        // Send OTP for email verification
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
          }
        })

        if (error) throw error

        // Navigate to verification page with signup data
        const searchParams = new URLSearchParams({
          email,
          password,
          fullName,
          username,
        })
        navigate(`/verify-email?${searchParams.toString()}`)

        toast({
          title: "Verification code sent!",
          description: "Please check your email for the 6-digit code.",
        })
      } else {
        // Regular login with email and password
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        toast({
          title: "Welcome back to Coached!",
          description: "You have successfully signed in.",
        })
      }
    } catch (error: any) {
      // If email check fails with "Invalid login credentials", it means email doesn't exist (good for signup)
      if (isSignUp && error.message === "Invalid login credentials") {
        try {
          // Check if username is available
          const { data: existingUsername } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single()

          if (existingUsername) {
            throw new Error('Username is already taken')
          }

          // Send OTP for email verification
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: true,
            }
          })

          if (error) throw error

          // Navigate to verification page with signup data
          const searchParams = new URLSearchParams({
            email,
            password,
            fullName,
            username,
          })
          navigate(`/verify-email?${searchParams.toString()}`)

          toast({
            title: "Verification code sent!",
            description: "Please check your email for the 6-digit code.",
          })
          setLoading(false)
          return
        } catch (innerError: any) {
          toast({
            title: "Error",
            description: innerError.message,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80 p-4">
      <Card className="w-full max-w-md glass border-0">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Logo size="md" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pulse-blue to-pulse-cyan bg-clip-text text-transparent">
              Coached
            </h1>
          </div>
          <CardTitle className="text-xl">
            {isSignUp ? "Join Coached today" : "Welcome back to Coached"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isSignUp}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required={isSignUp}
                  />
                  <p className="text-xs text-muted-foreground">
                    Only lowercase letters, numbers, and underscores allowed
                  </p>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : (isSignUp ? "Join Coached" : "Sign In")}
            </Button>
          </form>

          {isSignUp && (
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">
                By signing up, you agree to our{" "}
                <a 
                  href="https://coached-fitness.vercel.app/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          )}

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "New to Coached? Sign up"
              }
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}