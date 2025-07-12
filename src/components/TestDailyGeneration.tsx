import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { Zap, Calendar } from "lucide-react"

export function TestDailyGeneration() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const testDailyGeneration = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // First clear today's scheduled workouts
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('scheduled_workouts')
        .delete()
        .eq('user_id', user.id)
        .eq('scheduled_date', today)

      // Create both swimming and strength workouts for today
      const workoutsToSchedule = [
        {
          user_id: user.id,
          title: 'Swimming Training Session',
          sport: 'swimming',
          workout_type: 'training',
          scheduled_date: today,
          session_time_of_day: 'morning',
          completed: false,
          skipped: false
        },
        {
          user_id: user.id,
          title: 'Strength Training Session',
          sport: 'weightlifting',
          workout_type: 'strength',
          scheduled_date: today,
          session_time_of_day: 'afternoon',
          completed: false,
          skipped: false
        }
      ]

      const { error } = await supabase
        .from('scheduled_workouts')
        .insert(workoutsToSchedule)

      if (error) throw error

      toast({
        title: "Daily Workouts Generated",
        description: "Both swimming and strength workouts have been scheduled for today.",
      })
    } catch (error) {
      console.error('Error generating daily workouts:', error)
      toast({
        title: "Error",
        description: "Failed to generate daily workouts.",
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
          <Calendar className="h-5 w-5" />
          Test Daily Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will clear today's scheduled workouts and generate new ones (both swimming and strength training).
        </p>
        <Button 
          onClick={testDailyGeneration}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Zap className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Generate Today's Workouts
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}