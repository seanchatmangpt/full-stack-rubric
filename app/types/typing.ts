export interface TypingStats {
  wpm: number
  accuracy: number
  errors: number
  totalCharacters: number
  correctCharacters: number
  startTime: Date | null
  endTime: Date | null
  duration: number // in seconds
}

export interface TypingSession {
  id: string
  exerciseId: string
  userInput: string
  targetText: string
  stats: TypingStats
  timestamp: Date
  completed: boolean
}

export interface Exercise {
  id: string
  title: string
  text: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string
  language?: string
  tags: string[]
}

export interface TypingError {
  position: number
  expected: string
  actual: string
  timestamp: Date
}

export interface LiveTypingData {
  currentPosition: number
  errors: TypingError[]
  isTyping: boolean
  currentWpm: number
  currentAccuracy: number
}

export interface SessionStorage {
  sessions: TypingSession[]
  currentSession: TypingSession | null
  preferences: {
    theme: 'light' | 'dark'
    fontSize: number
    showWpmLive: boolean
    soundEnabled: boolean
  }
}