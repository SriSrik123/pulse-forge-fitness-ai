
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Edit3, Sparkles } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface WorkoutModifierProps {
  originalWorkout: any
  onModified: (modifiedWorkout: any) => void
}

export function WorkoutModifier({ originalWorkout, onModified }: WorkoutModifierProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [duration, setDuration] = useState([originalWorkout.duration || 30])
  const [modifications, setModifications] = useState("")
  const [isModifying, setIsModifying] = useState(false)

  const handleModify = async () => {
    if (!user || !modifications.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe what you'd like to modify about this workout.",
        variant: "destructive"
      })
      return
    }

    setIsModifying(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          workoutType: originalWorkout.workout_type,
          sport: originalWorkout.sport,
          sessionType: originalWorkout.workout_type,
          fitnessLevel: 'intermediate', // Could be stored in user profile
          duration: duration[0],
          equipment: originalWorkout.equipment?.equipment || [],
          sportEquipmentList: originalWorkout.equipment?.equipment || [],
          goals: `Modify the following workout: "${originalWorkout.title}". 
                  Original workout exercises: ${JSON.stringify(originalWorkout.exercises?.exercises || [])}
                  
                  Modifications requested: ${modifications}
                  
                  Please create a modified version that incorporates these changes while maintaining the overall structure and goals.`,
          isModification: true,
          originalWorkout: originalWorkout
        }
      })

      if (error) {
        throw error
      }

      if (data?.workout) {
        // Save the modified workout as a new workout
        const modifiedWorkout = {
          ...data.workout,
          title: `${data.workout.title} (Modified)`
        }

        const { error: saveError } = await supabase
          .from('workouts')
          .insert({
            user_id: user.id,
            title: modifiedWorkout.title,
            description: `Modified version of: ${originalWorkout.title}`,
            workout_type: originalWorkout.workout_type,
            sport: originalWorkout.sport,
            duration: modifiedWorkout.duration,
            equipment: originalWorkout.equipment,
            exercises: modifiedWorkout
          })

        if (saveError) {
          console.error('Error saving modified workout:', saveError)
        }

        onModified(modifiedWorkout)
        toast({
          title: "Workout Modified! ✨",
          description: "Your personalized modified workout is ready.",
        })
      }
    } catch (error) {
      console.error('Error modifying workout:', error)
      toast({
        title: "Modification Failed",
        description: "Failed to modify workout. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsModifying(false)
    }
  }

  return (
    <Card className="glass border-0 border-pulse-purple/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-pulse-purple" />
          Modify Workout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Duration: {duration[0]} minutes</Label>
          <Slider
            value={duration}
            onValueChange={setDuration}
            max={120}
            min={15}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>15 min</span>
            <span>120 min</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="modifications">What would you like to change?</Label>
          <Textarea
            id="modifications"
            placeholder="e.g., make it more intense, add more cardio, focus on upper body, reduce rest time, substitute exercises..."
            value={modifications}
            onChange={(e) => setModifications(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <Button 
          onClick={handleModify}
          disabled={isModifying || !modifications.trim()}
          className="w-full pulse-gradient-purple text-white font-semibold"
        >
          {isModifying ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Modifying...
            </>
          ) : (
            <>
              <Edit3 className="mr-2 h-4 w-4" />
              Generate Modified Workout
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
