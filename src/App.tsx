
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
import { Friends } from "./components/Friends"
import { Profile } from "./components/Profile"
import { Achievements } from "./components/Achievements"
import { LikedWorkouts } from "./components/LikedWorkouts"
import { Coaching } from "./components/Coaching"
import { ProgressAnalytics } from "./components/ProgressAnalytics"
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
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)
  const [workoutType, setWorkoutType] = useState<string | null>(null)
  const [showAchievements, setShowAchievements] = useState(false)

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
    setShowAchievements(false) // Close achievements when switching tabs
    if (type) {
      setWorkoutType(type)
    } else {
      setWorkoutType(null)
    }
  }

  const renderContent = () => {
    if (showAchievements) {
      return <Achievements onBack={() => setShowAchievements(false)} />
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={handleTabChange} setActiveTab={setActiveTab} />
      case 'workouts':
        return <Workouts workoutType={workoutType} />
      case 'coaching':
        return <Coaching />
      case 'analytics':
        return <ProgressAnalytics />
      case 'friends':
        return <Friends />
      case 'generate':
        return <WorkoutGenerator />
      case 'fitness-data':
        return <FitnessData />
      case 'liked-workouts':
        return (
          <LikedWorkouts 
            onShowWorkout={(workoutId) => {
              setSelectedWorkoutId(workoutId)
              setActiveTab('workouts')
              // Trigger the event to show the specific workout
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('showWorkout', { detail: { workoutId } }))
              }, 100)
            }} 
          />
        )
      case 'profile':
        return <Profile />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard onTabChange={handleTabChange} setActiveTab={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      
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
