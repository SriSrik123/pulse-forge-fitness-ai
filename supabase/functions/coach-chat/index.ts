import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, user_id } = await req.json();

    // Get user's workout history and performance data
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select(`
        *,
        workout_performance (*)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (workoutsError) throw workoutsError;

    // Get user's sport profile
    const { data: profile, error: profileError } = await supabase
      .from('user_sport_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    // Prepare context for AI
    const workoutHistory = workouts?.map(w => ({
      date: w.created_at,
      title: w.title,
      sport: w.sport,
      type: w.workout_type,
      completed: w.completed,
      feeling: w.feeling,
      journal: w.journal_entry,
      performance: w.workout_performance || []
    })) || [];

    const userContext = {
      sport: profile?.primary_sport || 'general fitness',
      experience: profile?.experience_level || 'beginner',
      goals: profile?.current_goals || 'general fitness',
      recent_workouts: workoutHistory.slice(0, 5)
    };

    // Call Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GEMINI_API_KEY'),
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert fitness coach with access to the user's workout history and performance data. 

User Profile:
- Primary Sport: ${userContext.sport}
- Experience Level: ${userContext.experience}
- Goals: ${userContext.goals}

Recent Workout History:
${JSON.stringify(userContext.recent_workouts, null, 2)}

Provide personalized, actionable fitness advice. You can:
- Analyze workout patterns and suggest improvements
- Comment on performance trends
- Provide form and technique tips
- Suggest workout modifications
- Answer general fitness questions
- Give recovery and nutrition advice

Be encouraging, specific, and reference their actual workout data when relevant. Keep responses concise but helpful.

User Question: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      }),
    });

    const geminiData = await geminiResponse.json();
    
    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiData.error?.message || 'Unknown error'}`);
    }

    const aiMessage = geminiData.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ message: aiMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in coach-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: "I'm having trouble connecting right now. Please try again in a moment."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});