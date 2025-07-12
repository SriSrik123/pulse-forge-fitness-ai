import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SportPreference {
  sport: string
  frequency: number
  preferredDays: string[]
  sessionDuration: number
  equipment: string[]
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

    const {
      planId,
      startDate,
      endDate,
      sportPreferences,
      multipleSessionsPerDay,
      includesStrength,
      aiPreferences
    }: {
      planId: string
      startDate: string
      endDate: string
      sportPreferences: SportPreference[]
      multipleSessionsPerDay: boolean
      includesStrength: boolean
      aiPreferences?: string
    } = await req.json()

    console.log('Generating monthly plan:', { planId, startDate, endDate, sportPreferences })

    // Generate schedule for each week
    const start = new Date(startDate)
    const end = new Date(endDate)
    const scheduledWorkouts = []

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    
    // Calculate total weeks
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const weeks = Math.ceil(totalDays / 7)

    console.log(`Planning for ${weeks} weeks, ${totalDays} days`)

    for (let week = 0; week < weeks; week++) {
      // For each week, schedule workouts based on preferences
      for (const sportPref of sportPreferences) {
        const sessionsThisWeek = Math.min(sportPref.frequency, 7) // Max 1 per day unless multiple sessions allowed
        
        // Get preferred days for this sport
        let availableDays = [...sportPref.preferredDays]
        
        // If we need more sessions than preferred days, add other days
        if (sessionsThisWeek > availableDays.length) {
          const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          const additionalDays = allDays.filter(day => !availableDays.includes(day))
          availableDays = [...availableDays, ...additionalDays.slice(0, sessionsThisWeek - availableDays.length)]
        }

        // Schedule sessions for this week
        for (let session = 0; session < sessionsThisWeek && session < availableDays.length; session++) {
          const dayName = availableDays[session]
          const dayIndex = dayNames.indexOf(dayName)
          
          // Calculate the actual date
          const weekStart = new Date(start)
          weekStart.setDate(start.getDate() + (week * 7))
          const sessionDate = new Date(weekStart)
          sessionDate.setDate(weekStart.getDate() + dayIndex)

          // Skip if date is beyond end date
          if (sessionDate > end) continue

          // Determine session time based on multiple sessions per day
          let sessionTime = 'morning'
          if (multipleSessionsPerDay) {
            // Check if this day already has a session
            const existingSessions = scheduledWorkouts.filter(w => 
              w.scheduled_date === sessionDate.toISOString().split('T')[0]
            )
            
            if (existingSessions.length > 0) {
              sessionTime = 'evening'
            }
          }

          // Determine workout type based on sport and week progression
          let workoutType = 'training'
          if (sportPref.sport === 'weightlifting') {
            workoutType = 'strength'
          } else if (week % 4 === 3) { // Every 4th week, mix in some cardio
            workoutType = 'cardio'
          }

          const scheduledWorkout = {
            plan_id: planId,
            user_id: userData.user.id,
            scheduled_date: sessionDate.toISOString().split('T')[0],
            session_time_of_day: sessionTime,
            sport: sportPref.sport,
            workout_type: workoutType,
            title: `${sportPref.sport.charAt(0).toUpperCase() + sportPref.sport.slice(1)} ${workoutType}`,
            completed: false,
            skipped: false
          }

          scheduledWorkouts.push(scheduledWorkout)
        }
      }

      // Add strength training sessions if enabled and not already included
      if (includesStrength && !sportPreferences.some(p => p.sport === 'weightlifting')) {
        // Add 2 strength sessions per week on non-primary sport days
        const strengthDays = ['tuesday', 'thursday'] // Default strength days
        
        for (const dayName of strengthDays) {
          const dayIndex = dayNames.indexOf(dayName)
          const weekStart = new Date(start)
          weekStart.setDate(start.getDate() + (week * 7))
          const sessionDate = new Date(weekStart)
          sessionDate.setDate(weekStart.getDate() + dayIndex)

          if (sessionDate > end) continue

          // Check if this day already has a primary sport session
          const existingSession = scheduledWorkouts.find(w => 
            w.scheduled_date === sessionDate.toISOString().split('T')[0] &&
            w.session_time_of_day === 'morning'
          )

          let sessionTime = 'morning'
          if (existingSession) {
            sessionTime = multipleSessionsPerDay ? 'evening' : 'morning'
            if (!multipleSessionsPerDay) continue // Skip if we don't allow multiple sessions
          }

          const strengthWorkout = {
            plan_id: planId,
            user_id: userData.user.id,
            scheduled_date: sessionDate.toISOString().split('T')[0],
            session_time_of_day: sessionTime,
            sport: 'weightlifting',
            workout_type: 'strength',
            title: 'Strength Training',
            completed: false,
            skipped: false
          }

          scheduledWorkouts.push(strengthWorkout)
        }
      }
    }

    console.log(`Generated ${scheduledWorkouts.length} scheduled workouts`)

    // Insert all scheduled workouts
    if (scheduledWorkouts.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('scheduled_workouts')
        .insert(scheduledWorkouts)

      if (insertError) {
        console.error('Error inserting scheduled workouts:', insertError)
        throw insertError
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scheduledWorkouts: scheduledWorkouts.length,
        message: `Generated ${scheduledWorkouts.length} scheduled workouts`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )

  } catch (error) {
    console.error('Error in generate-monthly-plan:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to generate monthly plan'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})