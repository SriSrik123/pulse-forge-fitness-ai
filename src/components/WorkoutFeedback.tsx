import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquarePlus, RotateCcw } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface WorkoutFeedbackProps {
  workout: any
  onRegenerateWorkout: (feedback: string) => void
  onClose: () => void
}

export function WorkoutFeedback({ workout, onRegenerateWorkout, onClose }: WorkoutFeedbackProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [feedback, setFeedback] = useState("")
  const [feedbackType, setFeedbackType] = useState("improvement")
  const [loading, setLoading] = useState(false)

  const handleSubmitFeedback = async () => {
    if (!user || !feedback.trim()) return

    setLoading(true)
    try {
      // Save feedback to database
      const { error } = await supabase
        .from('workout_feedback')
        .insert({
          user_id: user.id,
          workout_id: null, // This is for general feedback, not tied to a specific workout
          sport: workout.sport,
          feedback_text: feedback,
          feedback_type: feedbackType
        })

      if (error) throw error

      // Regenerate workout with this feedback
      onRegenerateWorkout(feedback)
      
      toast({
        title: "Feedback Submitted",
        description: "Regenerating workout with your feedback...",
      })

      onClose()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: "Failed to submit feedback",
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
          Provide Workout Feedback
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
              <SelectItem value="improvement">Improvement Suggestion</SelectItem>
              <SelectItem value="difficulty">Difficulty Adjustment</SelectItem>
              <SelectItem value="preference">Personal Preference</SelectItem>
              <SelectItem value="general">General Feedback</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Your Feedback</label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Example: I can do 4x100s way faster than this, maybe on 1:10 intervals. Also, I prefer more backstroke in my workouts."
            className="min-h-[120px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Be specific about intervals, intensities, exercise preferences, or any adjustments you'd like to see.
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleSubmitFeedback}
            disabled={!feedback.trim() || loading}
            className="flex-1 pulse-gradient text-white"
          >
            {loading ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Regenerate Workout
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}