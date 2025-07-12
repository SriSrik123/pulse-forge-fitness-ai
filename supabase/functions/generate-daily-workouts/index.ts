import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for scheduled tasks
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all users with sport profiles
    const { data: profiles, error: profileError } = await supabaseClient
      .from('user_sport_profiles')
      .select('*')

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const workoutsGenerated = [];

    for (const profile of profiles) {
      try {
        // Check if workouts already exist for today
        const { data: existingWorkouts } = await supabaseClient
          .from('scheduled_workouts')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('scheduled_date', today)

        if (existingWorkouts && existingWorkouts.length > 0) {
          console.log(`Workouts already exist for user ${profile.user_id} for ${today}`);
          continue;
        }

        // Get user's recent workouts for context
        const { data: recentWorkouts } = await supabaseClient
          .from('workouts')
          .select('*')
          .eq('user_id', profile.user_id)
          .order('created_at', { ascending: false })
          .limit(5)

        // Generate sport-specific workout
        const sportWorkout = await generateWorkout({
          geminiApiKey,
          sport: profile.primary_sport,
          sessionType: 'training',
          fitnessLevel: profile.experience_level,
          duration: profile.session_duration,
          goals: profile.current_goals || `Improve ${profile.primary_sport} performance`,
          previousWorkouts: recentWorkouts || []
        });

        // Generate strength workout
        const strengthWorkout = await generateWorkout({
          geminiApiKey,
          sport: 'weightlifting',
          sessionType: 'strength',
          fitnessLevel: profile.experience_level,
          duration: 45,
          goals: `Strength training to complement ${profile.primary_sport}`,
          previousWorkouts: recentWorkouts?.filter(w => w.sport === 'weightlifting') || []
        });

        // Save both workouts to scheduled_workouts
        const workoutsToSchedule = [
          {
            user_id: profile.user_id,
            title: sportWorkout.title,
            sport: profile.primary_sport,
            workout_type: 'training',
            scheduled_date: today,
            session_time_of_day: 'morning',
            completed: false,
            skipped: false
          },
          {
            user_id: profile.user_id,
            title: strengthWorkout.title,
            sport: 'weightlifting',
            workout_type: 'strength',
            scheduled_date: today,
            session_time_of_day: 'afternoon',
            completed: false,
            skipped: false
          }
        ];

        const { error: scheduleError } = await supabaseClient
          .from('scheduled_workouts')
          .insert(workoutsToSchedule)

        if (scheduleError) {
          console.error(`Error scheduling workouts for user ${profile.user_id}:`, scheduleError);
        } else {
          workoutsGenerated.push({
            userId: profile.user_id,
            workouts: [sportWorkout.title, strengthWorkout.title]
          });
        }

      } catch (error) {
        console.error(`Error generating workouts for user ${profile.user_id}:`, error);
      }
    }

    return new Response(JSON.stringify({ 
      message: 'Daily workouts generated successfully',
      generated: workoutsGenerated.length,
      details: workoutsGenerated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-daily-workouts function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate daily workouts',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateWorkout({ geminiApiKey, sport, sessionType, fitnessLevel, duration, goals, previousWorkouts }) {
  let workoutHistory = "";
  if (previousWorkouts && previousWorkouts.length > 0) {
    const recentWorkouts = previousWorkouts.slice(0, 3).map(w => ({
      title: w.title,
      date: w.created_at,
      completed: w.completed,
      sport: w.sport,
      workout_type: w.workout_type
    }));
    
    workoutHistory = `
    
RECENT WORKOUT HISTORY:
${recentWorkouts.map(w => `- ${w.title} (${w.completed ? 'completed' : 'not completed'}) - ${new Date(w.date).toLocaleDateString()}`).join('\n')}

Yesterday you did a ${recentWorkouts[0]?.workout_type || 'general'} workout focused on ${recentWorkouts[0]?.sport || 'fitness'}, so today you should do ${sessionType} and focus on progressive overload and variety.
    `;
  }

  const prompt = `Generate a ${duration}-minute ${sport} ${sessionType} session for a ${fitnessLevel} level athlete.
  Goals: ${goals}.${workoutHistory}
  
  Please provide a structured ${sessionType} plan with:
  1. Warm-up (5-10 minutes)
  2. Main ${sessionType} with exercises/drills, sets, reps, and rest periods
  3. Cool-down (5-10 minutes)
  
  Format as JSON with this structure:
  {
    "title": "${sport} ${sessionType} Session",
    "duration": ${duration},
    "sport": "${sport}",
    "type": "${sessionType}",
    "warmup": ["exercise 1", "exercise 2", "exercise 3"],
    "exercises": [{"name": "Exercise Name", "sets": 3, "reps": "8-12", "rest": "60s", "description": "Brief description"}],
    "cooldown": ["stretch 1", "stretch 2", "stretch 3"]
  }`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to generate workout from AI service');
  }
  
  let workout;
  if (data.candidates && data.candidates[0]) {
    const workoutText = data.candidates[0].content.parts[0].text;
    const jsonMatch = workoutText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        workout = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        workout = createFallbackWorkout(sport, sessionType, duration);
      }
    } else {
      workout = createFallbackWorkout(sport, sessionType, duration);
    }
  } else {
    workout = createFallbackWorkout(sport, sessionType, duration);
  }

  // Ensure workout has required structure
  if (!workout.title) workout.title = `${sport} ${sessionType} Session`;
  if (!workout.duration) workout.duration = duration;
  if (!workout.warmup) workout.warmup = ["Dynamic warm-up", "Joint mobility", "Light movement preparation"];
  if (!workout.exercises) workout.exercises = [
    { name: "Main Exercise", sets: 3, reps: "8-12", rest: "60s", description: "Primary movement pattern" }
  ];
  if (!workout.cooldown) workout.cooldown = ["Static stretching", "Deep breathing", "Recovery"];

  return workout;
}

function createFallbackWorkout(sport: string, sessionType: string, duration: number) {
  return {
    title: `${sport} ${sessionType} Session`,
    duration: duration || 30,
    sport: sport || 'general',
    type: sessionType || 'general',
    warmup: [
      "5 minutes light cardio",
      "Dynamic stretching",
      "Joint mobility exercises"
    ],
    exercises: [
      { 
        name: "Push-ups", 
        sets: 3, 
        reps: "8-12", 
        rest: "60s", 
        description: "Upper body strength exercise"
      },
      { 
        name: "Bodyweight squats", 
        sets: 3, 
        reps: "12-15", 
        rest: "60s", 
        description: "Lower body strength exercise"
      },
      { 
        name: "Plank", 
        sets: 3, 
        reps: "30-60s", 
        rest: "45s", 
        description: "Core stability exercise"
      }
    ],
    cooldown: [
      "Static stretching",
      "Deep breathing exercises",
      "Gentle mobility work"
    ]
  };
}