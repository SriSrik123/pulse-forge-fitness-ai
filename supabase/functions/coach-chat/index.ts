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

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert fitness coach with access to the user's workout history and performance data. 

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

Be encouraging, specific, and reference their actual workout data when relevant. Keep responses concise but helpful.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      }),
    });

    const openAIData = await openAIResponse.json();
    
    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIData.error?.message || 'Unknown error'}`);
    }

    const aiMessage = openAIData.choices[0].message.content;

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