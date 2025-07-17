
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function CreateWorkout() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [exercises, setExercises] = useState([{ name: "", sets: 3, reps: 10 }]);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createWorkoutMutation = useMutation({
    mutationFn: async (workoutData: any) => {
      const { data, error } = await supabase
        .from('workouts')
        .insert([workoutData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Workout created successfully!");
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      navigate('/workouts');
    },
    onError: (error) => {
      toast.error("Failed to create workout");
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const workoutData = {
      title,
      description,
      sport,
      workout_type: workoutType,
      exercises: exercises.filter(ex => ex.name.trim() !== ''),
    };

    createWorkoutMutation.mutate(workoutData);
  };

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: 3, reps: 10 }]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Workout Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter workout title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your workout"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sport">Sport</Label>
                <Select value={sport} onValueChange={setSport} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weightlifting">Weightlifting</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="swimming">Swimming</SelectItem>
                    <SelectItem value="cycling">Cycling</SelectItem>
                    <SelectItem value="yoga">Yoga</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="workoutType">Workout Type</Label>
                <Select value={workoutType} onValueChange={setWorkoutType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Exercises</Label>
                <Button type="button" variant="outline" onClick={addExercise}>
                  Add Exercise
                </Button>
              </div>
              
              {exercises.map((exercise, index) => (
                <div key={index} className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="Exercise name"
                    value={exercise.name}
                    onChange={(e) => {
                      const newExercises = [...exercises];
                      newExercises[index].name = e.target.value;
                      setExercises(newExercises);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Sets"
                    value={exercise.sets}
                    onChange={(e) => {
                      const newExercises = [...exercises];
                      newExercises[index].sets = parseInt(e.target.value) || 0;
                      setExercises(newExercises);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={exercise.reps}
                    onChange={(e) => {
                      const newExercises = [...exercises];
                      newExercises[index].reps = parseInt(e.target.value) || 0;
                      setExercises(newExercises);
                    }}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={createWorkoutMutation.isPending}>
              {createWorkoutMutation.isPending ? "Creating..." : "Create Workout"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
