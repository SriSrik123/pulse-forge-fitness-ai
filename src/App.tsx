
import { useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "./components/ThemeProvider"
import { Navigation } from "./components/Navigation"
import { Dashboard } from "./components/Dashboard"
import { WorkoutGenerator } from "./components/WorkoutGenerator"
import { Workouts } from "./components/Workouts"
import { Profile } from "./components/Profile"
import { Settings } from "./components/Settings"

const queryClient = new QueryClient()

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'workouts':
        return <Workouts />
      case 'generate':
        return <WorkoutGenerator />
      case 'profile':
        return <Profile />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="pulsetrack-ui-theme">
        <TooltipProvider>
          <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            
            <main className="pt-20 pb-20 px-4 max-w-md mx-auto">
              {renderContent()}
            </main>
            
            <Toaster />
            <Sonner />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
