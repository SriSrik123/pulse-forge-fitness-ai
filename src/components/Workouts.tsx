import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkoutViewer } from "./WorkoutViewer"
import { WorkoutPlanGenerator } from "./WorkoutPlanGenerator"
import { WorkoutCalendar } from "./WorkoutCalendar"
import { Activity, Calendar, Settings, Eye } from "lucide-react"

interface WorkoutsProps {
  workoutType?: string | null
}

export function Workouts({ workoutType }: WorkoutsProps) {
  const [activeTab, setActiveTab] = useState(workoutType ? "workout" : "plan")
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)

  useEffect(() => {
    if (workoutType) {
      setActiveTab("workout")
    }
  }, [workoutType])

  useEffect(() => {
    // Listen for workout selection events from dashboard
    const handleShowWorkout = (event: CustomEvent) => {
      const { workoutId } = event.detail
      setSelectedWorkoutId(workoutId)
      setActiveTab("viewer")
    }

    window.addEventListener('showWorkout', handleShowWorkout as EventListener)
    return () => window.removeEventListener('showWorkout', handleShowWorkout as EventListener)
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold mb-2">Workout Management</h1>
        <p className="text-muted-foreground">
          Generate individual workouts, create monthly plans, and track your progress
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workout" className="flex items-center gap-1 text-xs sm:text-sm">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Today's Workout</span>
            <span className="sm:hidden">Today</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-1 text-xs sm:text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Monthly Plan</span>
            <span className="sm:hidden">Plan</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1 text-xs sm:text-sm">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar & History</span>
            <span className="sm:hidden">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="viewer" className="flex items-center gap-1 text-xs sm:text-sm">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Workout</span>
            <span className="sm:hidden">View</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workout" className="mt-6">
          <WorkoutViewer workoutType={workoutType} />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <WorkoutPlanGenerator />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <WorkoutCalendar />
        </TabsContent>

        <TabsContent value="viewer" className="mt-6">
          {selectedWorkoutId ? (
            <WorkoutViewer workoutId={selectedWorkoutId} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Select a workout to view</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}