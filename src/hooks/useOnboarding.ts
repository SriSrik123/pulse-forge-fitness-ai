
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export function useOnboarding() {
  const { user } = useAuth()
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking onboarding status:', error)
          setNeedsOnboarding(true)
        } else {
          setNeedsOnboarding(!data?.onboarding_completed)
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        setNeedsOnboarding(true)
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [user])

  const completeOnboarding = () => {
    setNeedsOnboarding(false)
  }

  const resetOnboarding = async () => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: false,
          preferences: null
        })
        .eq('id', user.id)

      if (error) throw error

      // Also clear sport profile
      await supabase
        .from('user_sport_profiles')
        .delete()
        .eq('user_id', user.id)

      setNeedsOnboarding(true)
      return true
    } catch (error) {
      console.error('Error resetting onboarding:', error)
      return false
    }
  }

  return {
    needsOnboarding,
    loading,
    completeOnboarding,
    resetOnboarding
  }
}
