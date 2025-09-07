/**
 * Performance Regression Detection System
 * Provides utilities for detecting and alerting on performance regressions
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Performance regression detection and alerting
 */
export class RegressionDetector {
  constructor(options = {}) {
    this.options = {
      baselinePath: options.baselinePath || './performance-baselines',
      alertThresholds: {
        renderTime: 20, // 20% increase
        memoryUsage: 15, // 15% increase
        bundleSize: 10, // 10% increase
        lighthouseScore: 5, // 5 point drop
        ...options.alertThresholds
      },
      historyLength: options.historyLength || 50,
      ...options
    };
    
    this.baselines = new Map();
    this.alerts = [];
    this.regressionHistory = [];
    
    this.ensureBaselineDir();
    this.loadBaselines();
  }

  /**
   * Set baseline performance metrics
   * @param {string} testName - Name of the test/component
   * @param {Object} metrics - Performance metrics
   * @param {Object} options - Baseline options
   */
  setBaseline(testName, metrics, options = {}) {
    const baseline = {
      testName,
      metrics: this._normalizeMetrics(metrics),
      timestamp: Date.now(),
      version: options.version || 'unknown',
      environment: options.environment || 'unknown',
      branch: options.branch || 'unknown',
      commitHash: options.commitHash || 'unknown'
    };

    this.baselines.set(testName, baseline);
    this._saveBaseline(testName, baseline);
    
    return baseline;
  }

  /**
   * Check for performance regressions
   * @param {string} testName - Name of the test/component
   * @param {Object} currentMetrics - Current performance metrics
   * @param {Object} options - Detection options
   * @returns {Object} Regression detection results
   */
  detectRegressions(testName, currentMetrics, options = {}) {
    const baseline = this.baselines.get(testName);
    if (!baseline) {
      return {
        hasBaseline: false,
        message: `No baseline found for ${testName}. Set baseline first.`,
        regressions: [],
        improvements: []
      };
    }

    const normalized = this._normalizeMetrics(currentMetrics);
    const comparison = this._compareMetrics(baseline.metrics, normalized, options);
    
    const result = {
      testName,
      hasBaseline: true,
      baseline: baseline,
      current: {
        metrics: normalized,
        timestamp: Date.now(),
        ...options
      },
      regressions: comparison.regressions,
      improvements: comparison.improvements,
      alerts: comparison.alerts,
      passed: comparison.regressions.length === 0
    };

    // Store in history
    this.regressionHistory.push(result);
    if (this.regressionHistory.length > this.options.historyLength) {
      this.regressionHistory.shift();
    }

    // Generate alerts if regressions found
    if (result.regressions.length > 0) {
      this._generateAlert(result);
    }

    return result;
  }

  /**
   * Analyze performance trends over time
   * @param {string} testName - Name of the test/component
   * @param {number} lookbackPeriod - Days to look back
   * @returns {Object} Trend analysis results
   */
  analyzeTrends(testName, lookbackPeriod = 30) {
    const cutoffTime = Date.now() - (lookbackPeriod * 24 * 60 * 60 * 1000);
    const relevantHistory = this.regressionHistory
      .filter(r => r.testName === testName && r.current.timestamp > cutoffTime)
      .sort((a, b) => a.current.timestamp - b.current.timestamp);

    if (relevantHistory.length < 2) {
      return {
        testName,
        insufficient: true,
        message: 'Insufficient data for trend analysis'
      };
    }

    const trends = {
      testName,
      period: lookbackPeriod,
      dataPoints: relevantHistory.length,
      trends: {},
      volatility: {},
      overallHealth: 'unknown'
    };

    // Analyze trends for each metric
    const metricKeys = Object.keys(relevantHistory[0].current.metrics);
    
    for (const metricKey of metricKeys) {
      const values = relevantHistory.map(r => r.current.metrics[metricKey]).filter(v => v != null);
      
      if (values.length >= 2) {
        trends.trends[metricKey] = this._calculateTrend(values);
        trends.volatility[metricKey] = this._calculateVolatility(values);
      }
    }

    // Determine overall health
    trends.overallHealth = this._determineOverallHealth(trends.trends, trends.volatility);
    
    return trends;
  }

  /**
   * Generate performance regression report
   * @param {Object} regressionResult - Regression detection result
   * @returns {string} Formatted report
   */
  generateRegressionReport(regressionResult) {
    let report = '🔍 Performance Regression Report\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    report += `📊 Test: ${regressionResult.testName}\n`;
    report += `📅 Date: ${new Date(regressionResult.current.timestamp).toLocaleString()}\n`;
    report += `✅ Status: ${regressionResult.passed ? 'PASSED' : 'FAILED'}\n\n`;

    if (regressionResult.regressions.length > 0) {
      report += '📉 Regressions Detected:\n';
      for (const regression of regressionResult.regressions) {
        const change = regression.percentChange > 0 ? 
          `+${regression.percentChange.toFixed(1)}%` : 
          `${regression.percentChange.toFixed(1)}%`;
        
        report += `   ❌ ${regression.metric}: ${regression.baseline} → ${regression.current} (${change})\n`;
        
        if (regression.severity) {
          report += `      Severity: ${regression.severity}\n`;
        }
      }
      report += '\n';
    }

    if (regressionResult.improvements.length > 0) {
      report += '📈 Improvements Found:\n';
      for (const improvement of regressionResult.improvements) {
        const change = improvement.percentChange > 0 ? 
          `+${improvement.percentChange.toFixed(1)}%` : 
          `${improvement.percentChange.toFixed(1)}%`;
        
        report += `   ✅ ${improvement.metric}: ${improvement.baseline} → ${improvement.current} (${change})\n`;
      }
      report += '\n';
    }

    return report;
  }

  /**
   * Set up automated regression detection
   * @param {Object} config - Configuration for automated detection
   */
  setupAutomatedDetection(config = {}) {
    const {
      interval = 300000, // 5 minutes
      tests = [],
      onRegression = null,
      onImprovement = null
    } = config;

    this.automatedConfig = {
      interval,
      tests,
      onRegression,
      onImprovement,
      isRunning: false
    };

    return {
      start: () => this._startAutomatedDetection(),
      stop: () => this._stopAutomatedDetection(),
      status: () => ({ running: this.automatedConfig.isRunning })
    };
  }

  /**
   * Create performance gates for CI/CD
   * @param {string} testName - Test name
   * @param {Object} gateConfig - Gate configuration
   * @returns {Function} Gate validation function
   */
  createPerformanceGate(testName, gateConfig = {}) {
    const {
      maxRegression = 10, // Max 10% regression allowed
      criticalMetrics = [],
      failOnAnyRegression = false
    } = gateConfig;

    return async (currentMetrics) => {
      const result = this.detectRegressions(testName, currentMetrics);
      
      if (!result.hasBaseline) {
        // No baseline - set current as baseline and pass
        this.setBaseline(testName, currentMetrics);
        return {
          passed: true,
          message: 'Baseline established',
          action: 'baseline-set'
        };
      }

      // Check for critical regressions
      const criticalRegressions = result.regressions.filter(r => 
        criticalMetrics.includes(r.metric) && Math.abs(r.percentChange) > maxRegression
      );

      // Check for any regressions if failOnAnyRegression is true
      const anySignificantRegression = failOnAnyRegression && 
        result.regressions.some(r => Math.abs(r.percentChange) > 5);

      const gateResult = {
        passed: criticalRegressions.length === 0 && !anySignificantRegression,
        regressions: result.regressions,
        improvements: result.improvements,
        criticalRegressions,
        maxRegression,
        message: ''
      };

      if (!gateResult.passed) {
        gateResult.message = `Performance gate failed: ${criticalRegressions.length} critical regressions detected`;
      } else {
        gateResult.message = 'Performance gate passed';
      }

      return gateResult;
    };
  }

  /**
   * Compare metrics and detect regressions
   * @private
   */
  _compareMetrics(baseline, current, options = {}) {
    const regressions = [];
    const improvements = [];
    const alerts = [];

    const thresholds = { ...this.options.alertThresholds, ...options.thresholds };

    for (const [metricKey, baselineValue] of Object.entries(baseline)) {
      const currentValue = current[metricKey];
      
      if (currentValue == null || baselineValue == null) continue;

      const percentChange = ((currentValue - baselineValue) / baselineValue) * 100;
      const isRegression = this._isRegression(metricKey, percentChange, thresholds);
      const isImprovement = this._isImprovement(metricKey, percentChange, thresholds);

      if (isRegression) {
        const regression = {
          metric: metricKey,
          baseline: baselineValue,
          current: currentValue,
          percentChange,
          threshold: thresholds[metricKey] || 10,
          severity: this._calculateSeverity(Math.abs(percentChange))
        };
        
        regressions.push(regression);
        
        if (Math.abs(percentChange) > (thresholds[metricKey] || 10)) {
          alerts.push({
            type: 'regression',
            metric: metricKey,
            change: percentChange,
            severity: regression.severity
          });
        }
      } else if (isImprovement) {
        improvements.push({
          metric: metricKey,
          baseline: baselineValue,
          current: currentValue,
          percentChange
        });
      }
    }

    return { regressions, improvements, alerts };
  }

  /**
   * Check if a change is a regression
   * @private
   */
  _isRegression(metricKey, percentChange, thresholds) {
    const threshold = thresholds[metricKey] || 10;
    
    // For metrics where higher is worse (render time, memory, bundle size)
    const higherIsWorse = [
      'renderTime', 'memoryUsage', 'bundleSize', 'responseTime',
      'first-contentful-paint', 'largest-contentful-paint', 'speed-index',
      'total-blocking-time', 'cumulative-layout-shift'
    ];

    // For metrics where lower is worse (scores)
    const lowerIsWorse = [
      'lighthouseScore', 'performance', 'accessibility', 'bestPractices', 'seo', 'pwa'
    ];

    if (higherIsWorse.some(metric => metricKey.includes(metric))) {
      return percentChange > threshold;
    } else if (lowerIsWorse.some(metric => metricKey.includes(metric))) {
      return percentChange < -threshold;
    }

    // Default: higher values are regressions
    return Math.abs(percentChange) > threshold && percentChange > 0;
  }

  /**
   * Check if a change is an improvement
   * @private
   */
  _isImprovement(metricKey, percentChange, thresholds) {
    const threshold = (thresholds[metricKey] || 10) / 2; // Lower threshold for improvements
    
    const higherIsWorse = [
      'renderTime', 'memoryUsage', 'bundleSize', 'responseTime',
      'first-contentful-paint', 'largest-contentful-paint', 'speed-index',
      'total-blocking-time', 'cumulative-layout-shift'
    ];

    const lowerIsWorse = [
      'lighthouseScore', 'performance', 'accessibility', 'bestPractices', 'seo', 'pwa'
    ];

    if (higherIsWorse.some(metric => metricKey.includes(metric))) {
      return percentChange < -threshold;
    } else if (lowerIsWorse.some(metric => metricKey.includes(metric))) {
      return percentChange > threshold;
    }

    return false;
  }

  /**
   * Calculate severity of regression
   * @private
   */
  _calculateSeverity(percentChange) {
    if (percentChange >= 50) return 'critical';
    if (percentChange >= 25) return 'high';
    if (percentChange >= 10) return 'medium';
    return 'low';
  }

  /**
   * Calculate trend for a series of values
   * @private
   */
  _calculateTrend(values) {
    if (values.length < 2) return null;

    const n = values.length;
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
      slope,
      direction,
      first: values[0],
      last: values[n - 1],
      change: values[n - 1] - values[0],
      percentChange: ((values[n - 1] - values[0]) / values[0]) * 100
    };
  }

  /**
   * Calculate volatility (coefficient of variation)
   * @private
   */
  _calculateVolatility(values) {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean !== 0 ? (stdDev / mean) * 100 : 0;
  }

  /**
   * Determine overall health based on trends and volatility
   * @private
   */
  _determineOverallHealth(trends, volatility) {
    const trendValues = Object.values(trends).filter(Boolean);
    const volatilityValues = Object.values(volatility);

    if (trendValues.length === 0) return 'unknown';

    // Check for concerning trends
    const regressingTrends = trendValues.filter(t => 
      (t.direction === 'increasing' && Math.abs(t.percentChange) > 20) ||
      (t.direction === 'decreasing' && Math.abs(t.percentChange) > 20)
    ).length;

    // Check for high volatility
    const highVolatility = volatilityValues.filter(v => v > 25).length;

    if (regressingTrends > trendValues.length * 0.5) {
      return 'poor';
    } else if (regressingTrends > 0 || highVolatility > volatilityValues.length * 0.3) {
      return 'fair';
    } else {
      return 'good';
    }
  }

  /**
   * Normalize metrics to a consistent format
   * @private
   */
  _normalizeMetrics(metrics) {
    const normalized = {};
    
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'number') {
        normalized[key] = value;
      } else if (value && typeof value === 'object') {
        // Extract numeric value from complex metric objects
        if (value.numericValue !== undefined) {
          normalized[key] = value.numericValue;
        } else if (value.average !== undefined) {
          normalized[key] = value.average;
        } else if (value.value !== undefined) {
          normalized[key] = value.value;
        }
      }
    }
    
    return normalized;
  }

  /**
   * Generate alert for regression
   * @private
   */
  _generateAlert(regressionResult) {
    const alert = {
      id: `alert-${Date.now()}`,
      timestamp: Date.now(),
      type: 'performance-regression',
      testName: regressionResult.testName,
      severity: this._getHighestSeverity(regressionResult.regressions),
      regressions: regressionResult.regressions,
      message: `Performance regression detected in ${regressionResult.testName}: ${regressionResult.regressions.length} metrics regressed`
    };

    this.alerts.push(alert);
    
    // Keep only recent alerts
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp > oneWeekAgo);

    return alert;
  }

  /**
   * Get highest severity from regressions
   * @private
   */
  _getHighestSeverity(regressions) {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    return regressions.reduce((highest, regression) => {
      const current = severityOrder[regression.severity] || 1;
      const highestValue = severityOrder[highest] || 1;
      return current > highestValue ? regression.severity : highest;
    }, 'low');
  }

  /**
   * Ensure baseline directory exists
   * @private
   */
  ensureBaselineDir() {
    if (!existsSync(this.options.baselinePath)) {
      mkdirSync(this.options.baselinePath, { recursive: true });
    }
  }

  /**
   * Load baselines from disk
   * @private
   */
  loadBaselines() {
    try {
      const baselineFile = join(this.options.baselinePath, 'baselines.json');
      if (existsSync(baselineFile)) {
        const data = JSON.parse(readFileSync(baselineFile, 'utf8'));
        for (const [testName, baseline] of Object.entries(data)) {
          this.baselines.set(testName, baseline);
        }
      }
    } catch (error) {
      console.warn('Failed to load baselines:', error.message);
    }
  }

  /**
   * Save baseline to disk
   * @private
   */
  _saveBaseline(testName, baseline) {
    try {
      const baselineFile = join(this.options.baselinePath, 'baselines.json');
      const allBaselines = {};
      
      // Load existing baselines
      if (existsSync(baselineFile)) {
        Object.assign(allBaselines, JSON.parse(readFileSync(baselineFile, 'utf8')));
      }
      
      // Add/update current baseline
      allBaselines[testName] = baseline;
      
      // Save back to disk
      writeFileSync(baselineFile, JSON.stringify(allBaselines, null, 2));
    } catch (error) {
      console.warn('Failed to save baseline:', error.message);
    }
  }

  /**
   * Export regression detection data
   * @returns {Object} All regression detection data
   */
  export() {
    return {
      baselines: Object.fromEntries(this.baselines),
      regressionHistory: this.regressionHistory,
      alerts: this.alerts,
      options: this.options
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.baselines.clear();
    this.regressionHistory = [];
    this.alerts = [];
  }
}

/**
 * Global regression detector instance
 */
export const regressionDetector = new RegressionDetector();

/**
 * Vitest integration for regression testing
 * @param {string} testName - Test name
 * @param {Object} currentMetrics - Current metrics
 * @param {Object} options - Test options
 */
export function createRegressionTest(testName, currentMetrics, options = {}) {
  return {
    name: `Regression: ${testName}`,
    async run() {
      const result = regressionDetector.detectRegressions(testName, currentMetrics, options);
      
      if (!result.passed && !options.allowRegressions) {
        throw new Error(`Performance regression detected: ${result.regressions.map(r => `${r.metric} ${r.percentChange.toFixed(1)}%`).join(', ')}`);
      }
      
      return result;
    }
  };
}