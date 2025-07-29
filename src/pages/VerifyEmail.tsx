import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Logo } from "@/components/Logo"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export default function VerifyEmail() {
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Get the signup data from URL params
    const emailParam = searchParams.get("email")
    const passwordParam = searchParams.get("password")
    const fullNameParam = searchParams.get("fullName")
    const usernameParam = searchParams.get("username")

    if (!emailParam) {
      navigate("/")
      return
    }

    setEmail(emailParam)
    setPassword(passwordParam || "")
    setFullName(fullNameParam || "")
    setUsername(usernameParam || "")
  }, [searchParams, navigate])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First verify the OTP
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email'
      })

      if (verifyError) throw verifyError

      // If verification is successful, now create the account with password
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username,
          }
        }
      })

      if (signUpError) throw signUpError

      toast({
        title: "Account verified!",
        description: "Welcome to Coached! Your account has been created successfully.",
      })

      navigate("/")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      })

      if (error) throw error

      toast({
        title: "Code resent!",
        description: "Please check your email for the new verification code.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
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
            Verify your email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                We sent a 6-digit code to {email}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-center block">Enter verification code</Label>
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? "Verifying..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            <Button
              variant="link"
              onClick={() => navigate("/")}
              className="text-sm"
            >
              Back to signup
            </Button>
            <div>
              <Button
                variant="link"
                onClick={handleResendCode}
                className="text-sm"
                disabled={loading}
              >
                Resend code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}