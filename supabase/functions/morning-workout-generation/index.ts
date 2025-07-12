import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Generating workouts for ${today}`);

    // Get all scheduled workouts for today that don't have a workout_id yet
    const { data: scheduledWorkouts, error: scheduledError } = await supabase
      .from('scheduled_workouts')
      .select('*')
      .eq('scheduled_date', today)
      .is('workout_id', null)
      .eq('completed', false)
      .eq('skipped', false);

    if (scheduledError) {
      console.error('Error fetching scheduled workouts:', scheduledError);
      throw scheduledError;
    }

    console.log(`Found ${scheduledWorkouts?.length || 0} workouts to generate`);

    if (!scheduledWorkouts || scheduledWorkouts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No workouts to generate for today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let generatedCount = 0;

    // Generate workouts for each scheduled workout
    for (const scheduledWorkout of scheduledWorkouts) {
      try {
        console.log(`Generating workout for user ${scheduledWorkout.user_id}, sport: ${scheduledWorkout.sport}, type: ${scheduledWorkout.workout_type}`);

        // Get user's sport profile for workout generation
        const { data: profile, error: profileError } = await supabase
          .from('user_sport_profiles')
          .select('*')
          .eq('user_id', scheduledWorkout.user_id)
          .single();

        if (profileError) {
          console.error(`Error fetching profile for user ${scheduledWorkout.user_id}:`, profileError);
          continue;
        }

        // Get previous workouts for context
        const { data: previousWorkouts } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', scheduledWorkout.user_id)
          .eq('sport', scheduledWorkout.sport)
          .order('created_at', { ascending: false })
          .limit(5);

        // Generate workout using Gemini
        const workoutPrompt = `Generate a detailed ${scheduledWorkout.workout_type} workout for ${scheduledWorkout.sport}.
        
User Profile:
- Experience Level: ${profile.experience_level}
- Session Duration: ${profile.session_duration} minutes
- Training Frequency: ${profile.training_frequency} times per week
- Competitive Level: ${profile.competitive_level}
- Goals: ${profile.current_goals || 'General fitness improvement'}

Previous Workouts Context: ${previousWorkouts?.length ? JSON.stringify(previousWorkouts.slice(0, 2)) : 'No previous workouts'}

Please return a JSON object with this exact structure:
{
  "title": "Workout name",
  "description": "Brief description",
  "sport": "${scheduledWorkout.sport}",
  "workout_type": "${scheduledWorkout.workout_type}",
  "duration": ${profile.session_duration},
  "exercises": {
    "warmup": ["Exercise 1", "Exercise 2", "Exercise 3"],
    "exercises": [
      {
        "name": "Exercise Name",
        "sets": "3",
        "reps": "10-12",
        "rest": "60s",
        "description": "How to perform this exercise"
      }
    ],
    "cooldown": ["Cool down exercise 1", "Cool down exercise 2"]
  }
}

Make the workout appropriate for the user's experience level and sport-specific. Include proper warm-up and cool-down. Ensure exercises are safe and progressive.`;

        const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + geminiApiKey, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: workoutPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          })
        });

        if (!geminiResponse.ok) {
          console.error(`Gemini API error for user ${scheduledWorkout.user_id}:`, await geminiResponse.text());
          continue;
        }

        const geminiData = await geminiResponse.json();
        const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
          console.error(`No generated text for user ${scheduledWorkout.user_id}`);
          continue;
        }

        // Parse the JSON from the generated text
        let workoutData;
        try {
          const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            workoutData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in response');
          }
        } catch (parseError) {
          console.error(`Failed to parse workout JSON for user ${scheduledWorkout.user_id}:`, parseError);
          continue;
        }

        // Save the generated workout to the database
        const { data: savedWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: scheduledWorkout.user_id,
            title: workoutData.title,
            description: workoutData.description,
            sport: workoutData.sport,
            workout_type: workoutData.workout_type,
            duration: workoutData.duration,
            exercises: workoutData.exercises,
            completed: false
          })
          .select()
          .single();

        if (workoutError) {
          console.error(`Error saving workout for user ${scheduledWorkout.user_id}:`, workoutError);
          continue;
        }

        // Update the scheduled workout with the generated workout ID
        const { error: updateError } = await supabase
          .from('scheduled_workouts')
          .update({ workout_id: savedWorkout.id })
          .eq('id', scheduledWorkout.id);

        if (updateError) {
          console.error(`Error updating scheduled workout ${scheduledWorkout.id}:`, updateError);
          continue;
        }

        generatedCount++;
        console.log(`Successfully generated workout for user ${scheduledWorkout.user_id}`);

      } catch (error) {
        console.error(`Error generating workout for user ${scheduledWorkout.user_id}:`, error);
        continue;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully generated ${generatedCount} workouts for ${today}`,
        generated: generatedCount,
        total: scheduledWorkouts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in morning-workout-generation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});