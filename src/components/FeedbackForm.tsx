import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquarePlus, Send } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface FeedbackFormProps {
  onClose?: () => void
}

export function FeedbackForm({ onClose }: FeedbackFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [feedback, setFeedback] = useState("")
  const [feedbackType, setFeedbackType] = useState("general")
  const [loading, setLoading] = useState(false)

  const handleSubmitFeedback = async () => {
    if (!user || !feedback.trim()) return

    setLoading(true)
    try {
      // Send feedback via edge function
      const { error } = await supabase.functions.invoke('send-feedback', {
        body: {
          feedback: feedback.trim(),
          feedbackType,
          userEmail: user.email,
          userId: user.id
        }
      })

      if (error) throw error
      
      toast({
        title: "Feedback Sent",
        description: "Thank you for your feedback! We'll review it and get back to you.",
      })

      setFeedback("")
      onClose?.()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-pulse-blue" />
          Send Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Feedback Type</label>
          <Select value={feedbackType} onValueChange={setFeedbackType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Feedback</SelectItem>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
              <SelectItem value="improvement">Improvement Suggestion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Your Feedback</label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think! We'd love to hear your thoughts, suggestions, or any issues you've encountered."
            className="min-h-[120px]"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSubmitFeedback}
            disabled={!feedback.trim() || loading}
            className="flex-1 pulse-gradient text-white"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Feedback
              </>
            )}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}