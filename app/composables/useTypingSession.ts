import type { TypingSession, TypingStats, TypingError, LiveTypingData, Exercise } from '~/types/typing'

export const useTypingSession = () => {
  const currentSession = ref<TypingSession | null>(null)
  const liveData = ref<LiveTypingData>({
    currentPosition: 0,
    errors: [],
    isTyping: false,
    currentWpm: 0,
    currentAccuracy: 100
  })

  const startSession = (exercise: Exercise) => {
    const session: TypingSession = {
      id: `session-${Date.now()}`,
      exerciseId: exercise.id,
      userInput: '',
      targetText: exercise.text,
      stats: {
        wpm: 0,
        accuracy: 100,
        errors: 0,
        totalCharacters: 0,
        correctCharacters: 0,
        startTime: new Date(),
        endTime: null,
        duration: 0
      },
      timestamp: new Date(),
      completed: false
    }

    currentSession.value = session
    liveData.value = {
      currentPosition: 0,
      errors: [],
      isTyping: false,
      currentWpm: 0,
      currentAccuracy: 100
    }

    // Save to localStorage
    if (process.client) {
      localStorage.setItem('currentTypingSession', JSON.stringify(session))
    }
  }

  const updateUserInput = (input: string) => {
    if (!currentSession.value) return

    const wasTyping = liveData.value.isTyping
    liveData.value.isTyping = true

    // Start timer on first keystroke
    if (!wasTyping && currentSession.value.stats.startTime) {
      currentSession.value.stats.startTime = new Date()
    }

    currentSession.value.userInput = input
    liveData.value.currentPosition = input.length

    // Calculate errors
    const targetText = currentSession.value.targetText
    const errors: TypingError[] = []
    
    for (let i = 0; i < input.length; i++) {
      if (i < targetText.length && input[i] !== targetText[i]) {
        errors.push({
          position: i,
          expected: targetText[i],
          actual: input[i],
          timestamp: new Date()
        })
      }
    }

    liveData.value.errors = errors

    // Calculate stats
    const stats = calculateStats(input, targetText, currentSession.value.stats.startTime!)
    currentSession.value.stats = stats
    liveData.value.currentWpm = stats.wpm
    liveData.value.currentAccuracy = stats.accuracy

    // Check if completed
    if (input.length >= targetText.length) {
      completeSession()
    }

    // Save to localStorage
    if (process.client) {
      localStorage.setItem('currentTypingSession', JSON.stringify(currentSession.value))
    }
  }

  const calculateStats = (userInput: string, targetText: string, startTime: Date): TypingStats => {
    const now = new Date()
    const duration = (now.getTime() - startTime.getTime()) / 1000 // seconds
    
    const totalCharacters = userInput.length
    let correctCharacters = 0
    let errors = 0

    // Count correct characters and errors
    for (let i = 0; i < userInput.length; i++) {
      if (i < targetText.length && userInput[i] === targetText[i]) {
        correctCharacters++
      } else {
        errors++
      }
    }

    // Calculate accuracy
    const accuracy = totalCharacters > 0 ? (correctCharacters / totalCharacters) * 100 : 100

    // Calculate WPM (Words Per Minute)
    // Standard: 5 characters = 1 word
    const wordsTyped = correctCharacters / 5
    const minutes = duration / 60
    const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0

    return {
      wpm,
      accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
      errors,
      totalCharacters,
      correctCharacters,
      startTime,
      endTime: null,
      duration: Math.round(duration * 100) / 100 // Round to 2 decimal places
    }
  }

  const completeSession = () => {
    if (!currentSession.value) return

    currentSession.value.completed = true
    currentSession.value.stats.endTime = new Date()
    liveData.value.isTyping = false

    // Save completed session to history
    if (process.client) {
      const sessionHistory = JSON.parse(localStorage.getItem('typingSessionHistory') || '[]')
      sessionHistory.push(currentSession.value)
      localStorage.setItem('typingSessionHistory', JSON.stringify(sessionHistory))
      localStorage.removeItem('currentTypingSession')
    }
  }

  const resetSession = () => {
    currentSession.value = null
    liveData.value = {
      currentPosition: 0,
      errors: [],
      isTyping: false,
      currentWpm: 0,
      currentAccuracy: 100
    }

    if (process.client) {
      localStorage.removeItem('currentTypingSession')
    }
  }

  const restoreSession = () => {
    if (process.client) {
      const saved = localStorage.getItem('currentTypingSession')
      if (saved) {
        const session = JSON.parse(saved) as TypingSession
        // Convert date strings back to Date objects
        session.stats.startTime = session.stats.startTime ? new Date(session.stats.startTime) : null
        session.stats.endTime = session.stats.endTime ? new Date(session.stats.endTime) : null
        session.timestamp = new Date(session.timestamp)
        
        currentSession.value = session
        liveData.value.currentPosition = session.userInput.length
      }
    }
  }

  const getSessionHistory = (): TypingSession[] => {
    if (!process.client) return []
    
    const history = localStorage.getItem('typingSessionHistory')
    if (!history) return []
    
    return JSON.parse(history).map((session: any) => ({
      ...session,
      stats: {
        ...session.stats,
        startTime: session.stats.startTime ? new Date(session.stats.startTime) : null,
        endTime: session.stats.endTime ? new Date(session.stats.endTime) : null
      },
      timestamp: new Date(session.timestamp)
    }))
  }

  // Auto-restore session on mount
  onMounted(() => {
    restoreSession()
  })

  return {
    currentSession: readonly(currentSession),
    liveData: readonly(liveData),
    startSession,
    updateUserInput,
    completeSession,
    resetSession,
    restoreSession,
    getSessionHistory
  }
}