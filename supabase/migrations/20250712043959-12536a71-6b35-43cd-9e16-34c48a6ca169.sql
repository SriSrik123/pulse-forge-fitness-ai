-- Create workout_plans table for monthly training plans
CREATE TABLE public.workout_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  primary_sport TEXT NOT NULL,
  includes_strength BOOLEAN DEFAULT false,
  training_frequency INTEGER DEFAULT 3,
  multiple_sessions_per_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scheduled_workouts table for individual workout sessions
CREATE TABLE public.scheduled_workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  session_time_of_day TEXT DEFAULT 'morning', -- morning, afternoon, evening
  sport TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  skipped BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_plan_preferences table for customization
CREATE TABLE public.workout_plan_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  frequency_per_week INTEGER DEFAULT 1,
  preferred_days TEXT[], -- array of days like ['monday', 'wednesday', 'friday']
  session_duration INTEGER DEFAULT 60,
  equipment TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for workout_plans
CREATE POLICY "Users can view their own workout plans" 
ON public.workout_plans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout plans" 
ON public.workout_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout plans" 
ON public.workout_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout plans" 
ON public.workout_plans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for scheduled_workouts
CREATE POLICY "Users can view their own scheduled workouts" 
ON public.scheduled_workouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled workouts" 
ON public.scheduled_workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled workouts" 
ON public.scheduled_workouts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled workouts" 
ON public.scheduled_workouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for workout_plan_preferences
CREATE POLICY "Users can view their own workout plan preferences" 
ON public.workout_plan_preferences 
FOR SELECT 
USING (plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own workout plan preferences" 
ON public.workout_plan_preferences 
FOR INSERT 
WITH CHECK (plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own workout plan preferences" 
ON public.workout_plan_preferences 
FOR UPDATE 
USING (plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own workout plan preferences" 
ON public.workout_plan_preferences 
FOR DELETE 
USING (plan_id IN (SELECT id FROM public.workout_plans WHERE user_id = auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_workout_plans_updated_at
BEFORE UPDATE ON public.workout_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_workouts_updated_at
BEFORE UPDATE ON public.scheduled_workouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();