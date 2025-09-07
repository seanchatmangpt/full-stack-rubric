/**
 * Lighthouse Integration for Performance Scoring
 * Provides utilities for running Lighthouse audits and performance scoring
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Lighthouse integration utilities
 */
export class LighthouseIntegration {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './lighthouse-reports',
      configPath: options.configPath || null,
      chromeFlags: options.chromeFlags || ['--headless', '--disable-gpu', '--no-sandbox'],
      thresholds: {
        performance: options.thresholds?.performance || 90,
        accessibility: options.thresholds?.accessibility || 95,
        bestPractices: options.thresholds?.bestPractices || 90,
        seo: options.thresholds?.seo || 90,
        pwa: options.thresholds?.pwa || 80
      },
      ...options
    };
    
    this.ensureOutputDir();
    this.auditHistory = [];
  }

  /**
   * Run Lighthouse audit on a URL
   * @param {string} url - URL to audit
   * @param {Object} options - Audit options
   * @returns {Promise<Object>} Lighthouse audit results
   */
  async runAudit(url, options = {}) {
    const auditOptions = {
      ...this.options,
      ...options
    };

    const timestamp = Date.now();
    const reportPath = join(this.options.outputDir, `lighthouse-${timestamp}.json`);
    
    try {
      await this._runLighthouseCLI(url, reportPath, auditOptions);
      
      const results = JSON.parse(readFileSync(reportPath, 'utf8'));
      const processedResults = this._processResults(results, url, timestamp);
      
      this.auditHistory.push(processedResults);
      
      return processedResults;
    } catch (error) {
      throw new Error(`Lighthouse audit failed: ${error.message}`);
    }
  }

  /**
   * Run multiple audits with different configurations
   * @param {string} url - URL to audit
   * @param {Array<Object>} configurations - Array of configuration options
   * @returns {Promise<Array<Object>>} Array of audit results
   */
  async runMultipleAudits(url, configurations) {
    const results = [];
    
    for (const config of configurations) {
      const result = await this.runAudit(url, config);
      results.push(result);
      
      // Wait between audits to avoid overwhelming the server
      await this._wait(config.delay || 2000);
    }
    
    return results;
  }

  /**
   * Compare two audit results
   * @param {Object} currentAudit - Current audit results
   * @param {Object} previousAudit - Previous audit results
   * @returns {Object} Comparison results
   */
  compareAudits(currentAudit, previousAudit) {
    const comparison = {
      url: currentAudit.url,
      timestamp: currentAudit.timestamp,
      previousTimestamp: previousAudit.timestamp,
      scores: {},
      metrics: {},
      improvements: [],
      regressions: []
    };

    // Compare scores
    for (const category of ['performance', 'accessibility', 'bestPractices', 'seo', 'pwa']) {
      const current = currentAudit.scores[category];
      const previous = previousAudit.scores[category];
      
      if (current && previous) {
        const diff = current - previous;
        comparison.scores[category] = {
          current,
          previous,
          diff,
          percentChange: (diff / previous) * 100
        };
        
        if (diff > 0.05) {
          comparison.improvements.push(`${category}: +${(diff * 100).toFixed(1)} points`);
        } else if (diff < -0.05) {
          comparison.regressions.push(`${category}: ${(diff * 100).toFixed(1)} points`);
        }
      }
    }

    // Compare key metrics
    const metricsToCompare = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'first-meaningful-paint',
      'speed-index',
      'cumulative-layout-shift',
      'total-blocking-time'
    ];

    for (const metric of metricsToCompare) {
      const current = currentAudit.metrics[metric];
      const previous = previousAudit.metrics[metric];
      
      if (current && previous) {
        const diff = current.numericValue - previous.numericValue;
        comparison.metrics[metric] = {
          current: current.numericValue,
          previous: previous.numericValue,
          diff,
          percentChange: (diff / previous.numericValue) * 100,
          unit: current.numericUnit
        };
      }
    }

    return comparison;
  }

  /**
   * Monitor performance over time
   * @param {string} url - URL to monitor
   * @param {Object} options - Monitoring options
   * @returns {Promise<Object>} Monitoring results
   */
  async monitorPerformance(url, options = {}) {
    const { 
      interval = 3600000, // 1 hour
      duration = 86400000, // 24 hours
      maxAudits = 24 
    } = options;

    const results = {
      url,
      startTime: Date.now(),
      audits: [],
      trends: null,
      alerts: []
    };

    let auditCount = 0;
    const startTime = Date.now();

    while (auditCount < maxAudits && (Date.now() - startTime) < duration) {
      try {
        const audit = await this.runAudit(url, { 
          skipThresholdCheck: true,
          ...options 
        });
        
        results.audits.push(audit);
        auditCount++;
        
        // Check for alerts
        const alerts = this._checkPerformanceAlerts(audit);
        results.alerts.push(...alerts);
        
        if (auditCount < maxAudits && (Date.now() - startTime) < duration) {
          await this._wait(interval);
        }
      } catch (error) {
        console.error(`Monitoring audit failed: ${error.message}`);
        await this._wait(interval);
      }
    }

    // Calculate trends
    if (results.audits.length > 1) {
      results.trends = this._calculateTrends(results.audits);
    }

    return results;
  }

  /**
   * Generate performance budget
   * @param {Object} baseline - Baseline audit results
   * @param {Object} options - Budget options
   * @returns {Object} Performance budget configuration
   */
  generatePerformanceBudget(baseline, options = {}) {
    const { buffer = 0.1 } = options; // 10% buffer
    
    const budget = {
      resourceSizes: [],
      resourceCounts: [],
      timings: []
    };

    // Resource size budgets
    if (baseline.resources) {
      for (const [resourceType, size] of Object.entries(baseline.resources)) {
        budget.resourceSizes.push({
          resourceType,
          budget: Math.ceil(size * (1 + buffer))
        });
      }
    }

    // Timing budgets based on key metrics
    const timingMetrics = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'speed-index',
      'total-blocking-time'
    ];

    for (const metric of timingMetrics) {
      if (baseline.metrics[metric]) {
        budget.timings.push({
          metric,
          budget: Math.ceil(baseline.metrics[metric].numericValue * (1 + buffer)),
          unit: baseline.metrics[metric].numericUnit
        });
      }
    }

    return budget;
  }

  /**
   * Validate against performance budget
   * @param {Object} audit - Audit results to validate
   * @param {Object} budget - Performance budget
   * @returns {Object} Validation results
   */
  validateBudget(audit, budget) {
    const validation = {
      passed: true,
      violations: [],
      warnings: []
    };

    // Check timing budgets
    for (const timingBudget of budget.timings || []) {
      const metric = audit.metrics[timingBudget.metric];
      if (metric && metric.numericValue > timingBudget.budget) {
        validation.violations.push({
          type: 'timing',
          metric: timingBudget.metric,
          actual: metric.numericValue,
          budget: timingBudget.budget,
          unit: timingBudget.unit
        });
        validation.passed = false;
      }
    }

    // Check resource size budgets
    for (const sizeBudget of budget.resourceSizes || []) {
      const actualSize = audit.resources?.[sizeBudget.resourceType];
      if (actualSize && actualSize > sizeBudget.budget) {
        validation.violations.push({
          type: 'resource-size',
          resourceType: sizeBudget.resourceType,
          actual: actualSize,
          budget: sizeBudget.budget
        });
        validation.passed = false;
      }
    }

    return validation;
  }

  /**
   * Generate Lighthouse report
   * @param {Object} audit - Audit results
   * @returns {string} Formatted report
   */
  generateReport(audit) {
    let report = '🚦 Lighthouse Performance Report\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    report += `🌐 URL: ${audit.url}\n`;
    report += `📅 Date: ${new Date(audit.timestamp).toLocaleString()}\n`;
    report += `✅ Status: ${audit.passed ? 'PASSED' : 'FAILED'}\n\n`;

    // Scores
    report += '📊 Scores:\n';
    for (const [category, score] of Object.entries(audit.scores)) {
      const emoji = score >= 0.9 ? '🟢' : score >= 0.5 ? '🟡' : '🔴';
      const threshold = this.options.thresholds[category];
      const status = score * 100 >= threshold ? '✅' : '❌';
      
      report += `   ${emoji} ${status} ${this._formatCategoryName(category)}: ${(score * 100).toFixed(0)}% (threshold: ${threshold}%)\n`;
    }

    report += '\n⚡ Key Metrics:\n';
    
    const keyMetrics = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'speed-index',
      'cumulative-layout-shift',
      'total-blocking-time'
    ];

    for (const metricId of keyMetrics) {
      const metric = audit.metrics[metricId];
      if (metric) {
        const value = metric.numericUnit === 'millisecond' 
          ? `${metric.numericValue.toFixed(0)}ms`
          : metric.displayValue || metric.numericValue;
        
        report += `   • ${metric.title}: ${value}\n`;
      }
    }

    // Opportunities
    if (audit.opportunities && audit.opportunities.length > 0) {
      report += '\n🚀 Opportunities:\n';
      for (const opportunity of audit.opportunities.slice(0, 5)) {
        const savings = opportunity.details?.overallSavingsMs 
          ? ` (${opportunity.details.overallSavingsMs.toFixed(0)}ms savings)`
          : '';
        report += `   • ${opportunity.title}${savings}\n`;
      }
    }

    return report;
  }

  /**
   * Run Lighthouse CLI
   * @private
   */
  _runLighthouseCLI(url, outputPath, options) {
    return new Promise((resolve, reject) => {
      const args = [
        url,
        '--output=json',
        `--output-path=${outputPath}`,
        '--chrome-flags=' + options.chromeFlags.join(' ')
      ];

      if (options.configPath) {
        args.push(`--config-path=${options.configPath}`);
      }

      if (options.preset) {
        args.push(`--preset=${options.preset}`);
      }

      const lighthouse = spawn('npx', ['lighthouse', ...args]);
      
      let stderr = '';
      
      lighthouse.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      lighthouse.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Lighthouse exited with code ${code}: ${stderr}`));
        }
      });

      lighthouse.on('error', (error) => {
        reject(new Error(`Failed to start Lighthouse: ${error.message}`));
      });
    });
  }

  /**
   * Process Lighthouse results
   * @private
   */
  _processResults(lighthouseResults, url, timestamp) {
    const processed = {
      url,
      timestamp,
      passed: true,
      scores: {},
      metrics: {},
      opportunities: [],
      resources: {},
      violations: []
    };

    // Extract scores
    const categories = lighthouseResults.categories;
    for (const [key, category] of Object.entries(categories)) {
      const score = category.score;
      processed.scores[key] = score;
      
      // Check against thresholds
      const threshold = this.options.thresholds[key];
      if (threshold && score * 100 < threshold) {
        processed.violations.push(`${key} score ${(score * 100).toFixed(0)}% below threshold ${threshold}%`);
        processed.passed = false;
      }
    }

    // Extract key metrics
    const audits = lighthouseResults.audits;
    for (const [key, audit] of Object.entries(audits)) {
      if (audit.numericValue !== undefined) {
        processed.metrics[key] = {
          title: audit.title,
          numericValue: audit.numericValue,
          numericUnit: audit.numericUnit,
          displayValue: audit.displayValue,
          score: audit.score
        };
      }
    }

    // Extract opportunities
    for (const [key, audit] of Object.entries(audits)) {
      if (audit.details && audit.details.overallSavingsMs > 0) {
        processed.opportunities.push({
          id: key,
          title: audit.title,
          description: audit.description,
          details: audit.details
        });
      }
    }

    // Sort opportunities by potential savings
    processed.opportunities.sort((a, b) => 
      (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0)
    );

    return processed;
  }

  /**
   * Check for performance alerts
   * @private
   */
  _checkPerformanceAlerts(audit) {
    const alerts = [];
    
    // Check critical metrics
    const criticalThresholds = {
      'largest-contentful-paint': 2500, // 2.5 seconds
      'cumulative-layout-shift': 0.1,
      'total-blocking-time': 200 // 200ms
    };

    for (const [metric, threshold] of Object.entries(criticalThresholds)) {
      const value = audit.metrics[metric]?.numericValue;
      if (value && value > threshold) {
        alerts.push({
          type: 'critical-metric',
          metric,
          value,
          threshold,
          severity: 'high'
        });
      }
    }

    // Check score drops
    if (this.auditHistory.length > 0) {
      const lastAudit = this.auditHistory[this.auditHistory.length - 1];
      for (const [category, currentScore] of Object.entries(audit.scores)) {
        const previousScore = lastAudit.scores[category];
        if (previousScore && currentScore < previousScore - 0.1) {
          alerts.push({
            type: 'score-drop',
            category,
            current: currentScore,
            previous: previousScore,
            drop: previousScore - currentScore,
            severity: 'medium'
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Calculate performance trends
   * @private
   */
  _calculateTrends(audits) {
    if (audits.length < 2) return null;

    const trends = {
      scores: {},
      metrics: {}
    };

    // Calculate score trends
    for (const category of Object.keys(audits[0].scores)) {
      const scores = audits.map(audit => audit.scores[category]).filter(Boolean);
      trends.scores[category] = this._calculateTrendMetrics(scores);
    }

    // Calculate metric trends
    const metricsToTrack = [
      'first-contentful-paint',
      'largest-contentful-paint',
      'speed-index',
      'total-blocking-time'
    ];

    for (const metric of metricsToTrack) {
      const values = audits
        .map(audit => audit.metrics[metric]?.numericValue)
        .filter(val => val !== undefined);
      
      if (values.length >= 2) {
        trends.metrics[metric] = this._calculateTrendMetrics(values);
      }
    }

    return trends;
  }

  /**
   * Calculate trend metrics for a data series
   * @private
   */
  _calculateTrendMetrics(values) {
    const n = values.length;
    if (n < 2) return null;

    const first = values[0];
    const last = values[n - 1];
    const change = last - first;
    const percentChange = (change / first) * 100;

    // Simple linear trend
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = values[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const direction = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';

    return {
      first,
      last,
      change,
      percentChange,
      slope,
      direction,
      isImproving: slope < 0 // For performance metrics, lower is better
    };
  }

  /**
   * Format category name for display
   * @private
   */
  _formatCategoryName(category) {
    const names = {
      performance: 'Performance',
      accessibility: 'Accessibility',
      bestPractices: 'Best Practices',
      seo: 'SEO',
      pwa: 'PWA'
    };
    return names[category] || category;
  }

  /**
   * Ensure output directory exists
   * @private
   */
  ensureOutputDir() {
    if (!existsSync(this.options.outputDir)) {
      mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * Wait for specified time
   * @private
   */
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export audit history
   * @returns {Object} All audit data
   */
  export() {
    return {
      auditHistory: this.auditHistory,
      options: this.options
    };
  }

  /**
   * Clear audit history
   */
  clearHistory() {
    this.auditHistory = [];
  }
}

/**
 * Global Lighthouse integration instance
 */
export const lighthouse = new LighthouseIntegration();

/**
 * Vitest integration for Lighthouse testing
 * @param {string} url - URL to test
 * @param {Object} options - Test options
 */
export function createLighthouseTest(url, options = {}) {
  return {
    name: `Lighthouse: ${url}`,
    async run() {
      const audit = await lighthouse.runAudit(url, options);
      
      if (!audit.passed && !options.allowFailures) {
        throw new Error(`Lighthouse audit failed: ${audit.violations.join(', ')}`);
      }
      
      return audit;
    }
  };
}