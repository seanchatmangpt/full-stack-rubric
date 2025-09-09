/**
 * @fileoverview Comprehensive unit tests for utility functions
 * Tests performanceOptimizer.js and adaptiveDifficulty.js
 * Achieves high coverage with data-driven testing scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import utilities under test
import {
  performanceUtils,
  bundleAnalyzer,
  PerformanceMonitor
} from '../../app/utils/performanceOptimizer.js';

import {
  AdaptiveDifficulty,
  DIFFICULTY_LEVELS,
  PROGRESSION_PHASES
} from '../../app/utils/adaptiveDifficulty.js';

// Test data sets for data-driven testing
const performanceTestData = {
  debounceScenarios: [
    { wait: 100, calls: 5, expectedCalls: 1 },
    { wait: 50, calls: 3, expectedCalls: 1 }
  ]
};

describe('Performance Optimizer Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.console = { warn: vi.fn(), log: vi.fn() };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('performanceUtils', () => {
    describe('debounce function', () => {
      it.each(performanceTestData.debounceScenarios)(
        'should debounce function calls - wait: $wait, calls: $calls',
        async ({ wait, calls, expectedCalls }) => {
          const mockFn = vi.fn();
          const debouncedFn = performanceUtils.debounce(mockFn, wait);

          // Make multiple rapid calls
          for (let i = 0; i < calls; i++) {
            debouncedFn(`call-${i}`);
          }

          expect(mockFn).not.toHaveBeenCalled();

          // Wait for debounce to complete
          await new Promise(resolve => setTimeout(resolve, wait + 10));

          expect(mockFn).toHaveBeenCalledTimes(expectedCalls);
          expect(mockFn).toHaveBeenLastCalledWith(`call-${calls - 1}`);
        }
      );
    });

    describe('throttle function', () => {
      it('should throttle function calls', async () => {
        const mockFn = vi.fn();
        const throttledFn = performanceUtils.throttle(mockFn, 100);

        throttledFn('call-1');
        throttledFn('call-2');
        throttledFn('call-3');

        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('call-1');
      });
    });

    describe('lazyImport function', () => {
      it('should successfully import module and return default export', async () => {
        const mockModule = { default: 'defaultExport', named: 'namedExport' };
        const mockImportFn = vi.fn().mockResolvedValue(mockModule);

        const result = await performanceUtils.lazyImport(mockImportFn);

        expect(mockImportFn).toHaveBeenCalledTimes(1);
        expect(result).toBe('defaultExport');
      });

      it('should handle import errors gracefully', async () => {
        const mockImportFn = vi.fn().mockRejectedValue(new Error('Import failed'));
        const consoleSpy = vi.spyOn(console, 'warn');

        const result = await performanceUtils.lazyImport(mockImportFn);

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith('Lazy import failed:', expect.any(Error));
      });
    });

    describe('measure function', () => {
      it('should measure performance of async functions', async () => {
        const mockFn = vi.fn().mockResolvedValue('result');
        global.performance = {
          mark: vi.fn(),
          measure: vi.fn()
        };

        const result = await performanceUtils.measure('test-operation', mockFn);

        expect(result).toBe('result');
        expect(performance.mark).toHaveBeenCalledWith('test-operation-start');
        expect(performance.mark).toHaveBeenCalledWith('test-operation-end');
        expect(performance.measure).toHaveBeenCalledWith('test-operation', 'test-operation-start', 'test-operation-end');
      });

      it('should work without performance API', async () => {
        delete global.performance;
        const mockFn = vi.fn().mockResolvedValue('result');

        const result = await performanceUtils.measure('test-operation', mockFn);

        expect(result).toBe('result');
        expect(mockFn).toHaveBeenCalled();
      });
    });
  });

  describe('PerformanceMonitor class', () => {
    let monitor;

    beforeEach(() => {
      vi.stubGlobal('performance', {
        now: vi.fn(() => Date.now())
      });
      monitor = new PerformanceMonitor();
    });

    it('should create monitor instance', () => {
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
      expect(monitor.measurements).toBeInstanceOf(Map);
      expect(monitor.isMonitoring).toBe(false);
    });

    it('should start and stop monitoring', () => {
      expect(monitor.isMonitoring).toBe(false);
      
      monitor.startMonitoring();
      expect(monitor.isMonitoring).toBe(true);
      
      monitor.stopMonitoring();
      expect(monitor.isMonitoring).toBe(false);
    });

    it('should measure operation timing', () => {
      monitor.startMonitoring();
      
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(100)
        .mockReturnValueOnce(150);

      monitor.startTimer('test-operation');
      monitor.endTimer('test-operation');
      
      const duration = monitor.getDuration('test-operation');
      expect(duration).toBe(50);
    });

    it('should not track when monitoring is disabled', () => {
      monitor.startTimer('test-operation');
      
      expect(monitor.measurements.has('test-operation')).toBe(false);
    });
  });
});

describe('Adaptive Difficulty System', () => {
  let adaptiveDifficulty;

  beforeEach(() => {
    adaptiveDifficulty = new AdaptiveDifficulty('beginner-1');
  });

  describe('AdaptiveDifficulty Class', () => {
    describe('constructor', () => {
      it('should initialize with default beginner level', () => {
        const defaultInstance = new AdaptiveDifficulty();
        expect(defaultInstance.getCurrentLevel().id).toBe('beginner-1');
      });

      it('should initialize with specified level', () => {
        const instance = new AdaptiveDifficulty('intermediate-1');
        expect(instance.getCurrentLevel().id).toBe('intermediate-1');
      });

      it('should fallback to first level for invalid starting level', () => {
        const instance = new AdaptiveDifficulty('invalid-level');
        expect(instance.getCurrentLevel().id).toBe('beginner-1');
      });
    });

    describe('addSession', () => {
      it('should add session to history', () => {
        const session = {
          drillType: 'beginner-1',
          finalWPM: 35,
          accuracy: { raw: 95 },
          keystrokes: []
        };

        adaptiveDifficulty.addSession(session);
        expect(adaptiveDifficulty.history).toHaveLength(1);
      });

      it('should maintain maximum history length', () => {
        // Add more than 50 sessions
        for (let i = 0; i < 55; i++) {
          adaptiveDifficulty.addSession({
            drillType: 'beginner-1',
            finalWPM: 30 + i,
            accuracy: { raw: 95 },
            keystrokes: []
          });
        }

        expect(adaptiveDifficulty.history).toHaveLength(50);
        expect(adaptiveDifficulty.history[0].finalWPM).toBe(35); // First 5 should be removed
      });
    });

    describe('calculateNextDifficulty', () => {
      it('should handle insufficient sessions', () => {
        const nextLevel = adaptiveDifficulty.calculateNextDifficulty();
        expect(nextLevel.id).toBe('beginner-1');
      });
    });

    describe('performance analysis', () => {
      it('should analyze performance correctly', () => {
        const level = 'beginner-1';
        adaptiveDifficulty.currentLevel = DIFFICULTY_LEVELS.find(l => l.id === level);

        // Add qualifying sessions
        for (let i = 0; i < 5; i++) {
          adaptiveDifficulty.addSession({
            drillType: level,
            finalWPM: 35,
            accuracy: { raw: 95 },
            keystrokes: []
          });
        }

        const performance = adaptiveDifficulty.analyzeRecentPerformance(
          adaptiveDifficulty.getRecentSessionsForLevel(level)
        );

        expect(performance.avgWPM).toBe(35);
        expect(performance.avgAccuracy).toBe(95);
      });
    });

    describe('variance calculation', () => {
      it('should calculate variance correctly', () => {
        const values = [30, 35, 40, 45, 50];
        const variance = adaptiveDifficulty.calculateVariance(values);
        
        // Expected variance: ((30-40)� + (35-40)� + (40-40)� + (45-40)� + (50-40)�) / 5 = 50
        expect(variance).toBe(50);
      });

      it('should handle empty values array', () => {
        const variance = adaptiveDifficulty.calculateVariance([]);
        expect(variance).toBe(0);
      });
    });

    describe('generateAdaptiveText', () => {
      it('should generate text for different difficulty levels', () => {
        const difficulties = ['beginner-1', 'beginner-2', 'intermediate-1'];

        difficulties.forEach((levelId) => {
          const level = DIFFICULTY_LEVELS.find(l => l.id === levelId);
          const text = adaptiveDifficulty.generateAdaptiveText(level);
          
          expect(text).toBeTruthy();
          expect(typeof text).toBe('string');
          expect(text.length).toBeGreaterThan(0);
        });
      });

      it('should incorporate weak patterns', () => {
        const level = DIFFICULTY_LEVELS[0];
        const weakPatterns = new Map([
          ['a->s', 5],
          ['l->;', 3]
        ]);

        const text = adaptiveDifficulty.generateAdaptiveText(level, weakPatterns);
        
        expect(text).toContain('aaa'); // Practice pattern
        expect(text).toContain('avoid typing \'s\'');
      });
    });

    describe('getRecommendations', () => {
      it('should provide accuracy recommendations', () => {
        // Add sessions with low accuracy
        for (let i = 0; i < 5; i++) {
          adaptiveDifficulty.addSession({
            drillType: 'beginner-1',
            finalWPM: 35,
            accuracy: { raw: 85 }, // Below TARGET_ACCURACY
            keystrokes: []
          });
        }

        const recommendations = adaptiveDifficulty.getRecommendations();
        
        expect(recommendations).toContain('Focus on accuracy before speed. Slow down and aim for 97%+ accuracy.');
      });

      it('should provide positive feedback for good performance', () => {
        // Add sessions with good performance
        for (let i = 0; i < 5; i++) {
          adaptiveDifficulty.addSession({
            drillType: 'beginner-1',
            finalWPM: 40, // Good WPM
            accuracy: { raw: 98 }, // Good accuracy
            keystrokes: []
          });
        }

        const recommendations = adaptiveDifficulty.getRecommendations();
        
        expect(recommendations).toContain('Great progress! Keep practicing to advance to the next level.');
      });
    });
  });

  describe('DIFFICULTY_LEVELS constant', () => {
    it('should have proper structure for all levels', () => {
      expect(DIFFICULTY_LEVELS).toHaveLength(8);
      
      DIFFICULTY_LEVELS.forEach((level) => {
        expect(level).toHaveProperty('id');
        expect(level).toHaveProperty('name');
        expect(level).toHaveProperty('description');
        expect(level).toHaveProperty('metrics');
        expect(level).toHaveProperty('targetWPM');
        expect(level).toHaveProperty('targetAccuracy');
        expect(level).toHaveProperty('sessionDuration');

        expect(level.metrics).toHaveProperty('textComplexity');
        expect(level.metrics).toHaveProperty('keyboardDensity');
        expect(level.metrics).toHaveProperty('conceptualLoad');
        expect(level.metrics).toHaveProperty('timeConstraint');
      });
    });

    it('should have progressive difficulty increase', () => {
      for (let i = 1; i < DIFFICULTY_LEVELS.length; i++) {
        const prev = DIFFICULTY_LEVELS[i - 1];
        const curr = DIFFICULTY_LEVELS[i];
        
        // Target WPM should generally increase
        expect(curr.targetWPM).toBeGreaterThanOrEqual(prev.targetWPM);
        
        // Session duration should generally increase
        expect(curr.sessionDuration).toBeGreaterThanOrEqual(prev.sessionDuration);
      }
    });
  });

  describe('PROGRESSION_PHASES constant', () => {
    it('should have proper structure', () => {
      expect(PROGRESSION_PHASES).toHaveLength(4);
      
      PROGRESSION_PHASES.forEach((phase, index) => {
        expect(phase.phase).toBe(index + 1);
        expect(phase).toHaveProperty('name');
        expect(phase).toHaveProperty('description');
        expect(phase).toHaveProperty('duration');
        expect(phase).toHaveProperty('goals');
        expect(phase).toHaveProperty('drillTypes');
        
        expect(phase.goals).toHaveProperty('wpm');
        expect(phase.goals).toHaveProperty('accuracy');
        expect(Array.isArray(phase.drillTypes)).toBe(true);
      });
    });

    it('should have progressive goals', () => {
      for (let i = 1; i < PROGRESSION_PHASES.length; i++) {
        const prev = PROGRESSION_PHASES[i - 1];
        const curr = PROGRESSION_PHASES[i];
        
        expect(curr.goals.wpm).toBeGreaterThan(prev.goals.wpm);
      }
    });
  });
});
