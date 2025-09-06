import type { Exercise } from '~/types/typing'

export const useExerciseStore = () => {
  const exercises = ref<Exercise[]>([
    {
      id: 'basic-1',
      title: 'Basic Typing - Common Words',
      text: 'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet and is perfect for practicing basic typing skills.',
      difficulty: 'beginner',
      category: 'Basic',
      tags: ['pangram', 'alphabet', 'basic']
    },
    {
      id: 'basic-2',
      title: 'Home Row Practice',
      text: 'asdf jkl; asdf jkl; sad lad fad had jak lak fak hak sash dash flask half glass class fast last past task mask',
      difficulty: 'beginner',
      category: 'Home Row',
      tags: ['home-row', 'basic', 'practice']
    },
    {
      id: 'programming-1',
      title: 'JavaScript Basics',
      text: 'function calculateSum(a, b) { return a + b; } const result = calculateSum(10, 20); console.log("Result:", result); if (result > 25) { console.log("Greater than 25"); }',
      difficulty: 'intermediate',
      category: 'Programming',
      language: 'javascript',
      tags: ['javascript', 'function', 'variables']
    },
    {
      id: 'programming-2',
      title: 'TypeScript Interface',
      text: 'interface User { id: number; name: string; email: string; isActive: boolean; } const user: User = { id: 1, name: "John Doe", email: "john@example.com", isActive: true };',
      difficulty: 'intermediate',
      category: 'Programming',
      language: 'typescript',
      tags: ['typescript', 'interface', 'types']
    },
    {
      id: 'advanced-1',
      title: 'Complex Algorithm',
      text: 'const quickSort = (arr) => { if (arr.length <= 1) return arr; const pivot = arr[Math.floor(arr.length / 2)]; const left = arr.filter(x => x < pivot); const right = arr.filter(x => x > pivot); return [...quickSort(left), pivot, ...quickSort(right)]; };',
      difficulty: 'advanced',
      category: 'Algorithms',
      language: 'javascript',
      tags: ['algorithm', 'recursion', 'sorting']
    },
    {
      id: 'prose-1',
      title: 'Literature Excerpt',
      text: 'In the beginning was the Word, and the Word was with God, and the Word was God. All things were made through him, and without him was not any thing made that was made. In him was life, and the life was the light of men.',
      difficulty: 'intermediate',
      category: 'Literature',
      tags: ['prose', 'literature', 'classic']
    },
    {
      id: 'numbers-1',
      title: 'Numbers and Symbols',
      text: '123-456-7890 | email@domain.com | $1,234.56 | 50% off | #hashtag | @username | (555) 123-4567 | www.example.com | API_KEY_123',
      difficulty: 'advanced',
      category: 'Mixed',
      tags: ['numbers', 'symbols', 'mixed']
    }
  ])

  const getExerciseById = (id: string): Exercise | undefined => {
    return exercises.value.find(exercise => exercise.id === id)
  }

  const getExercisesByDifficulty = (difficulty: Exercise['difficulty']): Exercise[] => {
    return exercises.value.filter(exercise => exercise.difficulty === difficulty)
  }

  const getExercisesByCategory = (category: string): Exercise[] => {
    return exercises.value.filter(exercise => exercise.category === category)
  }

  const getRandomExercise = (difficulty?: Exercise['difficulty']): Exercise => {
    const filtered = difficulty 
      ? getExercisesByDifficulty(difficulty)
      : exercises.value
    
    const randomIndex = Math.floor(Math.random() * filtered.length)
    return filtered[randomIndex]
  }

  const searchExercises = (query: string): Exercise[] => {
    const lowercaseQuery = query.toLowerCase()
    return exercises.value.filter(exercise => 
      exercise.title.toLowerCase().includes(lowercaseQuery) ||
      exercise.category.toLowerCase().includes(lowercaseQuery) ||
      exercise.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }

  return {
    exercises: readonly(exercises),
    getExerciseById,
    getExercisesByDifficulty,
    getExercisesByCategory,
    getRandomExercise,
    searchExercises
  }
}