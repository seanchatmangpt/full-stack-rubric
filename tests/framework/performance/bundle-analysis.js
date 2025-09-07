/**
 * Bundle Size Monitoring Integration for Micro-Framework
 * Provides utilities for analyzing and monitoring JavaScript bundle sizes
 */

import { readFileSync, statSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';

/**
 * Bundle size analyzer and monitoring utilities
 */
export class BundleAnalyzer {
  constructor(options = {}) {
    this.basePath = options.basePath || process.cwd();
    this.thresholds = {
      maxBundleSize: 250 * 1024, // 250KB
      maxGzipSize: 70 * 1024,    // 70KB
      maxChunkSize: 50 * 1024,   // 50KB per chunk
      compressionRatio: 0.3      // Should compress to <30% of original
    };
    this.history = [];
    this.chunks = new Map();
  }

  /**
   * Analyze bundle file(s)
   * @param {string|Array<string>} bundlePaths - Path(s) to bundle files
   * @returns {Object} Bundle analysis results
   */
  analyzeBundles(bundlePaths) {
    const paths = Array.isArray(bundlePaths) ? bundlePaths : [bundlePaths];
    const results = {
      bundles: [],
      total: {
        size: 0,
        gzipSize: 0,
        files: 0
      },
      timestamp: Date.now(),
      passed: true,
      violations: []
    };

    for (const bundlePath of paths) {
      const fullPath = join(this.basePath, bundlePath);
      
      if (!existsSync(fullPath)) {
        results.violations.push(`Bundle file not found: ${bundlePath}`);
        results.passed = false;
        continue;
      }

      const analysis = this._analyzeFile(fullPath, bundlePath);
      results.bundles.push(analysis);
      
      results.total.size += analysis.size;
      results.total.gzipSize += analysis.gzipSize;
      results.total.files++;

      // Check against thresholds
      this._validateBundle(analysis, results);
    }

    // Store in history
    this.history.push(results);
    
    return results;
  }

  /**
   * Analyze bundle composition and dependencies
   * @param {string} bundlePath - Path to bundle file
   * @returns {Object} Composition analysis
   */
  analyzeComposition(bundlePath) {
    const fullPath = join(this.basePath, bundlePath);
    const content = readFileSync(fullPath, 'utf8');
    
    // Basic analysis of bundle content
    const composition = {
      totalLines: content.split('\n').length,
      minified: !content.includes('\n\n'), // Rough heuristic
      sourceMapIncluded: content.includes('//# sourceMappingURL'),
      estimatedModules: this._countModules(content),
      frameworks: this._detectFrameworks(content),
      polyfills: this._detectPolyfills(content),
      duplicates: this._detectDuplicates(content)
    };

    return composition;
  }

  /**
   * Monitor bundle sizes over time
   * @param {string|Array<string>} bundlePaths - Bundle paths to monitor
   * @param {Object} options - Monitoring options
   * @returns {Object} Monitoring results with trends
   */
  monitorBundleTrends(bundlePaths, options = {}) {
    const current = this.analyzeBundles(bundlePaths);
    const { lookbackPeriod = 10 } = options;
    
    if (this.history.length < 2) {
      return {
        current,
        trends: null,
        message: 'Insufficient history for trend analysis'
      };
    }

    const recentHistory = this.history.slice(-lookbackPeriod);
    const trends = this._calculateTrends(recentHistory);
    
    return {
      current,
      trends,
      alerts: this._generateTrendAlerts(trends)
    };
  }

  /**
   * Compare bundle with previous version
   * @param {Object} currentAnalysis - Current bundle analysis
   * @param {Object} previousAnalysis - Previous bundle analysis
   * @returns {Object} Comparison results
   */
  compareVersions(currentAnalysis, previousAnalysis) {
    const comparison = {
      sizeDiff: currentAnalysis.total.size - previousAnalysis.total.size,
      gzipDiff: currentAnalysis.total.gzipSize - previousAnalysis.total.gzipSize,
      percentageChange: ((currentAnalysis.total.size - previousAnalysis.total.size) / previousAnalysis.total.size) * 100,
      bundleChanges: []
    };

    // Compare individual bundles
    for (const current of currentAnalysis.bundles) {
      const previous = previousAnalysis.bundles.find(b => b.name === current.name);
      if (previous) {
        comparison.bundleChanges.push({
          name: current.name,
          sizeDiff: current.size - previous.size,
          gzipDiff: current.gzipSize - previous.gzipSize,
          percentageChange: ((current.size - previous.size) / previous.size) * 100
        });
      }
    }

    return comparison;
  }

  /**
   * Analyze tree shaking effectiveness
   * @param {string} bundlePath - Path to bundle file
   * @param {Array<string>} expectedExports - Expected exported functions/classes
   * @returns {Object} Tree shaking analysis
   */
  analyzeTreeShaking(bundlePath, expectedExports = []) {
    const fullPath = join(this.basePath, bundlePath);
    const content = readFileSync(fullPath, 'utf8');
    
    const analysis = {
      bundleSize: statSync(fullPath).size,
      unusedExports: [],
      deadCode: this._detectDeadCode(content),
      treeShakingScore: 0
    };

    // Check for unused exports
    for (const exportName of expectedExports) {
      const exportRegex = new RegExp(`export.*${exportName}`, 'g');
      const usageRegex = new RegExp(`${exportName}\\s*\\(`, 'g');
      
      const isExported = exportRegex.test(content);
      const isUsed = usageRegex.test(content);
      
      if (isExported && !isUsed) {
        analysis.unusedExports.push(exportName);
      }
    }

    // Calculate tree shaking effectiveness score
    const totalExports = expectedExports.length;
    const unusedCount = analysis.unusedExports.length;
    analysis.treeShakingScore = totalExports > 0 ? 
      ((totalExports - unusedCount) / totalExports) * 100 : 100;

    return analysis;
  }

  /**
   * Set custom size thresholds
   * @param {Object} newThresholds - New threshold values
   */
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Generate bundle size report
   * @param {Object} analysis - Bundle analysis results
   * @returns {string} Formatted report
   */
  generateReport(analysis) {
    let report = '📦 Bundle Size Analysis Report\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    // Overall summary
    report += `📊 Total Bundle Size: ${this._formatBytes(analysis.total.size)}\n`;
    report += `🗜️  Gzipped Size: ${this._formatBytes(analysis.total.gzipSize)}\n`;
    report += `📁 Files Analyzed: ${analysis.total.files}\n`;
    report += `✅ Status: ${analysis.passed ? 'PASSED' : 'FAILED'}\n\n`;

    // Individual bundle details
    report += 'Bundle Details:\n';
    for (const bundle of analysis.bundles) {
      const status = bundle.size <= this.thresholds.maxBundleSize ? '✅' : '❌';
      report += `${status} ${bundle.name}\n`;
      report += `   Size: ${this._formatBytes(bundle.size)}\n`;
      report += `   Gzipped: ${this._formatBytes(bundle.gzipSize)}\n`;
      report += `   Compression: ${bundle.compressionRatio.toFixed(1)}%\n\n`;
    }

    // Violations
    if (analysis.violations.length > 0) {
      report += '⚠️  Violations:\n';
      for (const violation of analysis.violations) {
        report += `   • ${violation}\n`;
      }
      report += '\n';
    }

    return report;
  }

  /**
   * Analyze individual file
   * @private
   */
  _analyzeFile(fullPath, relativePath) {
    const stats = statSync(fullPath);
    const content = readFileSync(fullPath);
    const gzipContent = gzipSync(content);
    
    const analysis = {
      name: relativePath,
      path: fullPath,
      size: stats.size,
      gzipSize: gzipContent.length,
      compressionRatio: (gzipContent.length / stats.size) * 100,
      lastModified: stats.mtime,
      type: extname(fullPath).slice(1) || 'unknown'
    };

    return analysis;
  }

  /**
   * Validate bundle against thresholds
   * @private
   */
  _validateBundle(bundle, results) {
    if (bundle.size > this.thresholds.maxBundleSize) {
      results.violations.push(
        `${bundle.name} exceeds maximum size: ${this._formatBytes(bundle.size)} > ${this._formatBytes(this.thresholds.maxBundleSize)}`
      );
      results.passed = false;
    }

    if (bundle.gzipSize > this.thresholds.maxGzipSize) {
      results.violations.push(
        `${bundle.name} gzipped size too large: ${this._formatBytes(bundle.gzipSize)} > ${this._formatBytes(this.thresholds.maxGzipSize)}`
      );
      results.passed = false;
    }

    if (bundle.compressionRatio > (this.thresholds.compressionRatio * 100)) {
      results.violations.push(
        `${bundle.name} poor compression ratio: ${bundle.compressionRatio.toFixed(1)}% > ${(this.thresholds.compressionRatio * 100)}%`
      );
      results.passed = false;
    }
  }

  /**
   * Count estimated modules in bundle
   * @private
   */
  _countModules(content) {
    // Look for webpack module patterns
    const webpackModules = (content.match(/\/\*\*\*\/ \(function\(module/g) || []).length;
    
    // Look for ES6 module patterns
    const es6Modules = (content.match(/\bexport\s+/g) || []).length;
    
    // Look for CommonJS patterns
    const cjsModules = (content.match(/module\.exports\s*=/g) || []).length;
    
    return Math.max(webpackModules, es6Modules, cjsModules);
  }

  /**
   * Detect frameworks in bundle
   * @private
   */
  _detectFrameworks(content) {
    const frameworks = [];
    
    const detectionPatterns = {
      'React': /react/i,
      'Vue': /vue/i,
      'Angular': /angular/i,
      'Lodash': /lodash/i,
      'Moment': /moment/i,
      'jQuery': /jquery|\$/i,
      'Axios': /axios/i
    };

    for (const [name, pattern] of Object.entries(detectionPatterns)) {
      if (pattern.test(content)) {
        frameworks.push(name);
      }
    }

    return frameworks;
  }

  /**
   * Detect polyfills in bundle
   * @private
   */
  _detectPolyfills(content) {
    const polyfills = [];
    
    const polyfillPatterns = {
      'Promise': /promise.*polyfill/i,
      'Fetch': /fetch.*polyfill/i,
      'Array Methods': /array.*polyfill/i,
      'Object.assign': /object\.assign.*polyfill/i
    };

    for (const [name, pattern] of Object.entries(polyfillPatterns)) {
      if (pattern.test(content)) {
        polyfills.push(name);
      }
    }

    return polyfills;
  }

  /**
   * Detect duplicate code
   * @private
   */
  _detectDuplicates(content) {
    const lines = content.split('\n');
    const lineFrequency = {};
    const duplicates = [];

    // Count line frequency (ignore very short lines)
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 20) {
        lineFrequency[trimmed] = (lineFrequency[trimmed] || 0) + 1;
      }
    }

    // Find duplicates
    for (const [line, count] of Object.entries(lineFrequency)) {
      if (count > 1) {
        duplicates.push({ line: line.substring(0, 80), count });
      }
    }

    return duplicates.slice(0, 10); // Top 10 duplicates
  }

  /**
   * Detect dead code patterns
   * @private
   */
  _detectDeadCode(content) {
    const deadCodePatterns = [
      /console\.(log|debug|info)/g,
      /debugger;?/g,
      /\/\*.*?\*\//gs,
      /\/\/.*$/gm
    ];

    const deadCode = [];
    
    for (const pattern of deadCodePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        deadCode.push({
          type: pattern.toString(),
          count: matches.length,
          estimatedSize: matches.join('').length
        });
      }
    }

    return deadCode;
  }

  /**
   * Calculate trends from history
   * @private
   */
  _calculateTrends(history) {
    if (history.length < 2) return null;

    const sizes = history.map(h => h.total.size);
    const gzipSizes = history.map(h => h.total.gzipSize);
    
    return {
      sizeGrowthRate: this._calculateGrowthRate(sizes),
      gzipGrowthRate: this._calculateGrowthRate(gzipSizes),
      averageSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
      averageGzipSize: gzipSizes.reduce((a, b) => a + b, 0) / gzipSizes.length
    };
  }

  /**
   * Calculate growth rate
   * @private
   */
  _calculateGrowthRate(values) {
    if (values.length < 2) return 0;
    
    const first = values[0];
    const last = values[values.length - 1];
    
    return ((last - first) / first) * 100;
  }

  /**
   * Generate trend alerts
   * @private
   */
  _generateTrendAlerts(trends) {
    const alerts = [];
    
    if (trends.sizeGrowthRate > 10) {
      alerts.push(`Bundle size growing rapidly: ${trends.sizeGrowthRate.toFixed(1)}% increase`);
    }
    
    if (trends.gzipGrowthRate > 15) {
      alerts.push(`Gzip size growing rapidly: ${trends.gzipGrowthRate.toFixed(1)}% increase`);
    }
    
    return alerts;
  }

  /**
   * Format bytes to human readable format
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Export analysis data
   * @returns {Object} All analysis data
   */
  export() {
    return {
      history: this.history,
      thresholds: this.thresholds,
      chunks: Object.fromEntries(this.chunks)
    };
  }

  /**
   * Clear analysis history
   */
  clearHistory() {
    this.history = [];
  }
}

/**
 * Global bundle analyzer instance
 */
export const bundleAnalyzer = new BundleAnalyzer();

/**
 * Vitest integration for bundle size testing
 * @param {string|Array<string>} bundlePaths - Bundle paths to test
 * @param {Object} options - Test options
 */
export function createBundleSizeTest(bundlePaths, options = {}) {
  return {
    name: 'Bundle Size Analysis',
    async run() {
      const analysis = bundleAnalyzer.analyzeBundles(bundlePaths);
      
      if (!analysis.passed && !options.allowViolations) {
        throw new Error(`Bundle size violations: ${analysis.violations.join(', ')}`);
      }
      
      return analysis;
    }
  };
}