import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HelpCircle, Send, Bot } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"

interface WorkoutQuestionsProps {
  workout: any
  onClose: () => void
}

interface QAItem {
  question: string
  answer: string
  timestamp: Date
}

export function WorkoutQuestions({ workout, onClose }: WorkoutQuestionsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(false)
  const [qaHistory, setQaHistory] = useState<QAItem[]>([])

  const handleAskQuestion = async () => {
    if (!user || !question.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('ask-workout-question', {
        body: {
          question: question,
          workoutData: workout,
          sport: workout.sport,
          workoutId: null
        }
      })

      if (error) throw error

      if (data?.answer) {
        const newQA: QAItem = {
          question: question,
          answer: data.answer,
          timestamp: new Date()
        }
        
        setQaHistory(prev => [newQA, ...prev])
        setQuestion("")
        
        toast({
          title: "Question Answered",
          description: "Your fitness coach has responded!",
        })
      }
    } catch (error) {
      console.error('Error asking question:', error)
      toast({
        title: "Error",
        description: "Failed to get answer. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  return (
    <Card className="glass border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-pulse-green" />
          Ask Questions About Your Workout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Input */}
        <div className="space-y-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about your workout... How should I pace the 100s? What if I don't have a kickboard? How can I improve my technique?"
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleAskQuestion}
              disabled={!question.trim() || loading}
              size="sm"
              className="bg-pulse-green hover:bg-pulse-green/80 text-white"
            >
              {loading ? (
                <>
                  <Bot className="mr-2 h-4 w-4 animate-pulse" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Ask Coach
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        {/* Q&A History */}
        {qaHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recent Questions & Answers</h4>
            <ScrollArea className="h-[300px] w-full">
              <div className="space-y-4">
                {qaHistory.map((qa, index) => (
                  <div key={index} className="space-y-2">
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 text-pulse-blue mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">You asked:</p>
                          <p className="text-sm text-muted-foreground">{qa.question}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-pulse-green/10 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Bot className="h-4 w-4 text-pulse-green mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-pulse-green">Coach answered:</p>
                          <p className="text-sm whitespace-pre-wrap">{qa.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  )
}