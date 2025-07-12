import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Search, UserPlus, Check, X } from "lucide-react"
import { toast } from "sonner"

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url?: string
}

interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  friend_profile: Profile
}

export function Friends() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', user?.id)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user?.id,
          friend_id: friendId,
          status: 'pending'
        })

      if (error) throw error
      toast.success('Friend request sent!')
      setSearchResults(prev => prev.filter(p => p.id !== friendId))
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('Failed to send friend request')
    }
  }

  const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({ status })
        .eq('id', requestId)

      if (error) throw error
      toast.success(`Friend request ${status}!`)
      loadFriends()
    } catch (error) {
      console.error('Error responding to friend request:', error)
      toast.error('Failed to respond to friend request')
    }
  }

  const loadFriends = async () => {
    if (!user?.id) return

    try {
      // Load accepted friends
      const { data: acceptedFriends, error: friendsError } = await supabase
        .from('friends')
        .select(`
          id, user_id, friend_id, status, created_at
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      // Load pending requests received  
      const { data: pendingRequests, error: requestsError } = await supabase
        .from('friends')
        .select(`
          id, user_id, friend_id, status, created_at
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending')

      // Get friend profiles separately
      const friendIds = acceptedFriends?.map(f => f.friend_id) || []
      const requestUserIds = pendingRequests?.map(r => r.user_id) || []
      
      const { data: friendProfiles } = friendIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', friendIds) : { data: [] }
        
      const { data: requestProfiles } = requestUserIds.length > 0 ? await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', requestUserIds) : { data: [] }

      // Combine data
      const friendsWithProfiles = acceptedFriends?.map(friend => ({
        ...friend,
        friend_profile: friendProfiles?.find(p => p.id === friend.friend_id)
      })) || []

      const requestsWithProfiles = pendingRequests?.map(request => ({
        ...request,
        friend_profile: requestProfiles?.find(p => p.id === request.user_id)
      })) || []

      if (friendsError) throw friendsError
      if (requestsError) throw requestsError

      setFriends(friendsWithProfiles as any)
      setFriendRequests(requestsWithProfiles as any)
    } catch (error) {
      console.error('Error loading friends:', error)
      toast.error('Failed to load friends')
    }
  }

  useEffect(() => {
    loadFriends()
  }, [user?.id])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Users */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Friends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {loading && <div className="text-center text-muted-foreground">Searching...</div>}
          
          <div className="space-y-2">
            {searchResults.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-pulse-blue to-pulse-cyan text-white">
                      {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{profile.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">@{profile.username}</div>
                  </div>
                </div>
                <Button
                  onClick={() => sendFriendRequest(profile.id)}
                  size="sm"
                  className="bg-pulse-blue hover:bg-pulse-blue/80"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <Card className="glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Friend Requests
              <Badge variant="secondary">{friendRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {friendRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-pulse-blue to-pulse-cyan text-white">
                      {request.friend_profile?.full_name?.charAt(0) || request.friend_profile?.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{request.friend_profile?.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">@{request.friend_profile?.username}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => respondToFriendRequest(request.id, 'accepted')}
                    size="sm"
                    className="bg-pulse-green hover:bg-pulse-green/80"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => respondToFriendRequest(request.id, 'declined')}
                    size="sm"
                    variant="outline"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friends
            <Badge variant="secondary">{friends.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No friends yet. Start by searching for people to add!
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-pulse-blue to-pulse-cyan text-white">
                      {friend.friend_profile?.full_name?.charAt(0) || friend.friend_profile?.username?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{friend.friend_profile?.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">@{friend.friend_profile?.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}