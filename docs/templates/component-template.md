# ComponentName

Brief description of what the component does and its primary use case.

## Installation

```bash
# If separate package
pnpm add @full-stack-rubric/component-name

# Or import from main library
import { ComponentName } from '@full-stack-rubric/library'
```

## Props

| Name | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| targetText | `string` | `''` | Yes | The text users will type |
| targetWPM | `number` | `60` | No | Target words per minute goal |
| language | `string` | `'javascript'` | No | Programming language for syntax highlighting |
| drillType | `string` | `'basic'` | No | Type of typing drill being performed |
| theme | `'light' \| 'dark'` | `'dark'` | No | Editor theme preference |

## Events

| Name | Payload | Description |
|------|---------|-------------|
| sessionCompleted | `PerformanceSession` | Emitted when typing session completes with metrics |
| keystrokeRecorded | `KeystrokeEvent` | Real-time keystroke events for analytics |
| errorDetected | `TypingError` | When user makes typing mistakes |
| progressUpdated | `ProgressData` | Continuous progress updates during typing |

## Slots

| Name | Scope | Description |
|------|-------|-------------|
| default | - | Default slot for custom content overlay |
| metrics | `{ wpm, accuracy, errors }` | Custom metrics display |
| controls | `{ start, pause, reset }` | Custom session controls |

## Examples

### Basic Usage
```vue
<template>
  <TypingMonacoEditor 
    :target-text="codeSnippet"
    :target-wpm="80"
    language="javascript"
    drill-type="algorithm-practice"
    @session-completed="handleCompletion"
  />
</template>

<script setup>
const codeSnippet = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
`

function handleCompletion(session) {
  console.log('WPM:', session.metrics.wpm)
  console.log('Accuracy:', session.metrics.accuracy)
  console.log('Duration:', session.duration)
}
</script>
```

### Advanced Configuration with Custom Metrics
```vue
<template>
  <TypingMonacoEditor 
    :target-text="complexCode"
    :target-wpm="100"
    language="typescript"
    drill-type="interview-simulation"
    theme="light"
    @session-completed="saveToDatabase"
    @keystroke-recorded="trackRealTime"
    @error-detected="analyzeError"
  >
    <!-- Custom metrics overlay -->
    <template #metrics="{ wpm, accuracy, errors }">
      <div class="custom-metrics">
        <div class="metric-card">
          <span class="label">Speed</span>
          <span class="value" :class="getSpeedClass(wpm)">{{ wpm }} WPM</span>
        </div>
        <div class="metric-card">
          <span class="label">Precision</span>
          <span class="value" :class="getAccuracyClass(accuracy)">{{ accuracy.toFixed(1) }}%</span>
        </div>
        <div class="metric-card">
          <span class="label">Mistakes</span>
          <span class="value error-count">{{ errors }}</span>
        </div>
      </div>
    </template>
    
    <!-- Custom control buttons -->
    <template #controls="{ start, pause, reset }">
      <div class="custom-controls">
        <button @click="start" class="btn-primary">Begin Practice</button>
        <button @click="pause" class="btn-secondary">Take Break</button>
        <button @click="reset" class="btn-outline">Start Over</button>
      </div>
    </template>
  </TypingMonacoEditor>
</template>

<script setup>
import { ref, computed } from 'vue'

const complexCode = ref(`
interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

class UserService {
  private users: Map<string, User> = new Map();
  
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      ...userData
    };
    
    this.users.set(user.id, user);
    return user;
  }
  
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
}
`)

function getSpeedClass(wpm) {
  if (wpm >= 100) return 'excellent'
  if (wpm >= 80) return 'good' 
  if (wpm >= 60) return 'fair'
  return 'needs-improvement'
}

function getAccuracyClass(accuracy) {
  if (accuracy >= 98) return 'excellent'
  if (accuracy >= 92) return 'good'
  if (accuracy >= 85) return 'fair'
  return 'needs-improvement'
}

async function saveToDatabase(session) {
  // Save performance data for progress tracking
  await userProgressAPI.saveSession({
    userId: currentUser.id,
    drillType: session.drillType,
    metrics: session.metrics,
    timestamp: session.completedAt,
    codeLength: session.targetText.length
  })
}

function trackRealTime(keystroke) {
  // Real-time analytics for immediate feedback
  analyticsService.track('keystroke', {
    char: keystroke.character,
    correct: keystroke.isCorrect,
    timestamp: keystroke.timestamp,
    wpm: keystroke.currentWPM
  })
}

function analyzeError(error) {
  // Error pattern analysis
  errorAnalytics.recordError({
    expected: error.expected,
    actual: error.actual,
    position: error.position,
    context: error.surroundingText
  })
}
</script>

<style scoped>
.custom-metrics {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  min-width: 100px;
}

.label {
  font-size: 0.75rem;
  opacity: 0.8;
  text-transform: uppercase;
  font-weight: 600;
}

.value {
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.value.excellent { color: #10b981; }
.value.good { color: #84cc16; }  
.value.fair { color: #f59e0b; }
.value.needs-improvement { color: #ef4444; }

.error-count { color: #fca5a5; }

.custom-controls {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  justify-content: center;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover { background: #2563eb; }

.btn-secondary {
  background: #6b7280;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover { background: #4b5563; }

.btn-outline {
  background: transparent;
  color: #374151;
  border: 2px solid #374151;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: #374151;
  color: white;
}
</style>
```

## Live Demo

[Interactive CodePen Example](https://codepen.io/example)

## TypeScript Support

Full TypeScript definitions are included:

```typescript
export interface TypingMonacoEditorProps {
  targetText: string
  targetWPM?: number
  language?: string
  drillType?: string
  theme?: 'light' | 'dark'
}

export interface PerformanceSession {
  id: string
  drillType: string
  targetText: string
  startedAt: Date
  completedAt: Date
  duration: number
  metrics: {
    wpm: number
    accuracy: number
    errors: number
    consistency: number
    errorPatterns: Map<string, number>
  }
}

export interface KeystrokeEvent {
  character: string
  expected: string
  isCorrect: boolean
  timestamp: number
  currentWPM: number
  position: { line: number; column: number }
}
```

## Accessibility

The component follows WCAG 2.1 AA standards:

- **Keyboard Navigation**: Full functionality without mouse
- **ARIA Labels**: Proper semantic markup for screen readers
- **Focus Management**: Clear focus indicators and logical tab order
- **Color Contrast**: Meets minimum 4.5:1 ratio requirements
- **Reduced Motion**: Respects user's motion preferences

### Accessibility Features

```vue
<template>
  <!-- Proper ARIA labels -->
  <div 
    role="application"
    aria-label="Code typing practice interface"
    aria-describedby="typing-instructions"
  >
    <!-- Screen reader instructions -->
    <div id="typing-instructions" class="sr-only">
      Type the displayed code to practice your coding speed and accuracy. 
      Your progress will be announced as you type.
    </div>
    
    <!-- Live region for metrics announcements -->
    <div 
      aria-live="polite" 
      aria-atomic="false"
      class="sr-only"
    >
      Current speed: {{ wpm }} words per minute. 
      Accuracy: {{ accuracy.toFixed(1) }} percent.
    </div>
  </div>
</template>
```

## Performance Considerations

### Optimization Features

- **Monaco Editor Lazy Loading**: Editor loads only when needed
- **Keystroke Debouncing**: Prevents excessive API calls
- **Memory Management**: Proper cleanup of editor instances
- **Bundle Size**: Tree-shakable exports to minimize footprint

### Performance Monitoring

```javascript
// Performance metrics automatically tracked
const performanceMetrics = {
  editorInitTime: number,    // Monaco initialization duration
  renderLatency: number,     // Component render time
  keystrokeLatency: number,  // Input response time
  memoryUsage: number        // Component memory footprint
}
```

## Troubleshooting

### Common Issues

**Monaco Editor Not Loading**
```javascript
// Ensure proper Monaco import
import * as monaco from 'monaco-editor'

// Or use dynamic import for better performance
const monaco = await import('monaco-editor')
```

**Performance Issues with Large Code Blocks**
```javascript
// Enable virtualization for large content
const editorConfig = {
  wordWrap: 'off',
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  // Disable expensive features for large files
  quickSuggestions: false,
  parameterHints: { enabled: false }
}
```

**Theme Not Applied**
```javascript
// Ensure theme is loaded before editor creation
monaco.editor.defineTheme('custom-dark', customThemeData)
monaco.editor.setTheme('custom-dark')
```

## Related Components

- [TypingMetricsPanel](/docs/components/typing-metrics-panel) - Performance analytics display
- [ProgressTracker](/docs/components/progress-tracker) - User progress visualization
- [ErrorAnalyzer](/docs/components/error-analyzer) - Typing error pattern analysis
- [SessionHistory](/docs/components/session-history) - Historical performance data

## Related Guides

- [Building a Typing Tutor](/docs/guides/typing-tutor) - Complete implementation guide
- [Performance Optimization](/docs/guides/performance) - Best practices for speed
- [Custom Themes](/docs/guides/theming) - Creating custom editor themes
- [Analytics Integration](/docs/guides/analytics) - Tracking user performance