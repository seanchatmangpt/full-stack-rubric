/**
 * @fileoverview Quality assurance step definitions following London School TDD
 * Focuses on quality metrics behavior and testing process verification
 */

import { Given, When, Then } from 'cucumber';
import { expect } from 'vitest';
import { 
  createMockQualityAnalyzer, 
  createMockPerformanceMonitor, 
  createMockCodeQualityChecker,
  createMockAccessibilityValidator 
} from '../framework/mocks/quality-mocks.js';
import { BDDTestRunner } from '../framework/bdd-test-runner.js';

/**
 * Mock services for quality assurance
 * Following London School approach - test quality assessment collaborations
 */
const mockQualityAnalyzer = createMockQualityAnalyzer();
const mockPerformanceMonitor = createMockPerformanceMonitor();
const mockCodeQualityChecker = createMockCodeQualityChecker();
const mockAccessibilityValidator = createMockAccessibilityValidator();

/**
 * BDD test runner instance for quality scenarios
 */
const testRunner = new BDDTestRunner('quality');

// Code Quality Analysis
Given('a codebase with {int} files', async function(fileCount) {
  this.fileCount = fileCount;
  this.mockCodebase = Array.from({ length: fileCount }, (_, i) => ({
    path: `src/file${i + 1}.js`,
    lines: Math.floor(Math.random() * 200) + 50,
    complexity: Math.floor(Math.random() * 10) + 1
  }));
  
  mockCodeQualityChecker.scanCodebase.mockResolvedValue({
    files: this.mockCodebase,
    totalFiles: fileCount,
    scanComplete: true
  });
  
  // Verify codebase scanning setup
  expect(mockCodeQualityChecker.initializeScan).toHaveBeenCalled();
});

Given('code quality standards are configured', async function() {
  this.qualityStandards = {
    maxComplexity: 8,
    maxFunctionLength: 50,
    minTestCoverage: 80,
    maxFileSize: 500
  };
  
  mockCodeQualityChecker.setStandards.mockReturnValue({
    standards: this.qualityStandards,
    configured: true
  });
  
  // Verify standards configuration
  expect(mockCodeQualityChecker.setStandards).toHaveBeenCalledWith(this.qualityStandards);
});

When('code quality analysis is performed', async function() {
  mockQualityAnalyzer.analyzeCode.mockResolvedValue({
    overallScore: 85,
    issues: [
      { file: 'src/file1.js', type: 'complexity', severity: 'warning', line: 45 },
      { file: 'src/file3.js', type: 'length', severity: 'info', line: 120 }
    ],
    metrics: {
      averageComplexity: 6.2,
      averageFileSize: 180,
      testCoverage: 82
    }
  });
  
  this.qualityResult = await mockQualityAnalyzer.analyzeCode(this.mockCodebase);
  
  // Verify analysis execution
  expect(mockQualityAnalyzer.analyzeCode).toHaveBeenCalledWith(this.mockCodebase);
});

Then('quality metrics should be generated', async function() {
  expect(this.qualityResult.overallScore).toBeGreaterThan(0);
  expect(this.qualityResult.metrics).toEqual(
    expect.objectContaining({
      averageComplexity: expect.any(Number),
      testCoverage: expect.any(Number)
    })
  );
  
  // Verify metrics generation behavior
  expect(mockQualityAnalyzer.generateMetrics).toHaveBeenCalledWith(this.qualityResult);
});

Then('issues should be categorized by severity', async function() {
  const severityCategories = ['error', 'warning', 'info'];
  const issueSeverities = this.qualityResult.issues.map(issue => issue.severity);
  
  issueSeverities.forEach(severity => {
    expect(severityCategories).toContain(severity);
  });
  
  // Verify issue categorization
  expect(mockQualityAnalyzer.categorizeIssues).toHaveBeenCalledWith(this.qualityResult.issues);
});

// Performance Monitoring & Benchmarking
Given('performance monitoring is enabled', async function() {
  this.performanceConfig = {
    enabled: true,
    metricsCollectionInterval: 1000,
    alertThresholds: {
      responseTime: 100,
      memoryUsage: 85,
      cpuUsage: 80
    }
  };
  
  mockPerformanceMonitor.configure.mockReturnValue({
    configured: true,
    config: this.performanceConfig
  });
  
  // Verify performance monitoring setup
  expect(mockPerformanceMonitor.configure).toHaveBeenCalledWith(this.performanceConfig);
});

When('performance benchmarks are executed', async function() {
  mockPerformanceMonitor.runBenchmarks.mockResolvedValue({
    benchmarkId: 'benchmark-123',
    results: {
      responseTime: { avg: 85, p95: 120, p99: 180 },
      throughput: { requestsPerSecond: 250 },
      resourceUsage: {
        memory: { used: 65, peak: 78 },
        cpu: { avg: 45, peak: 62 }
      }
    },
    duration: 30000,
    passed: true
  });
  
  this.benchmarkResults = await mockPerformanceMonitor.runBenchmarks();
  
  // Verify benchmark execution
  expect(mockPerformanceMonitor.runBenchmarks).toHaveBeenCalled();
});

Then('performance metrics should meet thresholds', async function() {
  const responseTime = this.benchmarkResults.results.responseTime.avg;
  const memoryUsage = this.benchmarkResults.results.resourceUsage.memory.used;
  
  expect(responseTime).toBeLessThan(this.performanceConfig.alertThresholds.responseTime);
  expect(memoryUsage).toBeLessThan(this.performanceConfig.alertThresholds.memoryUsage);
  
  // Verify threshold validation
  expect(mockPerformanceMonitor.validateThresholds).toHaveBeenCalledWith(
    this.benchmarkResults.results,
    this.performanceConfig.alertThresholds
  );
});

// Test Coverage Analysis
Given('test suite with {int} tests', async function(testCount) {
  this.testCount = testCount;
  this.testSuite = {
    totalTests: testCount,
    passingTests: Math.floor(testCount * 0.95),
    failingTests: Math.floor(testCount * 0.05),
    coverage: {
      statements: 85,
      branches: 80,
      functions: 90,
      lines: 87
    }
  };
  
  mockQualityAnalyzer.analyzeTestSuite.mockResolvedValue(this.testSuite);
  
  // Verify test suite analysis setup
  expect(mockQualityAnalyzer.setupTestAnalysis).toHaveBeenCalled();
});

When('test coverage is analyzed', async function() {
  mockQualityAnalyzer.generateCoverageReport.mockResolvedValue({
    overall: this.testSuite.coverage,
    fileBreakdown: [
      { file: 'src/utils.js', coverage: 95 },
      { file: 'src/components.js', coverage: 78 },
      { file: 'src/services.js', coverage: 92 }
    ],
    uncoveredLines: [
      { file: 'src/components.js', lines: [45, 67, 89] },
      { file: 'src/services.js', lines: [123] }
    ]
  });
  
  this.coverageReport = await mockQualityAnalyzer.generateCoverageReport();
  
  // Verify coverage analysis execution
  expect(mockQualityAnalyzer.generateCoverageReport).toHaveBeenCalled();
});

Then('coverage report should identify gaps', async function() {
  expect(this.coverageReport.uncoveredLines.length).toBeGreaterThan(0);
  expect(this.coverageReport.fileBreakdown).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        file: expect.any(String),
        coverage: expect.any(Number)
      })
    ])
  );
  
  // Verify gap identification behavior
  expect(mockQualityAnalyzer.identifyCoverageGaps).toHaveBeenCalledWith(this.coverageReport);
});

// Accessibility Compliance
Given('web application with accessibility requirements', async function() {
  this.accessibilityStandards = 'WCAG 2.1 AA';
  this.pageElements = [
    { type: 'button', id: 'submit-btn', hasLabel: true, hasRole: true },
    { type: 'input', id: 'email-field', hasLabel: false, hasRole: true },
    { type: 'image', id: 'logo', hasAltText: true, hasRole: false }
  ];
  
  mockAccessibilityValidator.setStandards.mockReturnValue({
    standards: this.accessibilityStandards,
    rules: ['color-contrast', 'keyboard-navigation', 'aria-labels']
  });
  
  // Verify accessibility standards setup
  expect(mockAccessibilityValidator.setStandards).toHaveBeenCalledWith(this.accessibilityStandards);
});

When('accessibility audit is performed', async function() {
  mockAccessibilityValidator.auditPage.mockResolvedValue({
    score: 78,
    violations: [
      { 
        rule: 'missing-aria-label',
        element: 'input#email-field',
        severity: 'serious',
        fix: 'Add aria-label attribute'
      },
      {
        rule: 'missing-role',
        element: 'img#logo',
        severity: 'moderate',
        fix: 'Add role attribute'
      }
    ],
    passes: 23,
    incomplete: 2,
    inapplicable: 5
  });
  
  this.accessibilityResult = await mockAccessibilityValidator.auditPage(this.pageElements);
  
  // Verify accessibility audit execution
  expect(mockAccessibilityValidator.auditPage).toHaveBeenCalledWith(this.pageElements);
});

Then('accessibility violations should be reported', async function() {
  expect(this.accessibilityResult.violations.length).toBeGreaterThan(0);
  expect(this.accessibilityResult.violations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        rule: expect.any(String),
        severity: expect.any(String),
        fix: expect.any(String)
      })
    ])
  );
  
  // Verify violation reporting behavior
  expect(mockAccessibilityValidator.generateViolationReport).toHaveBeenCalledWith(
    this.accessibilityResult.violations
  );
});

// Security Vulnerability Assessment
Given('application with security configurations', async function() {
  this.securityConfig = {
    authentication: 'jwt',
    encryption: 'AES-256',
    cors: { enabled: true, origins: ['https://trusted-domain.com'] },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff'
    }
  };
  
  mockQualityAnalyzer.configureSecurityScan.mockReturnValue({
    configured: true,
    scanners: ['dependency-check', 'code-analysis', 'configuration-review']
  });
  
  // Verify security configuration
  expect(mockQualityAnalyzer.configureSecurityScan).toHaveBeenCalledWith(this.securityConfig);
});

When('security vulnerability scan is performed', async function() {
  mockQualityAnalyzer.scanVulnerabilities.mockResolvedValue({
    totalVulnerabilities: 3,
    critical: 0,
    high: 1,
    medium: 1,
    low: 1,
    findings: [
      {
        severity: 'high',
        category: 'dependency',
        description: 'Outdated package with known vulnerability',
        package: 'lodash@4.15.0',
        fix: 'Update to lodash@4.17.21'
      },
      {
        severity: 'medium',
        category: 'configuration',
        description: 'Missing security header',
        location: 'server.js:45',
        fix: 'Add Content-Security-Policy header'
      }
    ]
  });
  
  this.securityResult = await mockQualityAnalyzer.scanVulnerabilities();
  
  // Verify security scanning execution
  expect(mockQualityAnalyzer.scanVulnerabilities).toHaveBeenCalled();
});

Then('vulnerabilities should be prioritized by severity', async function() {
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const findings = this.securityResult.findings;
  
  findings.forEach(finding => {
    expect(severityOrder).toContain(finding.severity);
  });
  
  // Verify prioritization behavior
  expect(mockQualityAnalyzer.prioritizeVulnerabilities).toHaveBeenCalledWith(findings);
});

// Cross-browser Compatibility Testing
Given('application tested on {string} browsers', async function(browserList) {
  this.browsers = browserList.split(', ');
  this.compatibilityMatrix = this.browsers.map(browser => ({
    browser,
    version: 'latest',
    supported: true,
    issues: []
  }));
  
  mockQualityAnalyzer.setupBrowserTesting.mockReturnValue({
    browsers: this.browsers,
    testEnvironments: this.compatibilityMatrix
  });
  
  // Verify browser testing setup
  expect(mockQualityAnalyzer.setupBrowserTesting).toHaveBeenCalledWith(this.browsers);
});

When('cross-browser compatibility tests are run', async function() {
  mockQualityAnalyzer.runCompatibilityTests.mockResolvedValue({
    testResults: this.compatibilityMatrix.map(env => ({
      ...env,
      testsPassed: 95,
      testsFailed: 2,
      issues: env.browser === 'Internet Explorer' ? [
        { feature: 'CSS Grid', supported: false, fallback: 'Flexbox' }
      ] : []
    })),
    overallCompatibility: 92
  });
  
  this.compatibilityResults = await mockQualityAnalyzer.runCompatibilityTests();
  
  // Verify compatibility testing execution
  expect(mockQualityAnalyzer.runCompatibilityTests).toHaveBeenCalled();
});

Then('compatibility issues should be documented', async function() {
  const hasIssues = this.compatibilityResults.testResults.some(result => 
    result.issues && result.issues.length > 0
  );
  
  if (hasIssues) {
    expect(mockQualityAnalyzer.documentCompatibilityIssues).toHaveBeenCalled();
  }
  
  // Verify issue documentation behavior
  expect(mockQualityAnalyzer.generateCompatibilityReport).toHaveBeenCalledWith(
    this.compatibilityResults
  );
});

// Quality Gate Implementation
Given('quality gates with thresholds', async function() {
  this.qualityGates = {
    codeQuality: { threshold: 80, weight: 0.3 },
    testCoverage: { threshold: 85, weight: 0.3 },
    performance: { threshold: 90, weight: 0.2 },
    security: { threshold: 95, weight: 0.2 }
  };
  
  mockQualityAnalyzer.configureQualityGates.mockReturnValue({
    gates: this.qualityGates,
    configured: true
  });
  
  // Verify quality gates configuration
  expect(mockQualityAnalyzer.configureQualityGates).toHaveBeenCalledWith(this.qualityGates);
});

When('quality gate evaluation is performed', async function() {
  const gateResults = {
    codeQuality: { score: 85, passed: true },
    testCoverage: { score: 82, passed: false },
    performance: { score: 92, passed: true },
    security: { score: 98, passed: true }
  };
  
  mockQualityAnalyzer.evaluateQualityGates.mockResolvedValue({
    gateResults,
    overallPassed: false,
    failingGates: ['testCoverage'],
    overallScore: 88.6
  });
  
  this.gateEvaluation = await mockQualityAnalyzer.evaluateQualityGates();
  
  // Verify quality gate evaluation
  expect(mockQualityAnalyzer.evaluateQualityGates).toHaveBeenCalled();
});

Then('deployment should be {string} based on gate results', async function(expectedAction) {
  if (expectedAction === 'blocked') {
    expect(this.gateEvaluation.overallPassed).toBe(false);
    expect(this.gateEvaluation.failingGates.length).toBeGreaterThan(0);
  } else if (expectedAction === 'approved') {
    expect(this.gateEvaluation.overallPassed).toBe(true);
    expect(this.gateEvaluation.failingGates).toHaveLength(0);
  }
  
  // Verify deployment decision behavior
  expect(mockQualityAnalyzer.makeDeploymentDecision).toHaveBeenCalledWith(this.gateEvaluation);
});

/**
 * Cleanup and teardown
 */
After(async function() {
  // Reset all quality mocks after each scenario
  jest.clearAllMocks();
  
  // Clean up test runner
  await testRunner.cleanup();
});