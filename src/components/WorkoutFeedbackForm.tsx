import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MessageCircle, Send, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface WorkoutFeedbackFormProps {
  workout: any
  onFeedbackSubmitted: () => void
}

const ratingOptions = [
  { value: "too-easy", label: "Too Easy", emoji: "😴" },
  { value: "just-right", label: "Just Right", emoji: "💪" },
  { value: "challenging", label: "Challenging", emoji: "🔥" },
  { value: "too-hard", label: "Too Hard", emoji: "😅" }
]

export function WorkoutFeedbackForm({ workout, onFeedbackSubmitted }: WorkoutFeedbackFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [feedback, setFeedback] = useState("")
  const [rating, setRating] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user || !feedback.trim() || !rating) {
      toast({
        title: "Missing Information",
        description: "Please provide both a rating and feedback",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Save workout feedback
      const { error: feedbackError } = await supabase
        .from('workout_feedback')
        .insert({
          user_id: user.id,
          workout_id: workout.id,
          sport: workout.sport,
          feedback_text: `Rating: ${rating} | ${feedback}`,
          feedback_type: 'post_workout'
        })

      if (feedbackError) throw feedbackError

      // Generate coaching message based on feedback
      const coachMessage = generateCoachMessage(workout, rating, feedback)
      
      // Save coach message to coaching_conversations
      const { error: coachError } = await supabase
        .from('coaching_conversations')
        .insert({
          user_id: user.id,
          message: coachMessage,
          is_user: false,
          workout_id: workout.id
        })

      if (coachError) throw coachError

      // Store feedback in localStorage for future workout generation
      const feedbackData = {
        rating,
        feedback,
        workout_type: workout.workout_type,
        sport: workout.sport,
        timestamp: new Date().toISOString()
      }
      
      const existingFeedback = JSON.parse(localStorage.getItem('workout-feedback') || '[]')
      existingFeedback.push(feedbackData)
      // Keep only last 10 feedback entries
      localStorage.setItem('workout-feedback', JSON.stringify(existingFeedback.slice(-10)))

      toast({
        title: "Feedback Submitted! 🎯",
        description: "Your coach has analyzed your workout and left you a message!"
      })

      onFeedbackSubmitted()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateCoachMessage = (workout: any, rating: string, feedback: string): string => {
    const workoutType = workout.workout_type || 'workout'
    const sport = workout.sport || 'training'
    
    let message = `Great job completing your ${sport} ${workoutType}! 🏊‍♂️\n\n`
    
    // Personalized response based on rating
    switch (rating) {
      case 'too-easy':
        message += `I noticed you found this workout too easy. For your next session, I'll increase the intensity and add more challenging intervals. Consider:\n• Reducing rest periods\n• Increasing distance or resistance\n• Adding technical drills\n\n`
        break
      case 'just-right':
        message += `Perfect! You found the workout appropriately challenging. This is the sweet spot for improvement. I'll maintain this intensity level and gradually progress. Keep up the excellent work!\n\n`
        break
      case 'challenging':
        message += `Excellent work pushing through a challenging session! This is where real growth happens. For recovery:\n• Focus on proper hydration\n• Get quality sleep tonight\n• Consider light stretching or foam rolling\n\n`
        break
      case 'too-hard':
        message += `I appreciate your honesty about the difficulty. Let's adjust your next workout to be more manageable while still promoting progress:\n• Longer rest periods\n• Slightly reduced intensity\n• Focus on technique over speed\n\n`
        break
    }

    // Add specific advice based on feedback content
    if (feedback.toLowerCase().includes('tired') || feedback.toLowerCase().includes('fatigue')) {
      message += `🔋 **Recovery Focus**: Since you mentioned fatigue, prioritize sleep (8+ hours) and proper nutrition. Consider a lighter session tomorrow.\n\n`
    }
    
    if (feedback.toLowerCase().includes('technique') || feedback.toLowerCase().includes('form')) {
      message += `🎯 **Technique Notes**: I'll incorporate more technical drills in your upcoming workouts to help with form improvements.\n\n`
    }

    if (feedback.toLowerCase().includes('shoulder') || feedback.toLowerCase().includes('pain')) {
      message += `⚠️ **Important**: Please prioritize recovery and consider consulting a sports medicine professional if pain persists.\n\n`
    }

    message += `💡 **Next Steps**: Your feedback helps me personalize your training. Keep communicating how you feel - it's crucial for optimal progress!\n\nWhat questions do you have about today's performance or tomorrow's training?`

    return message
  }

  return (
    <Card className="mt-6 border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <MessageCircle className="h-5 w-5" />
          How did it go?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">How challenging was this workout?</Label>
          <RadioGroup value={rating} onValueChange={setRating}>
            <div className="grid grid-cols-2 gap-3">
              {ratingOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 cursor-pointer">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <span className="text-lg">{option.emoji}</span>
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedback" className="text-sm font-medium">
            Tell me more about your experience
          </Label>
          <Textarea
            id="feedback"
            placeholder="How did you feel during the workout? Any specific challenges, victories, or areas for improvement? Your coach wants to know!"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px] bg-white/70 dark:bg-gray-800/70"
          />
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || !feedback.trim() || !rating}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isSubmitting ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
              Sending to Coach...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Feedback to Coach
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your coach will analyze this feedback and leave you a personalized message with recovery tips and adjustments for your next workout.
        </p>
      </CardContent>
    </Card>
  )
}
