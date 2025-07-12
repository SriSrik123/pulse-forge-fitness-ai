-- Create smartwatch_data table for storing manually entered data from smartwatches
CREATE TABLE public.smartwatch_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.smartwatch_data ENABLE ROW LEVEL SECURITY;

-- Create policies for smartwatch data
CREATE POLICY "Users can view their own smartwatch data" 
ON public.smartwatch_data 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own smartwatch data" 
ON public.smartwatch_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own smartwatch data" 
ON public.smartwatch_data 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own smartwatch data" 
ON public.smartwatch_data 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_smartwatch_data_updated_at
BEFORE UPDATE ON public.smartwatch_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();