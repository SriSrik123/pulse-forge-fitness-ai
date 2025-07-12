import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { changedWorkoutId } = await req.json()

    console.log('Regenerating future workouts after change:', changedWorkoutId)

    // Get the changed workout details
    const { data: changedWorkout, error: workoutError } = await supabaseClient
      .from('scheduled_workouts')
      .select('*')
      .eq('id', changedWorkoutId)
      .single()

    if (workoutError || !changedWorkout) {
      throw new Error('Could not find changed workout')
    }

    const changedDate = new Date(changedWorkout.scheduled_date)
    const today = new Date()
    
    // Only adjust future workouts
    const futureDate = new Date(Math.max(changedDate.getTime(), today.getTime()))

    // Get all future scheduled workouts for this user and sport
    const { data: futureWorkouts, error: futureError } = await supabaseClient
      .from('scheduled_workouts')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('sport', changedWorkout.sport)
      .gte('scheduled_date', futureDate.toISOString().split('T')[0])
      .eq('completed', false)
      .eq('skipped', false)
      .order('scheduled_date', { ascending: true })

    if (futureError) {
      throw futureError
    }

    console.log(`Found ${futureWorkouts?.length || 0} future workouts to potentially adjust`)

    // Get recent workout history to understand progress patterns
    const { data: recentWorkouts, error: historyError } = await supabaseClient
      .from('workouts')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('sport', changedWorkout.sport)
      .order('created_at', { ascending: false })
      .limit(10)

    if (historyError) {
      console.error('Error fetching workout history:', historyError)
    }

    // Analyze the impact of the missed/completed workout
    let adjustmentStrategy = 'maintain' // maintain, intensify, or reduce

    if (changedWorkout.skipped) {
      // If workout was skipped, we might need to intensify future workouts
      adjustmentStrategy = 'intensify'
      console.log('Workout was skipped, will intensify future workouts')
    } else if (changedWorkout.completed) {
      // If workout was completed, maintain current plan or slightly reduce if overtraining
      const recentCompletionRate = recentWorkouts?.filter(w => w.completed).length || 0
      if (recentCompletionRate >= 8) { // High completion rate
        adjustmentStrategy = 'maintain'
      }
      console.log('Workout was completed, maintaining current plan')
    }

    // Update future workout intensities or add/remove sessions based on the strategy
    const updates = []
    
    if (futureWorkouts && futureWorkouts.length > 0) {
      for (let i = 0; i < Math.min(futureWorkouts.length, 3); i++) { // Adjust next 3 workouts
        const workout = futureWorkouts[i]
        let newTitle = workout.title

        if (adjustmentStrategy === 'intensify') {
          // Mark for higher intensity
          newTitle = workout.title.includes('(Intensified)') ? workout.title : `${workout.title} (Intensified)`
        } else if (adjustmentStrategy === 'reduce') {
          // Mark for lower intensity
          newTitle = workout.title.includes('(Light)') ? workout.title : `${workout.title} (Light)`
        }

        if (newTitle !== workout.title) {
          updates.push({
            id: workout.id,
            title: newTitle
          })
        }
      }
    }

    // Apply the updates
    if (updates.length > 0) {
      for (const update of updates) {
        await supabaseClient
          .from('scheduled_workouts')
          .update({ title: update.title })
          .eq('id', update.id)
      }
      console.log(`Updated ${updates.length} future workouts`)
    }

    // If we skipped a workout and have room in the schedule, add a makeup session
    if (changedWorkout.skipped && futureWorkouts && futureWorkouts.length > 0) {
      // Find the next available day to add a makeup session
      const nextWorkout = futureWorkouts[0]
      const nextWorkoutDate = new Date(nextWorkout.scheduled_date)
      
      // Add a day before the next scheduled workout if possible
      const makeupDate = new Date(nextWorkoutDate)
      makeupDate.setDate(nextWorkoutDate.getDate() - 1)
      
      // Only add if it's not in the past and not on the same day as another workout
      if (makeupDate >= today) {
        const existingOnMakeupDay = await supabaseClient
          .from('scheduled_workouts')
          .select('id')
          .eq('user_id', userData.user.id)
          .eq('scheduled_date', makeupDate.toISOString().split('T')[0])

        if (!existingOnMakeupDay.data || existingOnMakeupDay.data.length === 0) {
          const makeupWorkout = {
            plan_id: changedWorkout.plan_id,
            user_id: userData.user.id,
            scheduled_date: makeupDate.toISOString().split('T')[0],
            session_time_of_day: 'afternoon',
            sport: changedWorkout.sport,
            workout_type: changedWorkout.workout_type,
            title: `${changedWorkout.sport} Makeup Session`,
            completed: false,
            skipped: false
          }

          await supabaseClient
            .from('scheduled_workouts')
            .insert([makeupWorkout])

          console.log('Added makeup session for skipped workout')
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        adjustmentStrategy,
        updatedWorkouts: updates.length,
        message: `Applied ${adjustmentStrategy} strategy to ${updates.length} future workouts`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error in regenerate-future-workouts:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to regenerate future workouts'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})