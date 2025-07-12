-- Create table for games and meets
CREATE TABLE public.scheduled_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('game', 'meet', 'tournament', 'competition')),
  sport TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  location TEXT,
  opponent TEXT,
  notes TEXT,
  result TEXT, -- Won/Lost/Draw for games, final time/score for meets
  performance_data JSONB, -- Goals, assists, times, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scheduled_events ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own events" 
ON public.scheduled_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events" 
ON public.scheduled_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON public.scheduled_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.scheduled_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_scheduled_events_updated_at
BEFORE UPDATE ON public.scheduled_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();