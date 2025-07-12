
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { CheckCircle, BookOpen } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { PerformanceTracker } from "./PerformanceTracker"

interface WorkoutCompletionProps {
  workout: any
  onComplete: () => void
}

const feelingOptions = [
  { value: 1, emoji: "😫", label: "Very Bad" },
  { value: 2, emoji: "😕", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Great" }
]

export function WorkoutCompletion({ workout, onComplete }: WorkoutCompletionProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [journalEntry, setJournalEntry] = useState("")
  const [feelingSlider, setFeelingSlider] = useState([3])
  const [isCompleting, setIsCompleting] = useState(false)
  const [showPerformanceTracker, setShowPerformanceTracker] = useState(true)

  const handleComplete = async () => {
    if (!user) return

    setIsCompleting(true)
    try {
      const feelingValue = feelingOptions.find(f => f.value === feelingSlider[0])?.label.toLowerCase().replace(' ', '-') || 'okay'
      
      // Update the workout as completed and add journal/feeling data
      const { error } = await supabase
        .from('workouts')
        .update({
          completed: true,
          journal_entry: journalEntry || null,
          feeling: feelingValue
        })
        .eq('id', workout.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast({
        title: "Workout Completed! 🎉",
        description: "Great job! Your workout has been saved to your history.",
      })

      onComplete()
    } catch (error) {
      console.error('Error completing workout:', error)
      toast({
        title: "Error",
        description: "Failed to complete workout. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Performance Tracking */}
      {showPerformanceTracker && (
        <PerformanceTracker
          workoutId={workout.id}
          onPerformanceAdded={() => {
            toast({
              title: "Performance Saved",
              description: "Your workout performance has been recorded"
            })
          }}
        />
      )}

      {/* Completion Form */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-pulse-green" />
            Complete Workout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>How did you feel during this workout?</Label>
            <div className="flex justify-center">
              <span className="text-6xl">
                {feelingOptions.find(f => f.value === feelingSlider[0])?.emoji || '😐'}
              </span>
            </div>
            <div className="px-4">
              <Slider
                value={feelingSlider}
                onValueChange={setFeelingSlider}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
            <div className="text-center">
              <span className="text-sm font-medium">
                {feelingOptions.find(f => f.value === feelingSlider[0])?.label || 'Okay'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="journal">Journal Entry (Optional)</Label>
            <Textarea
              id="journal"
              placeholder="How was your workout? Any notes about your performance, technique, or goals..."
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button 
            onClick={handleComplete}
            disabled={isCompleting}
            className="w-full pulse-gradient text-white font-semibold"
          >
            {isCompleting ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 animate-pulse" />
                Completing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Done
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
