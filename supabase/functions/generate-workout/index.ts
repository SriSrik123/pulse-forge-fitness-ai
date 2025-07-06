
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
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const { 
      workoutType, 
      sport, 
      sessionType, 
      fitnessLevel, 
      duration, 
      equipment,
      sportEquipmentList,
      goals 
    } = await req.json();

    let prompt = "";
    
    if (sport && sessionType) {
      const availableEquipment = sportEquipmentList?.join(", ") || "basic equipment";
      prompt = `Generate a ${duration}-minute ${sport} ${sessionType} session for a ${fitnessLevel} level athlete.
      Available equipment: ${availableEquipment}.
      Goals: ${goals || `improve ${sport} performance`}.
      
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
        "warmup": [...],
        "exercises": [{"name": "", "sets": 0, "reps": "", "rest": "", "description": "", "sportSpecific": true/false}],
        "cooldown": [...]
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
        "title": "Workout Name",
        "duration": ${duration},
        "warmup": [...],
        "exercises": [{"name": "", "sets": 0, "reps": "", "rest": "", "description": ""}],
        "cooldown": [...]
      }`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
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
      throw new Error(data.error?.message || 'Failed to generate workout');
    }
    
    if (data.candidates && data.candidates[0]) {
      const workoutText = data.candidates[0].content.parts[0].text;
      const jsonMatch = workoutText.match(/\{[\s\S]*\}/);
      
      let workout;
      if (jsonMatch) {
        workout = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback workout
        const fallbackTitle = sport ? `${sport} ${sessionType} Session` : `${workoutType} Workout`;
        workout = {
          title: fallbackTitle,
          duration: duration,
          sport: sport,
          type: sessionType,
          warmup: ["Dynamic warm-up", "Joint mobility", "Light movement preparation"],
          exercises: [
            { name: "Main Exercise 1", sets: 3, reps: "8-12", rest: "60s", description: "Primary movement pattern", sportSpecific: !!sport },
            { name: "Main Exercise 2", sets: 3, reps: "10-15", rest: "60s", description: "Secondary movement", sportSpecific: !!sport },
            { name: "Main Exercise 3", sets: 3, reps: "30s", rest: "45s", description: "Conditioning element", sportSpecific: !!sport }
          ],
          cooldown: ["Static stretching", "Deep breathing", "Recovery"]
        };
      }

      // Save workout to database
      const { error: saveError } = await supabaseClient
        .from('workouts')
        .insert({
          user_id: user.id,
          title: workout.title,
          description: goals || null,
          workout_type: sessionType || workoutType || 'general',
          sport: sport || 'general',
          duration: workout.duration,
          equipment: sportEquipmentList || equipment ? { equipment: sportEquipmentList || equipment } : null,
          exercises: workout
        });

      if (saveError) {
        console.error('Error saving workout:', saveError);
      }

      return new Response(JSON.stringify({ workout }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('No workout generated');

  } catch (error) {
    console.error('Error in generate-workout function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
