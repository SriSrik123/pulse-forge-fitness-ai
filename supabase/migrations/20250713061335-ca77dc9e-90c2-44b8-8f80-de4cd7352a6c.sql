-- Create workout_likes table to track liked workouts
CREATE TABLE public.workout_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workout_id)
);

-- Enable Row Level Security
ALTER TABLE public.workout_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for workout likes
CREATE POLICY "Users can view their own workout likes" 
ON public.workout_likes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout likes" 
ON public.workout_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout likes" 
ON public.workout_likes 
FOR DELETE 
USING (auth.uid() = user_id);