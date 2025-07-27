
import { Home, Activity, BarChart3, Users, MessageCircle, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./ThemeToggle"
import { ProfileDropdown } from "./ProfileDropdown"
import { Logo } from "./Logo"

interface NavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'workouts', icon: Activity, label: 'Workouts' },
    { id: 'coaching', icon: MessageCircle, label: 'Coach' },
    { id: 'analytics', icon: BarChart3, label: 'Progress' },
  ]

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3 pt-12 md:pt-3">
          <div className="flex items-center space-x-2">
            <Logo size="sm" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-pulse-blue to-pulse-cyan bg-clip-text text-transparent">
              Coached
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ProfileDropdown onTabChange={onTabChange} />
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </>
  )
}
