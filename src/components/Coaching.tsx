import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  message: string
  is_user: boolean
  workout_id?: string
  created_at: string
}

const SUGGESTED_RESPONSES = [
  "Create a strength training workout for me",
  "Design a HIIT cardio session", 
  "Plan a recovery day workout",
  "How can I improve my swimming technique?",
  "What should I focus on in my next workout?",
  "Analyze my recent workout performance",
  "Give me tips for recovery and nutrition",
  "How am I progressing towards my goals?",
  "What exercises can help prevent injuries?"
]

export function Coaching() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [user])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const loadMessages = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('coaching_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive"
      })
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue("")
    setIsLoading(true)

    try {
      // Save user message
      const { data: userMessageData, error: userError } = await supabase
        .from('coaching_conversations')
        .insert({
          user_id: user.id,
          message: userMessage,
          is_user: true
        })
        .select()
        .single()

      if (userError) throw userError

      setMessages(prev => [...prev, userMessageData])

      // Get AI response
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('coach-chat', {
        body: { message: userMessage, user_id: user.id }
      })

      if (aiError) throw aiError

      // Save AI response
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('coaching_conversations')
        .insert({
          user_id: user.id,
          message: aiResponse.message,
          is_user: false
        })
        .select()
        .single()

      if (aiMessageError) throw aiMessageError

      setMessages(prev => [...prev, aiMessageData])
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedResponse = (suggestion: string) => {
    setInputValue(suggestion)
    // Store workout-related suggestions in localStorage for workout generation
    if (suggestion.toLowerCase().includes('workout') || 
        suggestion.toLowerCase().includes('training') || 
        suggestion.toLowerCase().includes('hiit') ||
        suggestion.toLowerCase().includes('strength') ||
        suggestion.toLowerCase().includes('cardio') ||
        suggestion.toLowerCase().includes('plan')) {
      localStorage.setItem('coach-suggestions', suggestion)
    }
    sendMessage()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loadingMessages) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your coaching conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pulse-blue to-pulse-cyan bg-clip-text text-transparent">
          AI Fitness Coach
        </h1>
        <p className="text-muted-foreground mt-2">
          Get personalized advice based on your workout history and performance
        </p>
      </div>

      <Card className="h-[70vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Coaching Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          <ScrollArea className="flex-1 pr-4 mb-4 max-h-full" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Welcome to your AI Fitness Coach!</p>
                  <p className="text-sm mb-6">
                    Ask me about your workouts, progress, form tips, or any fitness-related questions.
                    I have access to your entire workout history to give you personalized advice.
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                    <p className="text-xs text-muted-foreground mb-2 text-center">Try asking:</p>
                    {SUGGESTED_RESPONSES.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedResponse(suggestion)}
                        className="text-xs text-left justify-start h-auto py-3 px-4 hover:bg-primary/10"
                        disabled={isLoading}
                      >
                        💬 {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.is_user ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!message.is_user && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10">
                          <Bot className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.is_user
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      <span className="text-xs opacity-70 block mt-1">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {message.is_user && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-secondary">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2 flex-shrink-0">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your workouts, progress, or get fitness advice..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}