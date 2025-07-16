
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface AchievementCardProps {
  icon: LucideIcon
  title: string
  description: string
  progress: number
  maxProgress: number
  isUnlocked: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export function AchievementCard({
  icon: Icon,
  title,
  description,
  progress,
  maxProgress,
  isUnlocked,
  rarity
}: AchievementCardProps) {
  const rarityColors = {
    common: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    rare: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    legendary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  }

  const progressPercentage = (progress / maxProgress) * 100

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 ${
      isUnlocked ? 'bg-gradient-to-br from-background to-muted/50' : 'opacity-60 grayscale'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            isUnlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{title}</h3>
              <Badge variant="secondary" className={`text-xs px-2 py-0 ${rarityColors[rarity]}`}>
                {rarity}
              </Badge>
            </div>
            
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{description}</p>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}/{maxProgress}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary rounded-full h-1.5 transition-all duration-300"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
