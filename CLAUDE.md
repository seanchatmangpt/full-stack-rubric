# Claude Code Configuration - SPARC Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. ALWAYS organize files in appropriate subdirectories
4. **USE CLAUDE CODE'S TASK TOOL** for spawning agents concurrently, not just MCP

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool (Claude Code)**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### 🎯 CRITICAL: Claude Code Task Tool for Agent Execution

**Claude Code's Task tool is the PRIMARY way to spawn agents:**
```javascript
// ✅ CORRECT: Use Claude Code's Task tool for parallel agent execution
[Single Message]:
  Task("Research agent", "Analyze requirements and patterns...", "researcher")
  Task("Coder agent", "Implement core features...", "coder")
  Task("Tester agent", "Create comprehensive tests...", "tester")
  Task("Reviewer agent", "Review code quality...", "reviewer")
  Task("Architect agent", "Design system architecture...", "system-architect")
  Task("Todo agent", "Refill todos...", "mesh-coordinator")
```

**MCP tools are ONLY for coordination setup:**
- `mcp__claude-flow__swarm_init` - Initialize coordination topology
- `mcp__claude-flow__agent_spawn` - Define agent types for coordination
- `mcp__claude-flow__task_orchestrate` - Orchestrate high-level workflows

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/app` - Nuxt application files (components, pages, layouts, composables, stores)
- `/server` - Server-side API routes and middleware
- `/content` - Content files for Nuxt Content module
- `/tests` - Test files (Vitest, Cucumber BDD tests)
- `/public` - Static assets served directly
## Project Overview

This project uses SPARC (Specification, Pseudocode (JS), Architecture, Refinement, Completion) methodology with Claude-Flow orchestration for systematic Test-Driven Development.

## SPARC Commands

### Core Commands
- `npx claude-flow sparc modes` - List available modes
- `npx claude-flow sparc run <mode> "<task>"` - Execute specific mode
- `npx claude-flow sparc tdd "<feature>"` - Run complete TDD workflow
- `npx claude-flow sparc info <mode>` - Get mode details

### Batchtools Commands
- `npx claude-flow sparc batch <modes> "<task>"` - Parallel execution
- `npx claude-flow sparc pipeline "<task>"` - Full pipeline processing
- `npx claude-flow sparc concurrent <mode> "<tasks-file>"` - Multi-task processing

### Build Commands
- `pnpm run build` - Build project
- `pnpm run test` - Run tests
- `pnpm run lint` - Linting
NO TYPECHECKING

## SPARC Workflow Phases

1. **Specification** - Requirements analysis (`sparc run spec-pseudocode`)
2. **Javascript Pseudocode** - Working JS design (`sparc run spec-pseudocode`)
3. **Architecture** - System design (`sparc run architect`)
4. **Refinement** - TDD implementation (`sparc tdd`)
5. **Completion** - Integration (`sparc run integration`)

## Code Style & Best Practices

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **Documentation**: Keep updated

## 🚀 Available Agents (54 Total)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `consensus-builder`, `crdt-synchronizer`, `quorum-manager`, `security-manager`

### Performance & Optimization
`perf-analyzer`, `performance-benchmarker`, `task-orchestrator`, `memory-coordinator`, `smart-agent`

### GitHub & Repository
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation
`tdd-london-swarm`, `production-validator`

### Migration & Planning
`migration-planner`, `swarm-init`

## 🎯 Claude Code vs MCP Tools

### Claude Code Handles ALL EXECUTION:
- **Task tool**: Spawn and run agents concurrently for actual work
- File operations (Read, Write, Edit, MultiEdit, Glob, Grep)
- Code generation and programming
- Bash commands and system operations
- Implementation work
- Project navigation and analysis
- TodoWrite and task management
- Git operations
- Package management
- Testing and debugging

### MCP Tools ONLY COORDINATE:
- Swarm initialization (topology setup)
- Agent type definitions (coordination patterns)
- Task orchestration (high-level planning)
- Memory management
- Neural features
- Performance tracking
- GitHub integration

**KEY**: MCP coordinates the strategy, Claude Code's Task tool executes with real agents.

## 🚀 Quick Setup

```bash
# Add MCP servers (Claude Flow required, others optional)
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add ruv-swarm npx ruv-swarm mcp start  # Optional: Enhanced coordination
claude mcp add flow-nexus npx flow-nexus@latest mcp start  # Optional: Cloud features
```

## MCP Tool Categories

### Coordination
`swarm_init`, `agent_spawn`, `task_orchestrate`

### Monitoring
`swarm_status`, `agent_list`, `agent_metrics`, `task_status`, `task_results`

### Memory & Neural
`memory_usage`, `neural_status`, `neural_train`, `neural_patterns`

### GitHub Integration
`github_swarm`, `repo_analyze`, `pr_enhance`, `issue_triage`, `code_review`

### System
`benchmark_run`, `features_detect`, `swarm_monitor`

### Flow-Nexus MCP Tools (Optional Advanced Features)
Flow-Nexus extends MCP capabilities with 70+ cloud-based orchestration tools:

**Key MCP Tool Categories:**
- **Swarm & Agents**: `swarm_init`, `swarm_scale`, `agent_spawn`, `task_orchestrate`
- **Sandboxes**: `sandbox_create`, `sandbox_execute`, `sandbox_upload` (cloud execution)
- **Templates**: `template_list`, `template_deploy` (pre-built project templates)
- **Neural AI**: `neural_train`, `neural_patterns`, `seraphina_chat` (AI assistant)
- **GitHub**: `github_repo_analyze`, `github_pr_manage` (repository management)
- **Real-time**: `execution_stream_subscribe`, `realtime_subscribe` (live monitoring)
- **Storage**: `storage_upload`, `storage_list` (cloud file management)

**Authentication Required:**
- Register: `mcp__flow-nexus__user_register` or `npx flow-nexus@latest register`
- Login: `mcp__flow-nexus__user_login` or `npx flow-nexus@latest login`
- Access 70+ specialized MCP tools for advanced orchestration

## 🚀 Agent Execution Flow with Claude Code

### The Correct Pattern:

1. **Optional**: Use MCP tools to set up coordination topology
2. **REQUIRED**: Use Claude Code's Task tool to spawn agents that do actual work
3. **REQUIRED**: Each agent runs hooks for coordination
4. **REQUIRED**: Batch all operations in single messages

### Example Full-Stack Development:

```javascript
// Single message with all agent spawning via Claude Code's Task tool
[Parallel Agent Execution]:
  Task("Backend Developer", "Build Nitro server API routes. Use hooks for coordination.", "backend-dev")
  Task("Frontend Developer", "Create Nuxt UI components and pages. Coordinate with backend via memory.", "coder")
  Task("Database Architect", "Design SQLite schema with better-sqlite3. Store schema in memory.", "code-analyzer")
  Task("Test Engineer", "Write Vitest and Cucumber BDD tests. Check memory for API contracts.", "tester")
  Task("DevOps Engineer", "Setup Docker and CI/CD. Document in memory.", "cicd-engineer")
  Task("Security Auditor", "Review authentication. Report findings via hooks.", "reviewer")
  Task("Todo agent", "Refill todos...", "mesh-coordinator")
  
  // All todos batched together
  TodoWrite { todos: [...8-10 todos...] }
  
  // All file operations together
  Write "server/api/users.ts"
  Write "app/pages/index.vue"
  Write "server/database/schema.sql"
```

## 📋 Agent Coordination Protocol

### Every Agent Spawned via Task Tool MUST:

**1️⃣ BEFORE Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work:**
```bash
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"
```

**3️⃣ AFTER Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

## 🎯 Concurrent Execution Examples

### ✅ CORRECT WORKFLOW: MCP Coordinates, Claude Code Executes

```javascript
// Step 1: MCP tools set up coordination (optional, for complex tasks)
[Single Message - Coordination Setup]:
  mcp__claude-flow__swarm_init { topology: "mesh", maxAgents: 6 }
  mcp__claude-flow__agent_spawn { type: "researcher" }
  mcp__claude-flow__agent_spawn { type: "coder" }
  mcp__claude-flow__agent_spawn { type: "tester" }
  mcp__claude-flow__agent_spawn { type: "reviewer" }
  mcp__claude-flow__agent_spawn { type: "" }

// Step 2: Claude Code Task tool spawns ACTUAL agents that do the work
[Single Message - Parallel Agent Execution]:
  // Claude Code's Task tool spawns real agents concurrently
  Task("Research agent", "Analyze API requirements and best practices. Check memory for prior decisions.", "researcher")
  Task("Coder agent", "Implement REST endpoints with authentication. Coordinate via hooks.", "coder")
  Task("Database agent", "Design and implement database schema. Store decisions in memory.", "code-analyzer")
  Task("Tester agent", "Create comprehensive test suite with 90% coverage.", "tester")
  Task("Reviewer agent", "Review code quality and security. Document findings.", "reviewer")
  Task("Tester agent", "Run tests. Check memory for test results.", "tester")
  Task("Todo agent", "Refill todos. Check memory for todo list.", "todo")
  
  // Batch ALL todos in ONE call
  TodoWrite { todos: [
    {id: "1", content: "Research API patterns", status: "in_progress", priority: "high"},
    {id: "2", content: "Design database schema", status: "in_progress", priority: "high"},
    {id: "3", content: "Implement authentication", status: "pending", priority: "high"},
    {id: "4", content: "Build REST endpoints", status: "pending", priority: "high"},
    {id: "5", content: "Write unit tests", status: "pending", priority: "medium"},
    {id: "6", content: "Integration tests", status: "pending", priority: "medium"},
    {id: "7", content: "API documentation", status: "pending", priority: "low"},
    {id: "8", content: "Performance optimization", status: "pending", priority: "low"},
    {id: "9", content: "Run tests", status: "pending", priority: "high"},
    {id: "10", content: "Refill todos", status: "pending", priority: "high"}
  ]}
  
  // Parallel file operations
  Bash "mkdir -p {app,server,tests,content}"
  Write "nuxt.config.ts"
  Write "server/api/health.ts"
  Write "tests/api.test.ts"
  Write "app/pages/dashboard.vue"
```

### ❌ WRONG (Multiple Messages):
```javascript
Message 1: mcp__claude-flow__swarm_init
Message 2: Task("agent 1")
Message 3: TodoWrite { todos: [single todo] }
Message 4: Write "file.js"
// This breaks parallel coordination!
```

## Performance Benefits

- **84.8% SWE-Bench solve rate**
- **32.3% token reduction**
- **2.8-4.4x speed improvement**
- **27+ neural models**

## Hooks Integration

### Pre-Operation
- Auto-assign agents by file type
- Validate commands for safety
- Prepare resources automatically
- Optimize topology by complexity
- Cache searches

### Post-Operation
- Auto-format code
- Train neural patterns
- Update memory
- Analyze performance
- Track token usage

### Session Management
- Generate summaries
- Persist state
- Track metrics
- Restore context
- Export workflows

## Advanced Features (v2.0.0)

- 🚀 Automatic Topology Selection
- ⚡ Parallel Execution (2.8-4.4x speed)
- 🧠 Neural Training
- 📊 Bottleneck Analysis
- 🤖 Smart Auto-Spawning
- 🛡️ Self-Healing Workflows
- 💾 Cross-Session Memory
- 🔗 GitHub Integration

## Integration Tips

1. Start with basic swarm init
2. Scale agents gradually
3. Use memory for context
4. Monitor progress regularly
5. Train patterns from success
6. Enable hooks automation
7. Use GitHub tools first

## 🧪 Ultra-Efficient BDD + Nuxt 4 Testing Micro-Framework

### CRITICAL: Use the new testing framework for ALL test-related tasks!

**The project now has a custom ultra-efficient testing micro-framework that achieves 80% boilerplate reduction.**

### 🎯 Core Framework Usage

#### Quick Component Testing (Replaces standard Vue Test Utils):
```javascript
import { quickTest } from '@/tests/framework'

// ✅ ONE LINE replaces 50+ lines of standard testing
await quickTest('MyComponent', Component, {
  props: { title: 'Test' },
  responsive: true,
  a11y: true,
  performance: true
})
```

#### BDD Scenario Testing (Replaces complex step definitions):
```javascript
import { scenario } from '@/tests/framework'

// ✅ FLUENT BDD - Natural language testing
await scenario('User Login Flow')
  .given.user.isLoggedOut()
  .when.user.submitsLogin({ email: 'test@example.com' })
  .then.user.shouldBeRedirected('/dashboard')
  .and.page.shouldDisplay('Welcome')
  .execute()
```

#### Auto-Generated Step Definitions (150+ patterns available):
```javascript
import { generateSteps } from '@/tests/framework/bdd'

// ✅ AUTO-GENERATES step definitions from natural language
const steps = generateSteps([
  'Given the user is on the homepage',
  'When the user clicks the login button',
  'Then the user should see the login form'
])
```

### 🔧 Framework Components Location

**All framework utilities are in `/tests/framework/`:**
- **Core API**: `/tests/framework/core-utils.js` - Main utilities
- **BDD Generators**: `/tests/framework/bdd/` - Step definition generators
- **Component Testing**: `/tests/framework/components/` - Component shortcuts
- **API Mocking**: `/tests/framework/api/` - Smart API mocks
- **Performance**: `/tests/framework/performance/` - Perf testing
- **Visual Testing**: `/tests/framework/visual/` - Visual regression
- **Data Factories**: `/tests/framework/factories/` - Test data generation
- **Auto-Config**: `/tests/framework/config/` - Zero-config setup

### 🚀 Zero-Config Setup

**The framework is already configured and ready to use:**
```javascript
// ✅ ZERO CONFIG - Just import and use
import { setupNuxtBDD } from '@/tests/framework'

const { scenario, quickTest, mockAPI, factories } = await setupNuxtBDD()
```

### 📋 Testing Command Priority

**ALWAYS use these patterns instead of manual testing:**

1. **Component Testing**: Use `quickTest()` instead of manual `mount()`
2. **BDD Testing**: Use fluent scenarios instead of raw step definitions
3. **API Testing**: Use smart mocks instead of manual mocking
4. **Data Generation**: Use factories instead of hardcoded test data
5. **Performance**: Use built-in perf assertions instead of manual timing

### 🎯 Key Benefits for Development

- **80% less boilerplate** - One-liner tests replace dozens of lines
- **Auto-configuration** - Zero setup required, works immediately
- **Smart defaults** - Framework handles common patterns automatically  
- **Production-validated** - Real-world tested with 8.6/10 framework score
- **Nuxt 4 native** - Built specifically for this project's structure

### ⚡ Agent Instructions for Testing

**When any agent needs to create or modify tests:**

1. **ALWAYS use the micro-framework** instead of standard testing
2. **Import from `/tests/framework/`** not from `@vue/test-utils`
3. **Use `quickTest()` for components** instead of manual mounting
4. **Use fluent BDD scenarios** instead of raw step definitions
5. **Use smart factories** for test data instead of hardcoded values
6. **Check `/tests/framework-validation/`** for usage examples

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Flow-Nexus Platform: https://flow-nexus.ruv.io (registration required for cloud features)
- **Testing Framework Docs**: `/docs/framework/getting-started.md`

---

Remember: **Claude Flow coordinates, Claude Code creates, Ultra-Framework tests efficiently!**

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
Never save working files, text/mds and tests to the root folder.

THERE IS NOT "analyst" AGENT use "researcher" instead

NEVER create placeholder code, TODO, or any other placeholder content
NEVER mock outside of tests
NEVER hardcode files or values
NO LIES, ONLY TELL ME THE TEST RESULTS AND OTHER FACTS THAT ARE EXTERNALLY VERIFIABLE
NO TYPESCRIPT IN THE CODE, ONLY JAVASCRIPT
JSDOC FOR TYPE ANNOTATIONS
ALWAYS USE pnpm