
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the session or user object
    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      workoutType, 
      sport, 
      sessionType, 
      fitnessLevel, 
      duration, 
      equipment,
      sportEquipmentList,
      goals,
      previousWorkouts = [],
      adaptToProgress = false,
      scheduledWorkoutId = null
    } = await req.json();

    console.log('Generating workout with params:', { workoutType, sport, sessionType, fitnessLevel, duration });

    let prompt = "";
    
    // Add previous workout context if available
    let workoutHistory = "";
    if (previousWorkouts && previousWorkouts.length > 0 && adaptToProgress) {
      const recentWorkouts = previousWorkouts.slice(0, 3).map(w => ({
        title: w.title,
        date: w.created_at,
        completed: w.completed,
        sport: w.sport
      }));
      
      workoutHistory = `
      
RECENT WORKOUT HISTORY (consider for progression and variety):
${recentWorkouts.map(w => `- ${w.title} (${w.completed ? 'completed' : 'not completed'}) - ${new Date(w.date).toLocaleDateString()}`).join('\n')}

Please ensure this workout:
1. Progresses appropriately from recent sessions
2. Varies exercises to prevent monotony
3. Adjusts intensity based on completion patterns
4. Builds upon previous training adaptations
      `;
    }
    
    if (sport && sessionType) {
      const availableEquipment = sportEquipmentList?.join(", ") || "basic equipment";
      prompt = `Generate a ${duration}-minute ${sport} ${sessionType} session for a ${fitnessLevel} level athlete.
      Available equipment: ${availableEquipment}.
      Goals: ${goals || `improve ${sport} performance`}.${workoutHistory}
      
      Please provide a structured ${sessionType} plan with:
      1. Warm-up (5-10 minutes)
      2. Main ${sessionType} with exercises/drills, sets, reps, and rest periods
      3. Cool-down (5-10 minutes)
      
      ${sessionType === 'training' ? `Focus on sport-specific skills, technique, and conditioning for ${sport}.` : 
        `Focus on gym exercises that complement ${sport} performance, targeting relevant muscle groups and movement patterns.`}
      
      Format as JSON with this structure:
      {
        "title": "${sport} ${sessionType} Session",
        "duration": ${duration},
        "sport": "${sport}",
        "type": "${sessionType}",
        "warmup": ["exercise 1", "exercise 2", "exercise 3"],
        "exercises": [{"name": "Exercise Name", "sets": 3, "reps": "8-12", "rest": "60s", "description": "Brief description", "sportSpecific": true}],
        "cooldown": ["stretch 1", "stretch 2", "stretch 3"]
      }`;
    } else {
      prompt = `Generate a ${duration}-minute ${workoutType} workout for a ${fitnessLevel} fitness level person. 
      Equipment available: ${equipment || 'bodyweight only'}. 
      Goals: ${goals || 'general fitness'}. 
      
      Please provide a structured workout plan with:
      1. Warm-up (5 minutes)
      2. Main workout with exercises, sets, reps, and rest periods
      3. Cool-down (5 minutes)
      
      Format as JSON with this structure:
      {
        "title": "${workoutType} Workout",
        "duration": ${duration},
        "warmup": ["exercise 1", "exercise 2", "exercise 3"],
        "exercises": [{"name": "Exercise Name", "sets": 3, "reps": "8-12", "rest": "60s", "description": "Brief description"}],
        "cooldown": ["stretch 1", "stretch 2", "stretch 3"]
      }`;
    }

    console.log('Calling Gemini API...');

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
      console.error('Gemini API Error:', data);
      throw new Error(data.error?.message || 'Failed to generate workout from AI service');
    }
    
    console.log('Gemini API response received');

    let workout;
    
    if (data.candidates && data.candidates[0]) {
      const workoutText = data.candidates[0].content.parts[0].text;
      console.log('Raw workout text:', workoutText);
      
      const jsonMatch = workoutText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          workout = JSON.parse(jsonMatch[0]);
          console.log('Parsed workout:', workout);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          workout = createFallbackWorkout(sport, sessionType, workoutType, duration);
        }
      } else {
        console.log('No JSON found in response, using fallback');
        workout = createFallbackWorkout(sport, sessionType, workoutType, duration);
      }
    } else {
      console.log('No candidates in response, using fallback');
      workout = createFallbackWorkout(sport, sessionType, workoutType, duration);
    }

    // Ensure workout has required structure
    if (!workout.title) workout.title = sport ? `${sport} ${sessionType} Session` : `${workoutType} Workout`;
    if (!workout.duration) workout.duration = duration;
    if (!workout.warmup) workout.warmup = ["Dynamic warm-up", "Joint mobility", "Light movement preparation"];
    if (!workout.exercises) workout.exercises = [
      { name: "Main Exercise", sets: 3, reps: "8-12", rest: "60s", description: "Primary movement pattern" }
    ];
    if (!workout.cooldown) workout.cooldown = ["Static stretching", "Deep breathing", "Recovery"];

    console.log('Final workout structure:', workout);

    // Save workout to database
    try {
      const { error: saveError } = await supabaseClient
        .from('workouts')
        .insert({
          user_id: user.id,
          title: workout.title,
          description: goals || `${sport || workoutType} workout session`,
          workout_type: sessionType || workoutType || 'general',
          sport: sport || 'general',
          duration: workout.duration,
          equipment: sportEquipmentList || equipment ? { equipment: sportEquipmentList || equipment } : null,
          exercises: workout
        });

      if (saveError) {
        console.error('Error saving workout:', saveError);
        // Don't fail the entire request if saving fails
      } else {
        console.log('Workout saved successfully');
      }
    } catch (saveError) {
      console.error('Database save error:', saveError);
      // Continue with response even if save fails
    }

    return new Response(JSON.stringify({ workout }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-workout function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate workout. Please try again.',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createFallbackWorkout(sport: string, sessionType: string, workoutType: string, duration: number) {
  const fallbackTitle = sport ? `${sport} ${sessionType} Session` : `${workoutType} Workout`;
  return {
    title: fallbackTitle,
    duration: duration || 30,
    sport: sport || 'general',
    type: sessionType || workoutType || 'general',
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
        description: "Upper body strength exercise",
        sportSpecific: !!sport 
      },
      { 
        name: "Bodyweight squats", 
        sets: 3, 
        reps: "12-15", 
        rest: "60s", 
        description: "Lower body strength exercise",
        sportSpecific: !!sport 
      },
      { 
        name: "Plank", 
        sets: 3, 
        reps: "30-60s", 
        rest: "45s", 
        description: "Core stability exercise",
        sportSpecific: !!sport 
      }
    ],
    cooldown: [
      "Static stretching",
      "Deep breathing exercises",
      "Gentle mobility work"
    ]
  };
}
