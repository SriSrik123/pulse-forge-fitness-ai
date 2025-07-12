import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkoutGenerator } from "./WorkoutGenerator"
import { WorkoutPlanGenerator } from "./WorkoutPlanGenerator"
import { WorkoutCalendar } from "./WorkoutCalendar"
import { WorkoutHistory } from "./WorkoutHistory"
import { Activity, Calendar, Settings, History } from "lucide-react"

export function Workouts() {
  const [activeTab, setActiveTab] = useState("generate")

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
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Monthly Plan
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <WorkoutGenerator />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <WorkoutPlanGenerator />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <WorkoutCalendar />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <WorkoutHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}