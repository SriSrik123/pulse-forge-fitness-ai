
import { useState, useEffect } from 'react'

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
  const [profile, setProfile] = useState<SportProfile>({
    primarySport: '',
    experienceLevel: '',
    competitiveLevel: '',
    trainingFrequency: 3,
    sessionDuration: 60,
    currentGoals: ''
  })

  const loadProfile = () => {
    const primarySport = localStorage.getItem('primary-sport') || ''
    const experienceLevel = localStorage.getItem('experience-level') || ''
    const competitiveLevel = localStorage.getItem('competitive-level') || ''
    const trainingFrequency = parseInt(localStorage.getItem('training-frequency') || '3')
    const sessionDuration = parseInt(localStorage.getItem('session-duration') || '60')
    const currentGoals = localStorage.getItem('current-goals') || ''

    setProfile({
      primarySport,
      experienceLevel,
      competitiveLevel,
      trainingFrequency,
      sessionDuration,
      currentGoals
    })
  }

  useEffect(() => {
    loadProfile()

    const handleUpdate = () => {
      loadProfile()
    }

    window.addEventListener('sportProfileUpdated', handleUpdate)
    return () => window.removeEventListener('sportProfileUpdated', handleUpdate)
  }, [])

  const getSportInfo = (sportValue: string) => {
    return SPORTS_MAP[sportValue as keyof typeof SPORTS_MAP] || { label: sportValue, icon: '🏃‍♂️' }
  }

  const hasProfile = () => {
    return profile.primarySport && profile.experienceLevel
  }

  return {
    profile,
    getSportInfo,
    hasProfile,
    reload: loadProfile
  }
}
