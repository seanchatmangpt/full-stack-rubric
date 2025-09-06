<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-xl font-semibold">Full-Stack Interview Typing Practice</h1>
          <UBadge :color="currentExercise.difficulty === 'easy' ? 'green' : currentExercise.difficulty === 'medium' ? 'yellow' : 'red'">
            {{ currentExercise.difficulty }}
          </UBadge>
          <UBadge variant="outline">{{ currentExercise.category }}</UBadge>
        </div>
        
        <div class="flex items-center space-x-6">
          <!-- Stats -->
          <div class="flex items-center space-x-4 text-sm">
            <div class="text-center">
              <div class="font-bold text-blue-600">{{ wpm }}</div>
              <div class="text-gray-500">WPM</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-green-600">{{ accuracy.toFixed(1) }}%</div>
              <div class="text-gray-500">Accuracy</div>
            </div>
            <div class="text-center">
              <div class="font-bold text-red-600">{{ errors }}</div>
              <div class="text-gray-500">Errors</div>
            </div>
          </div>
          
          <UButton @click="resetTyping" size="sm" variant="outline">Reset</UButton>
          <UButton @click="nextExercise" size="sm" v-if="isComplete">Next Exercise</UButton>
        </div>
      </div>
      
      <!-- Progress -->
      <div class="mt-3">
        <div class="flex justify-between text-xs text-gray-500 mb-1">
          <span>{{ currentExercise.title }}</span>
          <span>{{ Math.round(progress) }}% complete</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            class="bg-blue-600 h-1 rounded-full transition-all duration-300"
            :style="{ width: `${Math.min(progress, 100)}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Code to Type Panel -->
      <div class="w-1/2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="h-full flex flex-col">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Code to Type</h2>
            <p class="text-xs text-gray-500 mt-1">{{ currentExercise.description }}</p>
          </div>
          
          <div class="flex-1 p-4 overflow-auto">
            <pre class="text-sm leading-relaxed font-mono"><code><span
              v-for="(char, index) in targetText"
              :key="index"
              :class="getCharClass(char, index)"
            >{{ char }}</span></code></pre>
          </div>
        </div>
      </div>

      <!-- Your Code Panel -->
      <div class="w-1/2 bg-white dark:bg-gray-800">
        <div class="h-full flex flex-col">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Code</h2>
              <div class="text-xs text-gray-500">
                {{ userInput.length }} / {{ targetText.length }} chars
              </div>
            </div>
          </div>
          
          <div class="flex-1 relative">
            <MonacoEditor
              v-model="userInput"
              :lang="currentExercise.language"
              :options="editorOptions"
              @update:modelValue="handleInput"
              class="h-full"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Completion Modal -->
    <UModal v-model="showModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Exercise Complete! 🎉</h3>
        </template>
        
        <div class="space-y-4">
          <div class="text-center">
            <p class="text-gray-600 dark:text-gray-300 mb-4">Great job completing the {{ currentExercise.title }} exercise!</p>
          </div>
          
          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <div class="text-2xl font-bold text-blue-600">{{ finalWpm }}</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">Words Per Minute</div>
            </div>
            <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <div class="text-2xl font-bold text-green-600">{{ finalAccuracy.toFixed(1) }}%</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">Accuracy</div>
            </div>
            <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
              <div class="text-2xl font-bold text-orange-600">{{ Math.round(timeElapsed * 60) }}s</div>
              <div class="text-sm text-gray-600 dark:text-gray-300">Time Taken</div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex gap-2 justify-end">
            <UButton variant="outline" @click="nextExercise">Next Exercise</UButton>
            <UButton @click="showModal = false">Close</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
// Full-Stack Interview Coding Exercises
const exercises = [
  {
    id: 1,
    title: "Express API: Filter & Paginate",
    category: "Backend",
    difficulty: "easy",
    language: "javascript",
    description: "Create an Express route that filters items by status and implements pagination",
    code: `app.get('/api/items', (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  let filtered = items;
  if (status) {
    filtered = items.filter(item => item.status === status);
  }
  
  const offset = (page - 1) * limit;
  const paginatedItems = filtered.slice(offset, offset + parseInt(limit));
  
  res.json({
    items: paginatedItems,
    total: filtered.length,
    page: parseInt(page),
    totalPages: Math.ceil(filtered.length / limit)
  });
});`
  },
  {
    id: 2,
    title: "Vue Composable: useItems",
    category: "Frontend",
    difficulty: "easy",
    language: "javascript",
    description: "Create a Vue 3 composable for fetching and managing a list of items",
    code: `export function useItems() {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);
  
  const fetchItems = async (filters = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch('/api/items?' + query);
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      items.value = data.items;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };
  
  const addItem = async (item) => {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    
    if (response.ok) {
      const newItem = await response.json();
      items.value.push(newItem);
    }
  };
  
  return {
    items: readonly(items),
    loading: readonly(loading),
    error: readonly(error),
    fetchItems,
    addItem
  };
}`
  },
  {
    id: 3,
    title: "Express Middleware: Request Validation",
    category: "Backend",
    difficulty: "medium",
    language: "javascript",
    description: "Create Express middleware for validating request data with error handling",
    code: `const validateItem = (req, res, next) => {
  const { title, description, status } = req.body;
  const errors = [];
  
  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (title && title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }
  
  if (!description || description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (status && !['active', 'inactive', 'pending'].includes(status)) {
    errors.push('Status must be active, inactive, or pending');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  // Sanitize input
  req.body.title = title.trim();
  req.body.description = description.trim();
  req.body.status = status || 'pending';
  
  next();
};

app.post('/api/items', validateItem, (req, res) => {
  const newItem = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  items.push(newItem);
  res.status(201).json(newItem);
});`
  },
  {
    id: 4,
    title: "Vue Component: Optimistic Updates",
    category: "Frontend",
    difficulty: "medium",
    language: "javascript",
    description: "Implement optimistic UI updates with rollback on failure",
    code: `<template>
  <div class="item-list">
    <div v-for="item in items" :key="item.id" class="item">
      <span :class="{ 'pending': item.pending }">{{ item.title }}</span>
      <button @click="toggleStatus(item)" :disabled="item.pending">
        {{ item.status }}
      </button>
      <button @click="deleteItem(item)" :disabled="item.pending">
        Delete
      </button>
    </div>
  </div>
</template>

<script setup>
const { items, fetchItems } = useItems();

const toggleStatus = async (item) => {
  const originalStatus = item.status;
  const newStatus = item.status === 'active' ? 'inactive' : 'active';
  
  // Optimistic update
  item.status = newStatus;
  item.pending = true;
  
  try {
    const response = await fetch('/api/items/' + item.id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update item');
    }
  } catch (error) {
    // Rollback on failure
    item.status = originalStatus;
    alert('Failed to update item: ' + error.message);
  } finally {
    item.pending = false;
  }
};

const deleteItem = async (item) => {
  const index = items.value.indexOf(item);
  
  // Optimistic removal
  items.value.splice(index, 1);
  
  try {
    const response = await fetch('/api/items/' + item.id, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete item');
    }
  } catch (error) {
    // Rollback on failure
    items.value.splice(index, 0, item);
    alert('Failed to delete item: ' + error.message);
  }
};
<\/script>\`
  },
  {
    id: 5,
    title: "Node.js: Async Data Processing",
    category: "Backend",
    difficulty: "hard",
    language: "javascript",
    description: "Process large dataset with async operations and error handling",
    code: `const processItems = async (items, batchSize = 10) => {
  const results = [];
  const errors = [];
  
  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (item) => {
      try {
        // Simulate async processing (API call, DB operation, etc.)
        const processed = await processItem(item);
        return { success: true, data: processed };
      } catch (error) {
        return { success: false, error: error.message, item };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(result => {
      if (result.success) {
        results.push(result.data);
      } else {
        errors.push(result);
      }
    });
    
    // Optional: Add delay between batches to prevent rate limiting
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return {
    processed: results,
    errors: errors,
    successCount: results.length,
    errorCount: errors.length
  };
};

const processItem = async (item) => {
  // Simulate async processing
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.1) { // 10% failure rate
        reject(new Error('Processing failed for item ' + item.id));
      } else {
        resolve({
          ...item,
          processed: true,
          processedAt: new Date().toISOString()
        });
      }
    }, Math.random() * 1000);
  });
};`
  }
];

// Reactive state
const currentExerciseIndex = ref(0)
const userInput = ref('')
const startTime = ref(null)
const isComplete = ref(false)
const showModal = ref(false)

// Computed properties
const currentExercise = computed(() => exercises[currentExerciseIndex.value])
const targetText = computed(() => currentExercise.value.code)

// Monaco Editor Options
const editorOptions = computed(() => ({
  theme: 'vs-dark',
  fontSize: 14,
  lineNumbers: 'on',
  wordWrap: 'on',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'none',
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  scrollbar: {
    vertical: 'auto',
    horizontal: 'auto'
  },
  suggest: { showStatusBar: false },
  quickSuggestions: false,
  parameterHints: { enabled: false },
  ordBasedSuggestions: false,
  wordBasedSuggestions: false,
  occurrencesHighlight: false,
  selectionHighlight: false,
  renderWhitespace: 'selection',
  contextmenu: false,
  automaticLayout: true,
  tabSize: 2,
  insertSpaces: true
}))

const progress = computed(() => {
  if (!targetText.value) return 0
  return (userInput.value.length / targetText.value.length) * 100
})

const correctChars = computed(() => {
  let correct = 0
  for (let i = 0; i < userInput.value.length; i++) {
    if (userInput.value[i] === targetText.value[i]) {
      correct++
    }
  }
  return correct
})

const errors = computed(() => {
  return userInput.value.length - correctChars.value
})

const accuracy = computed(() => {
  if (userInput.value.length === 0) return 100
  return (correctChars.value / userInput.value.length) * 100
})

const timeElapsed = computed(() => {
  if (!startTime.value) return 0
  return (Date.now() - startTime.value) / 1000 / 60 // in minutes
})

const wpm = computed(() => {
  if (timeElapsed.value === 0) return 0
  return Math.round((correctChars.value / 5) / timeElapsed.value)
})

const finalWpm = ref(0)
const finalAccuracy = ref(0)

// Methods
const getCharClass = (char, index) => {
  const userChar = userInput.value[index]
  const isTyped = index < userInput.value.length
  const isCurrent = index === userInput.value.length
  const isCorrect = isTyped && userChar === char
  const isError = isTyped && userChar !== char

  return {
    'char': true,
    'text-gray-600 dark:text-gray-300': !isTyped && !isCurrent,
    'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100': isCurrent,
    'text-green-600 bg-green-100 dark:bg-green-900/30': isCorrect,
    'text-red-600 bg-red-100 dark:bg-red-900/30': isError,
    'whitespace': char === ' ' || char === '\t'
  }
}

const handleInput = () => {
  if (!startTime.value && userInput.value.length > 0) {
    startTime.value = Date.now()
  }
  
  if (userInput.value.length >= targetText.value.length) {
    completeExercise()
  }
}

const handleKeydown = (e) => {
  // Prevent going beyond target text length
  if (userInput.value.length >= targetText.value.length && 
      e.key !== 'Backspace' && e.key !== 'Delete') {
    e.preventDefault()
  }
}

const completeExercise = () => {
  isComplete.value = true
  finalWpm.value = wpm.value
  finalAccuracy.value = accuracy.value
  showModal.value = true
}

const resetTyping = () => {
  userInput.value = ''
  startTime.value = null
  isComplete.value = false
  showModal.value = false
}

const nextExercise = () => {
  currentExerciseIndex.value = (currentExerciseIndex.value + 1) % exercises.length
  resetTyping()
  showModal.value = false
}

// Page meta
useHead({
  title: 'Typing Tutor - Practice Your Typing Skills',
  meta: [
    {
      name: 'description',
      content: 'Improve your typing speed and accuracy with our interactive typing tutor.'
    }
  ]
})
</script>

<style scoped>
.char {
  @apply inline-block relative;
  position: relative;
}

.char.whitespace {
  @apply min-w-[0.5rem];
}

/* Syntax highlighting hints */
pre code {
  @apply text-sm;
}

.char:hover {
  @apply bg-gray-100 dark:bg-gray-700;
}

/* Animation for current character */
.bg-blue-200 {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>