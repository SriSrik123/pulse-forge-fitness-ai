
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export interface SportProfile {
  primarySport: string
  experienceLevel: string
  competitiveLevel: string
  trainingFrequency: number
  sessionDuration: number
  currentGoals: string
}

const SPORTS_MAP = {
  swimming: { label: "Swimming", icon: "🏊‍♂️" },
  running: { label: "Running", icon: "🏃‍♂️" },
  cycling: { label: "Cycling", icon: "🚴‍♂️" },
  basketball: { label: "Basketball", icon: "🏀" },
  soccer: { label: "Soccer", icon: "⚽" },
  tennis: { label: "Tennis", icon: "🎾" },
}

export function useSportProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<SportProfile>({
    primarySport: '',
    experienceLevel: '',
    competitiveLevel: '',
    trainingFrequency: 3,
    sessionDuration: 60,
    currentGoals: ''
  })
  const [loading, setLoading] = useState(false)

  const loadProfile = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_sport_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading sport profile:', error)
        return
      }

      if (data) {
        setProfile({
          primarySport: data.primary_sport,
          experienceLevel: data.experience_level,
          competitiveLevel: data.competitive_level,
          trainingFrequency: data.training_frequency,
          sessionDuration: data.session_duration,
          currentGoals: data.current_goals || ''
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (profileData: SportProfile) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('user_sport_profiles')
        .upsert({
          user_id: user.id,
          primary_sport: profileData.primarySport,
          experience_level: profileData.experienceLevel,
          competitive_level: profileData.competitiveLevel,
          training_frequency: profileData.trainingFrequency,
          session_duration: profileData.sessionDuration,
          current_goals: profileData.currentGoals,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving sport profile:', error)
        return false
      }

      setProfile(profileData)
      return true
    } catch (error) {
      console.error('Error saving sport profile:', error)
      return false
    }
  }

  useEffect(() => {
    loadProfile()
  }, [user])

  const getSportInfo = (sportValue: string) => {
    return SPORTS_MAP[sportValue as keyof typeof SPORTS_MAP] || { label: sportValue, icon: '🏃‍♂️' }
  }

  const hasProfile = () => {
    return profile.primarySport && profile.experienceLevel
  }

  return {
    profile,
    loading,
    getSportInfo,
    hasProfile,
    saveProfile,
    reload: loadProfile
  }
}
