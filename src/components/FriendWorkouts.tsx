import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Calendar, Clock, Dumbbell, Send, Share2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface FriendWorkout {
  id: string
  title: string
  sport: string
  workout_type: string
  duration: number
  created_at: string
  completed: boolean
  user_id: string
  exercises: any
  profiles: {
    full_name: string
    username: string
    avatar_url: string
  }
}

interface SharedWorkout {
  id: string
  message: string
  status: string
  created_at: string
  sender_id: string
  workouts: {
    title: string
    sport: string
    workout_type: string
    duration: number
    exercises: any
  }
  sender_profile: {
    full_name: string
    username: string
    avatar_url: string
  }
}

interface FriendWorksoutsProps {
  friendId: string
  friendName: string
  onClose: () => void
}

export function FriendWorkouts({ friendId, friendName, onClose }: FriendWorksoutsProps) {
  const { user } = useAuth()
  const [friendWorkouts, setFriendWorkouts] = useState<FriendWorkout[]>([])
  const [sharedWorkouts, setSharedWorkouts] = useState<SharedWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [shareMessage, setShareMessage] = useState("")
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [friendId, user?.id])

  const loadData = async () => {
    if (!user?.id || !friendId) return

    try {
      setLoading(true)

      // Check if friend allows workout visibility
      const { data: friendProfile } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('id', friendId)
        .single()

      const privacySettings = friendProfile?.privacy_settings as any
      const showWorkouts = privacySettings?.show_workouts_to_friends !== false

      let friendWorkoutsData = []
      if (showWorkouts) {
        // Load friend's recent workouts
        const { data: workouts, error: workoutsError } = await supabase
          .from('workouts')
          .select(`
            *,
            profiles!inner(full_name, username, avatar_url)
          `)
          .eq('user_id', friendId)
          .eq('completed', true)
          .order('created_at', { ascending: false })
          .limit(10)

        if (workoutsError) throw workoutsError
        friendWorkoutsData = workouts || []
      }

      // Load shared workouts (both directions)
      const { data: shared, error: sharedError } = await supabase
        .from('shared_workouts')
        .select(`
          *,
          workouts(*),
          sender_profile:profiles!sender_id(full_name, username, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
        .order('created_at', { ascending: false })

      if (sharedError) throw sharedError

      setFriendWorkouts(friendWorkoutsData as FriendWorkout[])
      setSharedWorkouts(shared as any || [])
    } catch (error) {
      console.error('Error loading friend workouts:', error)
      toast.error('Failed to load workout data')
    } finally {
      setLoading(false)
    }
  }

  const shareWorkout = async (workoutId: string) => {
    if (!user?.id || !friendId) return

    try {
      const { error } = await supabase
        .from('shared_workouts')
        .insert({
          sender_id: user.id,
          receiver_id: friendId,
          workout_id: workoutId,
          message: shareMessage
        })

      if (error) throw error

      toast.success('Workout shared successfully!')
      setShareMessage("")
      setSelectedWorkout(null)
      loadData()
    } catch (error) {
      console.error('Error sharing workout:', error)
      toast.error('Failed to share workout')
    }
  }

  const respondToSharedWorkout = async (sharedWorkoutId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('shared_workouts')
        .update({ status })
        .eq('id', sharedWorkoutId)

      if (error) throw error

      toast.success(`Workout ${status}!`)
      
      if (status === 'accepted') {
        // Copy the workout to user's workout list
        const sharedWorkout = sharedWorkouts.find(w => w.id === sharedWorkoutId)
        if (sharedWorkout) {
          const { error: copyError } = await supabase
            .from('workouts')
            .insert({
              user_id: user?.id,
              title: `${sharedWorkout.workouts.title} (from ${sharedWorkout.sender_profile.full_name})`,
              sport: sharedWorkout.workouts.sport,
              workout_type: sharedWorkout.workouts.workout_type,
              duration: sharedWorkout.workouts.duration,
              exercises: sharedWorkout.workouts.exercises,
              completed: false
            })

          if (copyError) throw copyError
          toast.success('Workout added to your list!')
        }
      }
      
      loadData()
    } catch (error) {
      console.error('Error responding to shared workout:', error)
      toast.error('Failed to respond to shared workout')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Workouts with {friendName}</h2>
        <Button variant="outline" onClick={onClose}>
          Back to Friends
        </Button>
      </div>

      {/* Shared Workouts */}
      {sharedWorkouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Shared Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sharedWorkouts.map((shared) => (
                <div key={shared.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={shared.sender_profile.avatar_url} />
                        <AvatarFallback>
                          {shared.sender_profile.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {shared.sender_id === user?.id ? 'You' : shared.sender_profile.full_name} shared
                      </span>
                      <Badge variant={shared.status === 'pending' ? 'secondary' : 
                                   shared.status === 'accepted' ? 'default' : 'destructive'}>
                        {shared.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(shared.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="ml-10">
                    <h4 className="font-semibold">{shared.workouts.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {shared.workouts.sport} • {shared.workouts.workout_type} • {shared.workouts.duration}min
                    </p>
                    {shared.message && (
                      <p className="text-sm mt-2 italic">"{shared.message}"</p>
                    )}
                    
                    {shared.status === 'pending' && shared.sender_id !== user?.id && (
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => respondToSharedWorkout(shared.id, 'accepted')}
                        >
                          Accept & Add to My Workouts
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => respondToSharedWorkout(shared.id, 'declined')}
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Friend's Recent Workouts */}
      {friendWorkouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              {friendName}'s Recent Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {friendWorkouts.map((workout) => (
                <div key={workout.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{workout.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(workout.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {workout.duration}min
                        </span>
                        <Badge variant="outline">{workout.sport}</Badge>
                        <Badge variant="outline">{workout.workout_type}</Badge>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedWorkout(workout.id)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Share this workout with yourself</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">{workout.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {workout.sport} • {workout.workout_type} • {workout.duration}min
                            </p>
                          </div>
                          <Textarea
                            placeholder="Add a message (optional)"
                            value={shareMessage}
                            onChange={(e) => setShareMessage(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => shareWorkout(workout.id)}
                              disabled={!selectedWorkout}
                            >
                              Share Workout
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedWorkout(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {friendWorkouts.length === 0 && sharedWorkouts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              No workout activity to show with {friendName}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}