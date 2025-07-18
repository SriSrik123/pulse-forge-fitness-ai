
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { User, Settings, LogOut, Users, MessageSquarePlus, Heart } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { FeedbackForm } from "./FeedbackForm"

interface ProfileDropdownProps {
  onTabChange: (tab: string) => void
}

interface Profile {
  full_name: string | null
  username: string | null
  avatar_url: string | null
}

export function ProfileDropdown({ onTabChange }: ProfileDropdownProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', user.id)
          .single()
        
        if (!error) {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }

    fetchProfile()
  }, [user])

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (profile?.username) {
      return profile.username.slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name
    }
    if (profile?.username) {
      return profile.username
    }
    if (user?.email) {
      const emailName = user.email.split('@')[0]
      return emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }
    return "User"
  }

  const getDisplaySubtext = () => {
    if (profile?.username && profile?.full_name) {
      return `@${profile.username}`
    }
    return user?.email || ""
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url || ""} alt="Profile" />
            <AvatarFallback className="bg-pulse-blue text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur border" align="end" forceMount>
        <div className="flex flex-col space-y-1 p-2">
          <p className="text-sm font-medium leading-none">
            {getDisplayName()}
          </p>
          <p className="text-xs leading-none text-muted-foreground">
            {getDisplaySubtext()}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onTabChange('profile')}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onTabChange('liked-workouts')}
          className="cursor-pointer"
        >
          <Heart className="mr-2 h-4 w-4" />
          <span>Liked Workouts</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onTabChange('friends')}
          className="cursor-pointer"
        >
          <Users className="mr-2 h-4 w-4" />
          <span>Friends</span>
        </DropdownMenuItem>
        <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
              <MessageSquarePlus className="mr-2 h-4 w-4" />
              <span>Send Feedback</span>
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <FeedbackForm onClose={() => setFeedbackOpen(false)} />
          </DialogContent>
        </Dialog>
        <DropdownMenuItem 
          onClick={() => onTabChange('settings')}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
