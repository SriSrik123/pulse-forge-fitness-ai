
import { useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "./components/ThemeProvider"
import { AuthProvider, useAuth } from "./hooks/useAuth"
import { Navigation } from "./components/Navigation"
import { Dashboard } from "./components/Dashboard"
import { WorkoutGenerator } from "./components/WorkoutGenerator"
import { Workouts } from "./components/Workouts"
import { Profile } from "./components/Profile"
import { Settings } from "./components/Settings"
import { FitnessData } from "./components/FitnessData"
import { Auth } from "./components/Auth"
import { OnboardingSurvey } from "./components/OnboardingSurvey"
import { useOnboarding } from "./hooks/useOnboarding"

const queryClient = new QueryClient()

function AppContent() {
  const { user, loading } = useAuth()
  const { needsOnboarding, loading: onboardingLoading, completeOnboarding } = useOnboarding()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [workoutType, setWorkoutType] = useState<string | null>(null)

  if (loading || onboardingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pulse-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  if (needsOnboarding) {
    return <OnboardingSurvey onComplete={completeOnboarding} />
  }

  const handleTabChange = (tab: string, type?: string) => {
    setActiveTab(tab)
    if (type) {
      setWorkoutType(type)
    } else {
      setWorkoutType(null)
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={handleTabChange} />
      case 'workouts':
        return <Workouts workoutType={workoutType} />
      case 'generate':
        return <WorkoutGenerator />
      case 'fitness-data':
        return <FitnessData />
      case 'profile':
        return <Profile />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard onTabChange={handleTabChange} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="pt-20 pb-20 px-4 max-w-md mx-auto">
        {renderContent()}
      </main>
    </div>
  )
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="pulsetrack-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
            <Toaster />
            <Sonner />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
