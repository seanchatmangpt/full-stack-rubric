# Nuxt BDD Examples

This directory contains comprehensive examples demonstrating different usage patterns of the nuxt-bdd library. Each example project showcases specific testing scenarios and best practices.

## 📁 Example Projects

### 🟢 Basic Example (`/basic/`)
**Difficulty: Beginner**

Demonstrates fundamental BDD testing concepts with simple scenarios.

- Basic feature files and step definitions
- Simple page testing
- Getting started with Nuxt BDD
- Essential configuration

**Key Features:**
- Welcome page testing
- Basic step definitions
- Simple world setup
- Core BDD patterns

### 🟡 Advanced Example (`/advanced/`)
**Difficulty: Intermediate to Advanced**

Shows complex testing scenarios with real-world patterns.

- User authentication flows
- API integration testing
- Complex step definitions with data tables
- Security testing scenarios
- Performance considerations

**Key Features:**
- Multi-step authentication scenarios
- API endpoint testing
- Database integration
- Security validation
- Parallel test execution
- Comprehensive reporting

### 🔄 Migration Example (`/migration/`)
**Difficulty: Intermediate**

Demonstrates how to convert existing traditional tests to BDD format.

- Side-by-side comparison of old vs new test styles
- Migration strategies
- Converting existing Vitest tests
- Best practices for gradual adoption

**Key Features:**
- Before/after test examples
- Calculator component testing (old style)
- Equivalent BDD scenarios (new style)
- Migration scripts and tools

### ⚡ Performance Example (`/performance/`)
**Difficulty: Advanced**

Focuses on performance testing scenarios with BDD.

- Load testing scenarios
- Stress testing patterns
- Performance benchmarking
- Core Web Vitals validation

**Key Features:**
- Concurrent user simulations
- API performance testing
- Database performance scenarios
- Benchmark comparisons
- Memory and CPU monitoring

### 🧩 Component Testing Example (`/component-testing/`)
**Difficulty: Intermediate**

Specialized in Vue component testing with BDD approach.

- Component behavior testing
- Props and event testing
- Accessibility testing
- Responsive design validation

**Key Features:**
- UserCard component testing
- State management testing
- Interaction testing
- Accessibility scenarios
- Responsive behavior validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Nuxt 3.9+
- nuxt-bdd library

### Installation

1. Navigate to any example directory:
   ```bash
   cd examples/basic  # or advanced, migration, etc.
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm run dev
   ```

4. Run BDD tests:
   ```bash
   pnpm run test:bdd
   ```

### Running Specific Examples

```bash
# Basic examples
cd basic && pnpm run test:bdd

# Advanced with parallel execution
cd advanced && pnpm run test:bdd:parallel

# Performance testing
cd performance && pnpm run test:performance

# Component testing
cd component-testing && pnpm run test:components

# Migration comparison
cd migration && pnpm run test:migration
```

## 📖 Learning Path

**Recommended progression:**

1. **Start with Basic** - Learn core BDD concepts
2. **Try Migration** - Understand conversion from existing tests  
3. **Explore Component Testing** - Focus on Vue component patterns
4. **Move to Advanced** - Complex scenarios and integrations
5. **Master Performance** - Advanced performance testing

## 🔧 Configuration Examples

Each project demonstrates different configuration approaches:

- **Basic**: Minimal configuration for getting started
- **Advanced**: Full configuration with all options
- **Migration**: Dual configuration (old + new)
- **Performance**: Performance-optimized settings
- **Component**: Component-focused configuration

## 🤝 Contributing

To add a new example project:

1. Create a new directory under `/examples/`
2. Follow the established structure (package.json, nuxt.config.js, features/, steps/)
3. Include a project-specific README
4. Add comprehensive BDD scenarios
5. Ensure all tests pass

## 📚 Resources

- [Nuxt BDD Documentation](../../README.md)
- [Cucumber.js Documentation](https://cucumber.io/docs/cucumber/)
- [Vitest Documentation](https://vitest.dev/)
- [Nuxt Testing Documentation](https://nuxt.com/docs/getting-started/testing)

## 🏷️ BDD Tags

Examples use consistent tagging:

- `@smoke` - Critical path tests
- `@regression` - Full test suite
- `@component` - Component-specific tests
- `@api` - API testing scenarios
- `@performance` - Performance tests
- `@security` - Security validation
- `@accessibility` - A11y testing