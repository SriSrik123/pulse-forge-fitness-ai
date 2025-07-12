-- Create table for workout feedback to remember user preferences
CREATE TABLE public.workout_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_id UUID,
  sport TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  feedback_type TEXT DEFAULT 'improvement' CHECK (feedback_type IN ('improvement', 'preference', 'difficulty', 'general')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own feedback" 
ON public.workout_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback" 
ON public.workout_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" 
ON public.workout_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback" 
ON public.workout_feedback 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE TRIGGER update_workout_feedback_updated_at
BEFORE UPDATE ON public.workout_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for workout questions and answers
CREATE TABLE public.workout_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_id UUID,
  question TEXT NOT NULL,
  answer TEXT,
  sport TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for workout questions
CREATE POLICY "Users can view their own questions" 
ON public.workout_questions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own questions" 
ON public.workout_questions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questions" 
ON public.workout_questions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questions" 
ON public.workout_questions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for workout questions
CREATE TRIGGER update_workout_questions_updated_at
BEFORE UPDATE ON public.workout_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();