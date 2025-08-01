-- Add workout sharing functionality and visibility preferences
CREATE TABLE IF NOT EXISTS shared_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE shared_workouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared workouts
CREATE POLICY "Users can send workouts to friends" ON shared_workouts
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    receiver_id IN (
      SELECT CASE 
        WHEN f.user_id = auth.uid() THEN f.friend_id 
        ELSE f.user_id 
      END
      FROM friends f 
      WHERE (f.user_id = auth.uid() OR f.friend_id = auth.uid()) 
      AND f.status = 'accepted'
    )
  );

CREATE POLICY "Users can view their sent and received workouts" ON shared_workouts
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update shared workouts they received" ON shared_workouts
  FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own shared workouts" ON shared_workouts
  FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Add privacy preferences to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{"show_workouts_to_friends": true, "allow_workout_sharing": true}'::jsonb;

-- Add trigger for updated_at
CREATE TRIGGER update_shared_workouts_updated_at
  BEFORE UPDATE ON shared_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();