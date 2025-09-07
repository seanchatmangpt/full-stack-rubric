/**
 * @typedef {Object} DifficultyMetrics
 * @property {number} textComplexity - Readability score (1-10)
 * @property {number} keyboardDensity - Key pattern difficulty (1-10)
 * @property {number} conceptualLoad - Programming concept complexity (1-10)
 * @property {number} timeConstraint - Session time pressure (1-10)
 */

/**
 * @typedef {Object} DifficultyLevel
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {DifficultyMetrics} metrics
 * @property {number} targetWPM
 * @property {number} targetAccuracy
 * @property {number} sessionDuration - in minutes
 */

/**
 * @typedef {Object} ProgressionPhase
 * @property {number} phase
 * @property {string} name
 * @property {string} description
 * @property {string} duration
 * @property {Object} goals
 * @property {number} goals.wpm
 * @property {number} goals.accuracy
 * @property {string[]} drillTypes
 */

/**
 * @typedef {Object} PerformanceSession
 * @property {string} drillType
 * @property {number} finalWPM
 * @property {Object} accuracy
 * @property {number} accuracy.raw
 * @property {Array} keystrokes
 */

/**
 * @typedef {Object} Keystroke
 * @property {string} key
 * @property {string} expected
 * @property {boolean} isCorrect
 */

// Predefined difficulty levels based on the typing drill progression
/** @type {DifficultyLevel[]} */
export const DIFFICULTY_LEVELS = [
  {
    id: 'beginner-1',
    name: 'Function Names',
    description: 'Basic function names and identifiers',
    metrics: { textComplexity: 2, keyboardDensity: 3, conceptualLoad: 1, timeConstraint: 2 },
    targetWPM: 35,
    targetAccuracy: 97,
    sessionDuration: 3
  },
  {
    id: 'beginner-2',
    name: 'Simple Patterns',
    description: 'Basic syntax patterns and keywords',
    metrics: { textComplexity: 3, keyboardDensity: 4, conceptualLoad: 2, timeConstraint: 3 },
    targetWPM: 40,
    targetAccuracy: 95,
    sessionDuration: 4
  },
  {
    id: 'intermediate-1',
    name: 'Query Grammar',
    description: 'Query patterns and object structures',
    metrics: { textComplexity: 4, keyboardDensity: 5, conceptualLoad: 4, timeConstraint: 4 },
    targetWPM: 50,
    targetAccuracy: 95,
    sessionDuration: 4
  },
  {
    id: 'intermediate-2',
    name: 'Pipeline Patterns',
    description: 'Function composition and chaining',
    metrics: { textComplexity: 6, keyboardDensity: 6, conceptualLoad: 6, timeConstraint: 5 },
    targetWPM: 55,
    targetAccuracy: 94,
    sessionDuration: 5
  },
  {
    id: 'advanced-1',
    name: 'CRUD Endpoints',
    description: 'Complete API endpoint patterns',
    metrics: { textComplexity: 7, keyboardDensity: 7, conceptualLoad: 7, timeConstraint: 6 },
    targetWPM: 60,
    targetAccuracy: 93,
    sessionDuration: 6
  },
  {
    id: 'advanced-2',
    name: 'Error Handling',
    description: 'Complex error handling and edge cases',
    metrics: { textComplexity: 8, keyboardDensity: 8, conceptualLoad: 8, timeConstraint: 7 },
    targetWPM: 65,
    targetAccuracy: 92,
    sessionDuration: 7
  },
  {
    id: 'expert-1',
    name: 'Full Integration',
    description: 'Complete system patterns with caching',
    metrics: { textComplexity: 9, keyboardDensity: 9, conceptualLoad: 9, timeConstraint: 8 },
    targetWPM: 70,
    targetAccuracy: 91,
    sessionDuration: 8
  },
  {
    id: 'expert-2',
    name: 'Master Level',
    description: 'Complex architectural patterns',
    metrics: { textComplexity: 10, keyboardDensity: 10, conceptualLoad: 10, timeConstraint: 10 },
    targetWPM: 75,
    targetAccuracy: 90,
    sessionDuration: 10
  }
];

// Progression phases aligned with the cookbook methodology
/** @type {ProgressionPhase[]} */
export const PROGRESSION_PHASES = [
  {
    phase: 1,
    name: 'Foundation Building',
    description: 'Build muscle memory for basic patterns',
    duration: '1-2 weeks',
    goals: { wpm: 45, accuracy: 97 },
    drillTypes: ['function-names', 'basic-syntax', 'identifiers']
  },
  {
    phase: 2,
    name: 'Pattern Recognition',
    description: 'Master common programming patterns',
    duration: '1-2 weeks',
    goals: { wpm: 55, accuracy: 95 },
    drillTypes: ['query-grammar', 'object-patterns', 'array-methods']
  },
  {
    phase: 3,
    name: 'Pipeline Mastery',
    description: 'Fluent function composition',
    duration: '1-2 weeks',
    goals: { wpm: 65, accuracy: 94 },
    drillTypes: ['pipeline-patterns', 'composition', 'async-patterns']
  },
  {
    phase: 4,
    name: 'Integration Expertise',
    description: 'Complete endpoint implementation',
    duration: '2-3 weeks',
    goals: { wpm: 70, accuracy: 92 },
    drillTypes: ['crud-endpoints', 'error-handling', 'integration-patterns']
  }
];

export class AdaptiveDifficulty {
  /** @private @readonly */
  TARGET_ACCURACY = 95;
  
  /** @private @readonly */
  TARGET_WPM_MULTIPLIER = 0.8; // 80% of target WPM to advance
  
  /** @private @readonly */
  MIN_SESSIONS_FOR_ADVANCEMENT = 3;
  
  /** @private @type {PerformanceSession[]} */
  history = [];
  
  /** @private @type {DifficultyLevel} */
  currentLevel;
  
  /**
   * @param {string} startingLevel
   */
  constructor(startingLevel = 'beginner-1') {
    const level = DIFFICULTY_LEVELS.find(l => l.id === startingLevel);
    this.currentLevel = level || DIFFICULTY_LEVELS[0];
  }
  
  /**
   * @param {PerformanceSession} session
   */
  addSession(session) {
    this.history.push(session);
    
    // Keep only recent history (last 50 sessions)
    if (this.history.length > 50) {
      this.history = this.history.slice(-50);
    }
  }
  
  /**
   * @returns {DifficultyLevel}
   */
  calculateNextDifficulty() {
    if (this.history.length < this.MIN_SESSIONS_FOR_ADVANCEMENT) {
      return this.currentLevel;
    }
    
    const recentSessions = this.getRecentSessionsForLevel(this.currentLevel.id);
    if (recentSessions.length < this.MIN_SESSIONS_FOR_ADVANCEMENT) {
      return this.currentLevel;
    }
    
    const performance = this.analyzeRecentPerformance(recentSessions);
    
    if (this.shouldAdvanceLevel(performance)) {
      return this.getNextLevel() || this.currentLevel;
    } else if (this.shouldRegress(performance)) {
      return this.getPreviousLevel() || this.currentLevel;
    }
    
    return this.currentLevel;
  }
  
  /**
   * @returns {DifficultyLevel}
   */
  updateCurrentLevel() {
    this.currentLevel = this.calculateNextDifficulty();
    return this.currentLevel;
  }
  
  /**
   * @returns {DifficultyLevel}
   */
  getCurrentLevel() {
    return this.currentLevel;
  }
  
  /**
   * @returns {ProgressionPhase | null}
   */
  getProgressionPhase() {
    const currentIndex = DIFFICULTY_LEVELS.findIndex(l => l.id === this.currentLevel.id);
    
    if (currentIndex <= 1) return PROGRESSION_PHASES[0];
    if (currentIndex <= 3) return PROGRESSION_PHASES[1];
    if (currentIndex <= 5) return PROGRESSION_PHASES[2];
    return PROGRESSION_PHASES[3];
  }
  
  /**
   * @param {DifficultyLevel} difficulty
   * @param {Map<string, number>} [weakPatterns]
   * @returns {string}
   */
  generateAdaptiveText(difficulty, weakPatterns) {
    const patterns = this.getPatternsByDifficulty(difficulty);
    const vocabulary = this.getVocabularyByLevel(difficulty.metrics.conceptualLoad);
    
    // Incorporate user's weak patterns if provided
    if (weakPatterns && weakPatterns.size > 0) {
      const weakPatternText = this.generateWeakPatternText(weakPatterns);
      return this.combinePatterns(patterns, vocabulary, weakPatternText);
    }
    
    return this.synthesizeText(patterns, vocabulary, difficulty.metrics);
  }
  
  /**
   * @returns {string[]}
   */
  getRecommendations() {
    const performance = this.analyzeRecentPerformance(
      this.getRecentSessionsForLevel(this.currentLevel.id)
    );
    
    /** @type {string[]} */
    const recommendations = [];
    
    if (performance.avgAccuracy < this.TARGET_ACCURACY) {
      recommendations.push('Focus on accuracy before speed. Slow down and aim for 97%+ accuracy.');
    }
    
    if (performance.consistency < 70) {
      recommendations.push('Work on typing rhythm. Try to maintain steady keystroke timing.');
    }
    
    if (performance.errorPatterns.size > 3) {
      recommendations.push('Practice your most common error patterns in isolation.');
    }
    
    if (performance.avgWPM < this.currentLevel.targetWPM * 0.6) {
      recommendations.push('Consider dropping to an easier level to build confidence.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Great progress! Keep practicing to advance to the next level.');
    }
    
    return recommendations;
  }
  
  /**
   * @private
   * @param {PerformanceSession[]} sessions
   * @returns {Object}
   */
  analyzeRecentPerformance(sessions) {
    if (sessions.length === 0) {
      return {
        avgWPM: 0,
        avgAccuracy: 0,
        consistency: 0,
        errorPatterns: new Map(),
        trend: 'stable'
      };
    }
    
    const avgWPM = sessions.reduce((sum, s) => sum + s.finalWPM, 0) / sessions.length;
    const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy.raw, 0) / sessions.length;
    
    // Calculate consistency (lower standard deviation = higher consistency)
    const wpmVariance = this.calculateVariance(sessions.map(s => s.finalWPM));
    const consistency = Math.max(0, 100 - Math.sqrt(wpmVariance));
    
    // Aggregate error patterns
    /** @type {Map<string, number>} */
    const errorPatterns = new Map();
    sessions.forEach(session => {
      session.keystrokes
        .filter(k => !k.isCorrect)
        .forEach(k => {
          const pattern = `${k.expected}->${k.key}`;
          errorPatterns.set(pattern, (errorPatterns.get(pattern) || 0) + 1);
        });
    });
    
    // Calculate trend
    const trend = this.calculateTrend(sessions);
    
    return { avgWPM, avgAccuracy, consistency, errorPatterns, trend };
  }
  
  /**
   * @private
   * @param {Object} performance
   * @returns {boolean}
   */
  shouldAdvanceLevel(performance) {
    return (
      performance.avgAccuracy >= this.TARGET_ACCURACY &&
      performance.avgWPM >= this.currentLevel.targetWPM * this.TARGET_WPM_MULTIPLIER &&
      performance.consistency >= 70 &&
      performance.trend === 'improving'
    );
  }
  
  /**
   * @private
   * @param {Object} performance
   * @returns {boolean}
   */
  shouldRegress(performance) {
    return (
      performance.avgAccuracy < 85 ||
      (performance.avgWPM < this.currentLevel.targetWPM * 0.5 && performance.trend === 'declining')
    );
  }
  
  /**
   * @private
   * @returns {DifficultyLevel | null}
   */
  getNextLevel() {
    const currentIndex = DIFFICULTY_LEVELS.findIndex(l => l.id === this.currentLevel.id);
    return currentIndex < DIFFICULTY_LEVELS.length - 1 ? DIFFICULTY_LEVELS[currentIndex + 1] : null;
  }
  
  /**
   * @private
   * @returns {DifficultyLevel | null}
   */
  getPreviousLevel() {
    const currentIndex = DIFFICULTY_LEVELS.findIndex(l => l.id === this.currentLevel.id);
    return currentIndex > 0 ? DIFFICULTY_LEVELS[currentIndex - 1] : null;
  }
  
  /**
   * @private
   * @param {string} levelId
   * @returns {PerformanceSession[]}
   */
  getRecentSessionsForLevel(levelId) {
    return this.history
      .filter(s => s.drillType === levelId)
      .slice(-10); // Last 10 sessions for this level
  }
  
  /**
   * @private
   * @param {number[]} values
   * @returns {number}
   */
  calculateVariance(values) {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return variance;
  }
  
  /**
   * @private
   * @param {PerformanceSession[]} sessions
   * @returns {'improving' | 'declining' | 'stable'}
   */
  calculateTrend(sessions) {
    if (sessions.length < 3) return 'stable';
    
    const recent = sessions.slice(-3);
    const older = sessions.slice(-6, -3);
    
    if (older.length === 0) return 'stable';
    
    const recentAvgWPM = recent.reduce((sum, s) => sum + s.finalWPM, 0) / recent.length;
    const olderAvgWPM = older.reduce((sum, s) => sum + s.finalWPM, 0) / older.length;
    
    const difference = recentAvgWPM - olderAvgWPM;
    
    if (difference > 2) return 'improving';
    if (difference < -2) return 'declining';
    return 'stable';
  }
  
  /**
   * @private
   * @param {DifficultyLevel} difficulty
   * @returns {string[]}
   */
  getPatternsByDifficulty(difficulty) {
    // Return patterns based on difficulty level
    switch (difficulty.id) {
      case 'beginner-1':
        return [
          'parseQuery', 'filterByStatus', 'filterByOwner', 'sortBy', 'paginate',
          'applyCache', 'formatResponse', 'loadStore', 'listItems'
        ];
      
      case 'beginner-2':
        return [
          'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
          'true', 'false', 'null', 'undefined'
        ];
      
      case 'intermediate-1':
        return [
          'status=open', 'owner=101', 'q=title', 'sort=createdAt:desc',
          'page=1', 'limit=20', 'useCache=true'
        ];
      
      case 'intermediate-2':
        return [
          'const filtered = [filterByStatus(status), filterByOwner(owner)]',
          '.reduce((acc, fn) => fn(acc), base)',
          'const sorted = sortBy(field, direction)(filtered)'
        ];
      
      default:
        return ['// Advanced patterns for higher levels'];
    }
  }
  
  /**
   * @private
   * @param {number} conceptualLoad
   * @returns {string[]}
   */
  getVocabularyByLevel(conceptualLoad) {
    if (conceptualLoad <= 3) {
      return ['filter', 'map', 'reduce', 'sort', 'find', 'some', 'every'];
    } else if (conceptualLoad <= 6) {
      return ['async', 'await', 'Promise', 'fetch', 'response', 'json', 'error'];
    } else {
      return ['middleware', 'authentication', 'authorization', 'validation', 'serialization'];
    }
  }
  
  /**
   * @private
   * @param {Map<string, number>} weakPatterns
   * @returns {string}
   */
  generateWeakPatternText(weakPatterns) {
    const sortedPatterns = Array.from(weakPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return sortedPatterns.map(([pattern]) => {
      const [expected, actual] = pattern.split('->');
      return `${expected}${expected}${expected} // Practice: avoid typing '${actual}'`;
    }).join('\n');
  }
  
  /**
   * @private
   * @param {string[]} patterns
   * @param {string[]} vocabulary
   * @param {DifficultyMetrics} metrics
   * @returns {string}
   */
  synthesizeText(patterns, vocabulary, metrics) {
    // Combine patterns and vocabulary based on difficulty metrics
    const complexity = Math.floor(metrics.textComplexity);
    const selectedPatterns = patterns.slice(0, Math.max(1, complexity));
    const selectedVocab = vocabulary.slice(0, Math.max(1, Math.floor(metrics.conceptualLoad / 2)));
    
    return [...selectedPatterns, ...selectedVocab].join('\n');
  }
  
  /**
   * @private
   * @param {string[]} patterns
   * @param {string[]} vocabulary
   * @param {string} weakPatternText
   * @returns {string}
   */
  combinePatterns(patterns, vocabulary, weakPatternText) {
    return [weakPatternText, ...patterns.slice(0, 3), ...vocabulary.slice(0, 2)].join('\n');
  }
}