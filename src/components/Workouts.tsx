
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
  const [activeTab, setActiveTab] = useState("viewer")
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  const [generatedWorkoutData, setGeneratedWorkoutData] = useState<any>(null)

  useEffect(() => {
    // Listen for workout selection events from dashboard
    const handleShowWorkout = (event: CustomEvent) => {
      const { workoutId } = event.detail
      setSelectedWorkoutId(workoutId)
      setGeneratedWorkoutData(null) // Clear generated workout data
      setActiveTab("viewer")
    }

    // Listen for generated workout events from DailyWorkoutGenerator
    const handleShowGeneratedWorkout = (event: CustomEvent) => {
      const { workoutData } = event.detail
      setGeneratedWorkoutData(workoutData)
      setSelectedWorkoutId(null) // Clear selected workout ID
      setActiveTab("viewer")
    }

    // Listen for navigation to workouts tab
    const handleNavigateToWorkouts = () => {
      setActiveTab("viewer")
    }

    window.addEventListener('showWorkout', handleShowWorkout as EventListener)
    window.addEventListener('showGeneratedWorkout', handleShowGeneratedWorkout as EventListener)
    window.addEventListener('navigateToWorkouts', handleNavigateToWorkouts as EventListener)
    return () => {
      window.removeEventListener('showWorkout', handleShowWorkout as EventListener)
      window.removeEventListener('showGeneratedWorkout', handleShowGeneratedWorkout as EventListener)
      window.removeEventListener('navigateToWorkouts', handleNavigateToWorkouts as EventListener)
    }
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="viewer" className="flex items-center gap-1 text-xs sm:text-sm">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Today's Workout</span>
            <span className="sm:hidden">Today</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-1 text-xs sm:text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Training Manager</span>
            <span className="sm:hidden">Training</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1 text-xs sm:text-sm">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar & History</span>
            <span className="sm:hidden">Calendar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viewer" className="mt-6">
          <WorkoutViewer workoutId={selectedWorkoutId} generatedWorkoutData={generatedWorkoutData} />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <WorkoutPlanGenerator />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <WorkoutCalendar />
        </TabsContent>
      </Tabs>
    </div>
  )
}
