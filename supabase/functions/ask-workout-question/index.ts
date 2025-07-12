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

    const { question, workoutData, sport, workoutId } = await req.json();

    console.log('Processing workout question:', { question, sport });

    // Create context about the workout
    const workoutContext = workoutData ? `
    Current workout details:
    - Title: ${workoutData.title}
    - Sport: ${workoutData.sport}
    - Duration: ${workoutData.duration} minutes
    - Type: ${workoutData.type}
    
    Warm-up: ${workoutData.warmup?.join(', ')}
    
    Main exercises:
    ${workoutData.exercises?.map(ex => `${ex.name} - ${ex.sets} sets x ${ex.reps} reps (Rest: ${ex.rest || '60s'})`).join('\n')}
    
    Cool-down: ${workoutData.cooldown?.join(', ')}
    ` : '';

    const prompt = `You are a fitness coach answering a question about a workout. Be helpful, specific, and safety-conscious.

${workoutContext}

User question: ${question}

Please provide a clear, informative answer that:
1. Addresses their specific question
2. Considers their current workout context
3. Provides actionable advice
4. Mentions any safety considerations if relevant
5. Keeps the response concise but thorough

Answer:`;

    console.log('Calling Gemini API for workout question...');

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
      throw new Error(data.error?.message || 'Failed to get answer from AI service');
    }

    let answer = "I'm sorry, I couldn't provide an answer at this time.";
    
    if (data.candidates && data.candidates[0]) {
      answer = data.candidates[0].content.parts[0].text;
    }

    // Save the question and answer to database
    const { error: saveError } = await supabaseClient
      .from('workout_questions')
      .insert({
        user_id: user.id,
        workout_id: workoutId,
        question: question,
        answer: answer,
        sport: sport
      });

    if (saveError) {
      console.error('Error saving question:', saveError);
      // Continue anyway, user still gets their answer
    }

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ask-workout-question function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process question. Please try again.',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});