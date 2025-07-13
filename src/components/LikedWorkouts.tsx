import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Play, Clock, Activity } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface LikedWorkout {
  id: string
  workout_id: string
  created_at: string
  workouts: {
    id: string
    title: string
    sport: string
    workout_type: string
    duration: number | null
    created_at: string
    exercises: any
  }
}

interface LikedWorkoutsProps {
  onShowWorkout: (workoutId: string) => void
}

export function LikedWorkouts({ onShowWorkout }: LikedWorkoutsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [likedWorkouts, setLikedWorkouts] = useState<LikedWorkout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchLikedWorkouts()
    }
  }, [user])

  const fetchLikedWorkouts = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('workout_likes')
        .select('id, workout_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get workout details separately
      const likesWithWorkouts = await Promise.all(
        (data || []).map(async (like) => {
          const { data: workout } = await supabase
            .from('workouts')
            .select('id, title, sport, workout_type, duration, created_at, exercises')
            .eq('id', like.workout_id)
            .single()

          return {
            ...like,
            workouts: workout
          }
        })
      )

      if (error) throw error

      setLikedWorkouts(likesWithWorkouts.filter(like => like.workouts))
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load liked workouts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const unlikeWorkout = async (likeId: string, workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workout_likes')
        .delete()
        .eq('id', likeId)

      if (error) throw error

      setLikedWorkouts(prev => prev.filter(like => like.id !== likeId))
      
      toast({
        title: "Workout Unliked",
        description: "Removed from your liked workouts",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to unlike workout",
        variant: "destructive"
      })
    }
  }

  const getSportIcon = (sport: string) => {
    const icons: Record<string, string> = {
      swimming: "🏊‍♂️",
      running: "🏃‍♂️",
      cycling: "🚴‍♂️",
      basketball: "🏀",
      soccer: "⚽",
      tennis: "🎾",
      weightlifting: "🏋️‍♀️",
      strength: "💪",
      cardio: "❤️",
      yoga: "🧘‍♀️"
    }
    return icons[sport] || "💪"
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-8">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your liked workouts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="h-6 w-6 text-red-500 fill-current" />
          <h2 className="text-2xl font-bold">Liked Workouts</h2>
        </div>
        <p className="text-muted-foreground">
          Your favorite workouts that you can reuse anytime
        </p>
      </div>

      {likedWorkouts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Liked Workouts Yet</h3>
            <p className="text-muted-foreground">
              Like workouts by clicking the heart icon to save them here for easy access later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {likedWorkouts.map((like) => {
            const workout = like.workouts
            const exerciseCount = workout.exercises?.exercises?.length || 0
            
            return (
              <Card key={like.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getSportIcon(workout.sport)}</div>
                      <div>
                        <CardTitle className="text-lg">{workout.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {workout.sport}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {workout.workout_type}
                          </Badge>
                          {workout.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {workout.duration}min
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unlikeWorkout(like.id, workout.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {exerciseCount} exercises • Liked on {format(new Date(like.created_at), 'MMM d, yyyy')}
                    </div>
                    <Button
                      onClick={() => onShowWorkout(workout.id)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      View Workout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}