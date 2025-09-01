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

        // Get previous workouts for context and uniqueness
        const { data: previousWorkouts } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', scheduledWorkout.user_id)
          .eq('sport', scheduledWorkout.sport)
          .order('created_at', { ascending: false })
          .limit(8);

        // Also get recent workouts from the same workout type
        const { data: recentSameType } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', scheduledWorkout.user_id)
          .eq('workout_type', scheduledWorkout.workout_type)
          .order('created_at', { ascending: false })
          .limit(5);

        // Combine and deduplicate
        const allRecentWorkouts = [...(previousWorkouts || []), ...(recentSameType || [])]
          .filter((workout, index, self) => 
            index === self.findIndex(w => w.id === workout.id)
          )
          .slice(0, 8);

        // Extract exercise patterns from recent workouts for uniqueness
        const recentExercises = [];
        const recentPatterns = [];
        
        if (allRecentWorkouts && allRecentWorkouts.length > 0) {
          allRecentWorkouts.forEach(w => {
            if (w.exercises && w.exercises.exercises) {
              const exerciseNames = w.exercises.exercises.map(ex => ex.name);
              recentExercises.push(...exerciseNames);
              recentPatterns.push({
                title: w.title,
                exercises: exerciseNames.slice(0, 3),
                date: new Date(w.created_at).toLocaleDateString()
              });
            }
          });
        }

        const uniqueRecentExercises = [...new Set(recentExercises)];

        // Generate workout using Gemini
        const workoutPrompt = `Generate a detailed ${scheduledWorkout.workout_type} workout for ${scheduledWorkout.sport}.
        
User Profile:
- Experience Level: ${profile.experience_level}
- Session Duration: ${profile.session_duration} minutes
- Training Frequency: ${profile.training_frequency} times per week
- Competitive Level: ${profile.competitive_level}
- Goals: ${profile.current_goals || 'General fitness improvement'}

RECENT WORKOUT PATTERNS (MUST AVOID REPETITION):
${recentPatterns.map(p => `- ${p.title} (${p.date}): ${p.exercises.join(', ')}`).join('\n')}

CRITICAL UNIQUENESS REQUIREMENTS:
1. DO NOT use these exercises from recent workouts: ${uniqueRecentExercises.join(', ')}
2. Create completely different exercises and workout structure
3. Vary the training focus and muscle group emphasis
4. Use different rep ranges, sets, and rest patterns
5. Change the workout format and organization
6. For ${scheduledWorkout.sport}: focus on different aspects/skills than recent sessions
7. This workout MUST feel fresh and distinct from recent sessions

MANDATORY: This session must be completely unique compared to the last ${allRecentWorkouts.length} workouts.

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