# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **job interview-ready** Vue 3 + Vite + Express.js real estate property listing application. The project demonstrates modern full-stack development practices with a clean single-repository architecture.

**Key Features:**
- Property listing with advanced filtering (type, price range, location, bedrooms)
- Real-time search and statistics
- Responsive design with hover effects
- Comprehensive test coverage with Vitest
- Single-command development workflow

## Architecture

### Full-Stack Setup
- **Frontend**: Vue 3 with Composition API, built with Vite
- **Backend**: Express.js REST API with CORS support
- **Development**: Integrated proxy setup for seamless API communication
- **Language**: Pure JavaScript (no TypeScript) for simplicity

### Project Structure
```
my-app/
├── backend.js              # Express server with /api routes
├── index.html              # Vite HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite config with /api proxy
├── vitest.config.js        # Test configuration
├── src/
│   ├── main.js             # Vue app entry
│   ├── App.vue             # Root component
│   ├── style.css           # Global styles
│   ├── components/
│   │   ├── PropertyList.vue    # Main property listing component
│   │   └── HelloWorld.vue      # Example component
│   └── test/
│       ├── setup.js            # Test setup
│       └── PropertyList.test.js # Component tests
├── public/
│   └── vite.svg            # Static assets
└── .vscode/
    └── extensions.json     # VS Code Vue.volar recommendation
```

## Development Commands

### Quick Start (Single Command)
```bash
npm run dev
```
**This is the main command for development.** It concurrently starts:
- Express backend server on `http://localhost:3001`  
- Vite frontend dev server on `http://localhost:5173`
- All `/api/*` requests are automatically proxied from frontend to backend

### Individual Services
```bash
npm run serve:backend    # Backend only (Express on port 3001)
npm run frontend         # Frontend only (Vite dev server on port 5173)
```

### Production Build
```bash
npm run build           # Build optimized production bundle
npm run preview         # Preview production build locally
```

### Testing
```bash
npm run test           # Run all tests with Vitest
npm run test:ui        # Run tests with interactive UI
```

## API Architecture

### Backend (backend.js)
All API endpoints use `/api` prefix for clean proxy integration:

- `GET /api/properties` - Get properties with optional filtering
  - Query params: `type`, `minPrice`, `maxPrice`, `location`, `minBedrooms`
- `GET /api/properties/:id` - Get single property by ID
- `POST /api/contact` - Contact form submission
- `GET /api/stats` - Property statistics (count, average price, etc.)

### Frontend Integration
- Uses native `fetch()` API for HTTP requests
- All requests to `/api/*` are automatically proxied to backend
- No hardcoded backend URLs - uses relative paths for portability

## Component Architecture

### PropertyList.vue (Main Component)
- **Pattern**: Vue 3 Composition API with `<script setup>`
- **State Management**: Reactive refs for properties, loading, error states
- **Features**:
  - Real-time filtering with URL parameter building
  - Loading states and error handling
  - Market statistics display
  - Responsive grid layout

### Key Vue 3 Patterns Used
- Composition API with `ref()` and `onMounted()`
- Scoped CSS with modern flexbox/grid
- Event-driven filtering updates
- Async/await for clean promise handling

## Testing Strategy

### Comprehensive Testing Approach
This project includes both **unit tests** and **BDD (Behavior-Driven Development)** tests for maximum coverage and documentation value.

### Unit Testing: Vitest + Vue Test Utils
- **Framework**: Vitest with jsdom environment
- **Location**: `src/test/*.test.js` files
- **Features**: Component mounting, user interactions, API mocking
- **Example**: `PropertyList.test.js` - Traditional unit tests

### BDD Testing: Vitest-Cucumber
- **Framework**: @amiceli/vitest-cucumber for Gherkin-style tests
- **Features**: `src/test/features/*.feature` files in Gherkin syntax
- **Step Definitions**: `src/test/*.bdd.test.js` files
- **Benefits**: Human-readable test scenarios, stakeholder communication
- **Example**: `property-search.feature` with corresponding BDD test

### Test Execution
```bash
npm run test        # Run all tests (unit + BDD)
npm run test:ui     # Interactive test UI with Vitest UI
```

### Testing Patterns Demonstrated
- **Component Testing**: Mounting, rendering, state verification
- **User Interaction**: Form inputs, filtering, API calls
- **Async Behavior**: Loading states, API responses, error handling
- **Mock Strategies**: Global fetch mocking for API simulation
- **BDD Scenarios**: Given/When/Then test structure

## Development Workflow

### Proxy Configuration
The Vite dev server (`vite.config.js`) proxies all `/api` requests to the Express backend:
```js
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

### Hot Module Replacement
- Frontend changes reload instantly via Vite HMR
- Backend changes require manual restart (or add nodemon for auto-restart)

### Data Flow
1. Vue component calls `/api/properties` (proxied to backend)
2. Express server processes request and filters sample data
3. JSON response rendered in Vue component with reactive updates

## Job Interview Highlights

This project showcases **modern full-stack development best practices**:

### Technical Excellence
- **Modern Vue 3**: Composition API, `<script setup>`, reactive programming
- **Clean Architecture**: Single-repository full-stack with proper separation
- **ES Modules**: Modern JavaScript with ESM imports throughout
- **Proxy Integration**: Seamless frontend/backend communication
- **Hot Reloading**: Instant development feedback with Vite HMR

### Testing Mastery
- **Dual Testing Strategy**: Traditional unit tests + BDD scenarios
- **Comprehensive Coverage**: Component, API, and user interaction testing
- **Professional Mocking**: Global fetch mocking for realistic API simulation
- **Human-Readable Tests**: Gherkin feature files for stakeholder communication

### Developer Experience
- **Single Command Start**: `npm run dev` launches entire stack
- **Build Optimization**: Vite for fast dev server and production builds
- **Code Quality**: Consistent patterns, proper error handling
- **Real-world Features**: Property filtering, statistics, responsive design

### Industry Standards
- **RESTful API Design**: Clean endpoints with filtering capabilities
- **Modern Testing**: Vitest ecosystem with BDD integration
- **Production Ready**: Build process, error handling, loading states

## 🤖 INTERVIEW COPILOT SYSTEM

### AI-Powered Mock Interview Simulator
The application now includes a comprehensive **Interview Copilot** system based on the full-stack-rubric project requirements. This provides candidates with realistic interview practice and AI-driven feedback.

### Core Features:
1. **3-Panel Simulation Interface**
   - AI Interviewer Chat (left panel)
   - Code Editor with syntax highlighting (center panel)
   - Output & Test Results (right panel)

2. **Rubric-Based Scoring System**
   - Technical dimensions (correctness, code structure, pattern usage)
   - Communication dimensions (problem decomposition, clarifying questions)
   - Problem-solving dimensions (approach, debugging, optimization)

3. **Performance Dashboard**
   - Track progress over time
   - Identify strongest and weakest areas
   - View session history and trends

### Backend Architecture (`backend-interview-copilot.js`)
- **Port**: 3002
- **Session Management**: In-memory storage with unique session IDs
- **AI Simulation**: Mock interviewer responses and feedback generation
- **Scoring Engine**: Multi-dimensional rubric evaluation

### Frontend Components:
- `InterviewSimulator.vue` - 3-panel interview interface
- `InterviewCopilot.vue` - Landing page with drill selection and dashboard

### Running the Interview Copilot:
```bash
# Start Interview Copilot backend + frontend
npm run dev:interview

# Or run separately:
npm run serve:interview  # Backend on port 3002
npm run frontend         # Frontend on port 5173
```

### API Endpoints:
- `GET /api/interview/drills` - List available interview drills
- `POST /api/interview/sessions/start` - Start new interview session
- `POST /api/interview/sessions/:id/chat` - Send chat message to AI
- `POST /api/interview/sessions/:id/code` - Update code in editor
- `POST /api/interview/sessions/:id/submit` - Submit for evaluation
- `GET /api/interview/sessions/:id/results` - Get detailed results
- `GET /api/interview/users/:id/performance` - User performance metrics
- `GET /api/interview/rubric` - Get rubric dimensions

## 🚨 INTERVIEW CHALLENGE ENDPOINTS

The application includes **three algorithmic challenges** designed to evaluate technical problem-solving:

### 1. Nearest Price Comparables (`GET /api/comps/:zip/:price/:count`)
**Challenge**: Find N most price-similar properties within same zip code  
**Algorithm**: Sorted array + bidirectional expansion from insertion point  
**Skills Tested**: 
- Binary search concepts
- Efficient nearest neighbor search
- Understanding of sorted data structures

**Example**: `/api/comps/10001/450000/3` returns 3 closest-priced properties in zip 10001

### 2. Unique Values Extraction (`GET /api/zips`)
**Challenge**: Extract unique zip codes from property dataset  
**Algorithm**: JavaScript Set for O(1) deduplication  
**Skills Tested**:
- Knowledge of JS collections (Set vs Array)
- Deduplication strategies
- Performance awareness (Set vs manual checking)

**Example**: `/api/zips` returns `["10001", "10002", "10003"]`

### 3. Prefix Search/Autocomplete (`GET /api/address-suggestions/:prefix`)
**Challenge**: Address suggestions with prefix matching  
**Algorithm**: Linear scan with early termination  
**Skills Tested**:
- String matching algorithms
- Performance optimization (early termination)
- Input validation and edge cases

**Example**: `/api/address-suggestions/123` returns addresses starting with "123"

## 📊 INTERVIEW RUBRIC

### Scoring Matrix (60 minutes total)

| **Challenge** | **Time Limit** | **Strong Signal (8-10 pts)** | **Moderate Signal (5-7 pts)** | **Weak Signal (1-4 pts)** |
|---------------|----------------|-------------------------------|--------------------------------|----------------------------|
| **Nearest Comps** | 20 min | Uses sorted search + bidirectional expansion | Linear search but correct logic | Nested loops or incorrect results |
| **Unique Zips** | 10 min | Immediately uses `Set` or `Map` | Manual deduplication with awareness | Nested loops for checking |
| **Prefix Search** | 15 min | Efficient linear scan with early termination | Basic filter() or forEach | Regex or complex matching |
| **Code Quality** | 10 min | Clean, readable, proper error handling | Functional but not optimized | Works but poor structure |
| **Testing** | 5 min | Understands testing approach, can debug | Basic testing awareness | Cannot explain test strategy |

### **Pass/Fail Thresholds:**
- **Senior (8+ years)**: 35+ points (87.5%)
- **Mid-level (3-8 years)**: 28+ points (70%)  
- **Junior (0-3 years)**: 20+ points (50%)

### **Key Differentiators:**
- **Algorithmic Thinking**: Recognizes sorted data opportunities
- **JS Ecosystem Knowledge**: Knows when to use Set vs Array
- **Performance Awareness**: Considers O(n) vs O(n²) implications
- **Edge Case Handling**: Empty results, input validation
- **Real-world Intuition**: Understands property/real estate domain

## Quick Setup for Reviewers

1. `npm install`
2. `npm run dev` 
3. Open `http://localhost:5173`
4. **Test challenge endpoints**: 
   - `/api/comps/10001/450000/3`
   - `/api/zips`
   - `/api/address-suggestions/123`
5. `npm run test` (optional - includes E2E BDD tests)

The application demonstrates full-stack competency with **algorithmic problem-solving** integrated into a **real-world context**.