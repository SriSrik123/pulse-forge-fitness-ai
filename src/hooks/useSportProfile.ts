
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
  availableEquipment: string[]
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
    currentGoals: '',
    availableEquipment: []
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

      let availableEquipment: string[] = []
      
      // Get equipment preferences from the most recent workout plan
      try {
        const { data: equipmentData } = await supabase
          .from('workout_plan_preferences')
          .select('equipment')
          .eq('plan_id', await getLatestPlanId())
          .eq('sport', data?.primary_sport || profile.primarySport)
          .single()
        
        if (equipmentData?.equipment) {
          availableEquipment = equipmentData.equipment
        }
      } catch (equipmentError) {
        console.log('No equipment preferences found, using defaults')
        // Set default equipment based on sport
        availableEquipment = getDefaultEquipmentForSport(data?.primary_sport || profile.primarySport)
      }

      if (data) {
        setProfile({
          primarySport: data.primary_sport,
          experienceLevel: data.experience_level,
          competitiveLevel: data.competitive_level,
          trainingFrequency: data.training_frequency,
          sessionDuration: data.session_duration,
          currentGoals: data.current_goals || '',
          availableEquipment
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const getLatestPlanId = async () => {
    if (!user) return null
    
    const { data } = await supabase
      .from('workout_plans')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    return data?.id
  }

  const getDefaultEquipmentForSport = (sport: string): string[] => {
    const equipmentMap: Record<string, string[]> = {
      swimming: ["Pool access", "Goggles", "Swimsuit", "Kickboard", "Pull buoy"],
      running: ["Running shoes", "Comfortable clothes", "Water bottle"],
      cycling: ["Bicycle", "Helmet", "Water bottle", "Cycling clothes"],
      basketball: ["Basketball", "Court access", "Athletic shoes"],
      soccer: ["Soccer ball", "Cleats", "Shin guards", "Goal access"],
      tennis: ["Tennis racket", "Tennis balls", "Court access", "Athletic shoes"],
      strength: ["Dumbbells", "Barbell", "Bench", "Resistance bands"],
      default: ["Bodyweight only", "Yoga mat", "Water bottle"]
    }
    return equipmentMap[sport] || equipmentMap.default
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

  const updateEquipment = async (equipment: string[]) => {
    if (!user) return false

    try {
      // Update the profile state
      const updatedProfile = { ...profile, availableEquipment: equipment }
      setProfile(updatedProfile)

      // Save to the latest workout plan preferences or create a general preference
      const planId = await getLatestPlanId()
      if (planId) {
        const { error } = await supabase
          .from('workout_plan_preferences')
          .upsert({
            plan_id: planId,
            sport: profile.primarySport,
            equipment: equipment,
            frequency_per_week: profile.trainingFrequency,
            session_duration: profile.sessionDuration
          })
        
        if (error) {
          console.error('Error updating equipment preferences:', error)
          return false
        }
      }
      
      return true
    } catch (error) {
      console.error('Error updating equipment:', error)
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
    updateEquipment,
    reload: loadProfile
  }
}
