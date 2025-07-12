-- Create workout_performance table for tracking specific performance metrics
CREATE TABLE public.workout_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'strength', 'cardio', 'endurance', etc.
  value NUMERIC,
  unit TEXT, -- 'lbs', 'kg', 'yards', 'meters', 'minutes', 'seconds'
  reps INTEGER,
  sets INTEGER,
  time_seconds INTEGER,
  distance NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_performance ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_performance
CREATE POLICY "Users can view their own performance data" 
ON public.workout_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own performance data" 
ON public.workout_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance data" 
ON public.workout_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own performance data" 
ON public.workout_performance 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_workout_performance_updated_at
BEFORE UPDATE ON public.workout_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create coaching_conversations table for AI coaching chat
CREATE TABLE public.coaching_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_user BOOLEAN NOT NULL DEFAULT true,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coaching_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for coaching_conversations
CREATE POLICY "Users can view their own coaching conversations" 
ON public.coaching_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own coaching conversations" 
ON public.coaching_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coaching conversations" 
ON public.coaching_conversations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coaching conversations" 
ON public.coaching_conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN notification_preferences JSONB DEFAULT '{
  "workout_reminders": true,
  "achievement_alerts": true,
  "progress_updates": true,
  "rest_day_reminders": true,
  "reminder_time": "09:00",
  "frequency": "daily"
}'::jsonb;