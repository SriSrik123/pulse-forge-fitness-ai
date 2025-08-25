import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Trophy } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { SportSpecificProgress } from "./SportSpecificProgress"

export function ProgressAnalytics() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Please sign in to view your progress.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pulse-blue to-pulse-cyan bg-clip-text text-transparent">
            Progress Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your performance improvements over time
          </p>
        </div>
      </div>

      <Tabs defaultValue="sport-specific" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sport-specific">Sport-Specific Progress</TabsTrigger>
          <TabsTrigger value="overall">Overall Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sport-specific" className="space-y-6">
          <SportSpecificProgress />
        </TabsContent>

        <TabsContent value="overall" className="space-y-6">
          <Card>
            <CardContent className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Overall Analytics</h3>
              <p className="text-muted-foreground">
                Overall analytics coming soon! For now, check out your sport-specific progress.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}