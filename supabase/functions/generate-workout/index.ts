
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
      scheduledWorkoutId = null,
      userPreferences = "",
      userFeedback = "",
      coachSuggestions = ""
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
        sport: w.sport,
        journal_entry: w.journal_entry,
        feeling: w.feeling
      }));
      
      workoutHistory = `
      
RECENT WORKOUT HISTORY (consider for progression and variety):
${recentWorkouts.map(w => `- ${w.title} (${w.completed ? 'completed' : 'not completed'}) - ${new Date(w.date).toLocaleDateString()}${w.journal_entry ? ` | Notes: ${w.journal_entry}` : ''}${w.feeling ? ` | Feeling: ${w.feeling}` : ''}`).join('\n')}

Please ensure this workout:
1. Progresses appropriately from recent sessions
2. Varies exercises to prevent monotony
3. Adjusts intensity based on completion patterns
4. Builds upon previous training adaptations
5. Takes into account any notes or feelings from previous workouts
      `;
    }

    const preferencesContext = userPreferences ? `
    
USER PREFERENCES AND GOALS:
${userPreferences}

Please incorporate these preferences into the workout design.
    ` : "";

    const coachSuggestionsContext = coachSuggestions ? `
    
AI COACH SUGGESTIONS:
${coachSuggestions}

IMPORTANT: Incorporate these AI coach suggestions into the workout design. The user has specifically requested this type of workout through the AI coach.
    ` : "";

    // Get user feedback for this sport
    let feedbackContext = "";
    if (sport) {
      try {
        const { data: feedback } = await supabaseClient
          .from('workout_feedback')
          .select('*')
          .eq('user_id', user.id)
          .eq('sport', sport)
          .order('created_at', { ascending: false })
          .limit(5);

        if (feedback && feedback.length > 0) {
          feedbackContext = `
          
USER FEEDBACK FROM PREVIOUS WORKOUTS:
${feedback.map(f => `- ${f.feedback_text} (${f.feedback_type})`).join('\n')}

IMPORTANT: Please incorporate this feedback into the workout design and adjust accordingly.
          `;
        }
      } catch (error) {
        console.error('Error fetching user feedback:', error);
      }
    }

    const userFeedbackContext = userFeedback ? `
    
SPECIFIC USER FEEDBACK FOR THIS REGENERATION:
${userFeedback}

Please address this feedback directly in the new workout.
    ` : "";
    
    if (sport && sessionType) {
      const availableEquipment = sportEquipmentList?.join(", ") || "basic equipment";
      
      // Get upcoming events to consider for workout planning
      let upcomingEventsContext = "";
      try {
        const { data: upcomingEvents } = await supabaseClient
          .from('scheduled_events')
          .select('*')
          .eq('user_id', user.id)
          .eq('sport', sport)
          .gte('scheduled_date', new Date().toISOString().split('T')[0])
          .order('scheduled_date', { ascending: true })
          .limit(3);

        if (upcomingEvents && upcomingEvents.length > 0) {
          upcomingEventsContext = `

UPCOMING EVENTS TO PREPARE FOR:
${upcomingEvents.map(e => `- ${e.title} (${e.event_type}) on ${e.scheduled_date}${e.opponent ? ` vs ${e.opponent}` : ''}`).join('\n')}

IMPORTANT: Tailor this workout to prepare for these upcoming events. Include sport-specific drills and conditioning.
          `;
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      }

      let sportSpecificInstructions = "";
      if (sport === 'swimming') {
        sportSpecificInstructions = `
        
SWIMMING SPECIFIC REQUIREMENTS:
- DO NOT use "sets" terminology - use proper swimming notation instead
- Format as distance/exercise with interval time (e.g., "4x50 freestyle on 1:30")
- Include interval times based on fitness level:
  * Beginner: Easy pace with long intervals (e.g., 4x50 free on 1:30)
  * Intermediate: Moderate pace (e.g., 6x50 free on 1:15) 
  * Advanced: Faster pace with shorter intervals (e.g., 8x50 free on 1:00)
- Include stroke variety (freestyle, backstroke, breaststroke, butterfly)
- For JSON format: put the full exercise description in "reps" field and interval in "interval" field, leave "sets" empty
- Example JSON exercise: {"name": "Freestyle Distance", "sets": "", "reps": "4x50 freestyle", "interval": "1:30", "description": "Focus on technique and breathing"}
- IMPORTANT: Use "interval" instead of "rest" for swimming workouts
        `;
      } else if (sport === 'running') {
        sportSpecificInstructions = `
        
RUNNING SPECIFIC REQUIREMENTS:
- Use running notation (e.g., "6x400m" instead of "6 sets of 400m")
- Include pace targets and recovery times based on fitness level:
  * Beginner: Easy pace with full recovery
  * Intermediate: Moderate effort with 90s-2min recovery
  * Advanced: Faster paces with 60-90s recovery
- Format clearly: "6x400m at 5K pace, 90s recovery"
        `;
      } else if (sport === 'soccer') {
        sportSpecificInstructions = `
        
SOCCER SPECIFIC REQUIREMENTS:
- Include technical drills: passing, dribbling, first touch, shooting
- Add small-sided games and scrimmage scenarios
- Focus on position-specific skills
- Include agility and speed work relevant to soccer
- Example exercises: "Cone dribbling drill (5 cones, 2 touches max)", "Passing accuracy drill (15 yards, both feet)", "1v1 attacking drill"
        `;
      } else if (sport === 'basketball') {
        sportSpecificInstructions = `
        
BASKETBALL SPECIFIC REQUIREMENTS:
- Include ball handling drills, shooting drills, and defensive movements
- Add court vision and decision-making scenarios
- Focus on explosive movements and position skills
- Include layup drills, free throws, and game situations
- Example exercises: "Mikan drill (10 per side)", "Defensive slide drill", "3-point shooting (5 spots)"
        `;
      } else if (sport === 'tennis') {
        sportSpecificInstructions = `
        
TENNIS SPECIFIC REQUIREMENTS:
- Include stroke technique drills: forehand, backhand, serve, volley
- Add footwork and court movement patterns
- Focus on consistency and placement drills
- Include match play scenarios and strategy
- Example exercises: "Cross-court forehand drill (20 shots)", "Service placement drill", "Approach shot and volley"
        `;
      } else if (sport === 'cycling') {
        sportSpecificInstructions = `
        
CYCLING SPECIFIC REQUIREMENTS:
- Include interval training with power/pace zones
- Add technique drills for efficiency and cadence
- Focus on endurance and hill training
- Include sprint and climbing intervals
- Example exercises: "4x5min at threshold power", "Cadence drills (90-110 rpm)", "Hill repeats (8% grade, 2min efforts)"
        `;
      }
      
      prompt = `Generate a ${duration}-minute ${sport} ${sessionType} session for a ${fitnessLevel} level athlete.
      Available equipment: ${availableEquipment}.
      Goals: ${goals || `improve ${sport} performance`}.${workoutHistory}${preferencesContext}${coachSuggestionsContext}${feedbackContext}${userFeedbackContext}${upcomingEventsContext}${sportSpecificInstructions}
      
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
        "exercises": [{"name": "Exercise Name", "sets": 3, "reps": "8-12", ${sport === 'swimming' ? '"interval"' : '"rest"'}: "60s", "description": "Brief description", "sportSpecific": true}],
        "cooldown": ["stretch 1", "stretch 2", "stretch 3"]
      }`;
    } else {
      prompt = `Generate a ${duration}-minute ${workoutType} workout for a ${fitnessLevel} fitness level person. 
      Equipment available: ${equipment || 'bodyweight only'}. 
      Goals: ${goals || 'general fitness'}.${workoutHistory}${preferencesContext}${coachSuggestionsContext}${feedbackContext}${userFeedbackContext}
      
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
