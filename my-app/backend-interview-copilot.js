import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Interview Rubric Scoring System
const RUBRIC_DIMENSIONS = {
  technical: {
    correctness: { weight: 0.3, maxScore: 10 },
    codeStructure: { weight: 0.2, maxScore: 10 },
    patternUsage: { weight: 0.2, maxScore: 10 },
    edgeCases: { weight: 0.15, maxScore: 10 },
    performance: { weight: 0.15, maxScore: 10 }
  },
  communication: {
    problemDecomposition: { weight: 0.25, maxScore: 10 },
    clarifyingQuestions: { weight: 0.25, maxScore: 10 },
    tradeoffArticulation: { weight: 0.25, maxScore: 10 },
    progressCommunication: { weight: 0.25, maxScore: 10 }
  },
  problemSolving: {
    approach: { weight: 0.3, maxScore: 10 },
    debugging: { weight: 0.3, maxScore: 10 },
    optimization: { weight: 0.2, maxScore: 10 },
    timeManagement: { weight: 0.2, maxScore: 10 }
  }
};

// Interview Drills Database
const INTERVIEW_DRILLS = [
  {
    id: 'drill-1',
    title: 'Property Search Implementation',
    difficulty: 'medium',
    timeLimit: 45,
    category: 'backend',
    description: 'Implement a property search API with filtering, sorting, and pagination',
    requirements: [
      'Filter by price range, location, and property type',
      'Sort by price, date, or relevance',
      'Implement efficient pagination',
      'Handle edge cases gracefully'
    ],
    starterCode: `// Implement the searchProperties function
function searchProperties(properties, filters) {
  // Your code here
}`,
    testCases: [
      { input: { minPrice: 100000, maxPrice: 500000 }, expectedCount: 5 },
      { input: { location: 'Downtown' }, expectedCount: 3 },
      { input: { type: 'Apartment', sort: 'price_asc' }, expectedCount: 4 }
    ],
    rubricWeights: {
      correctness: 0.4,
      performance: 0.3,
      edgeCases: 0.3
    }
  },
  {
    id: 'drill-2',
    title: 'Component State Management',
    difficulty: 'easy',
    timeLimit: 30,
    category: 'frontend',
    description: 'Build a Vue component with proper state management for a property listing',
    requirements: [
      'Implement reactive state for property data',
      'Handle loading and error states',
      'Create computed properties for derived data',
      'Implement user interactions'
    ],
    starterCode: `<template>
  <!-- Your template here -->
</template>

<script setup>
// Your Vue 3 composition API code here
</script>`,
    testCases: [
      { action: 'mount', expectedState: { loading: true } },
      { action: 'dataLoaded', expectedState: { loading: false, properties: [] } },
      { action: 'filterApplied', expectedState: { filteredCount: 3 } }
    ]
  },
  {
    id: 'drill-3',
    title: 'System Design: Real Estate Platform',
    difficulty: 'hard',
    timeLimit: 60,
    category: 'system-design',
    description: 'Design a scalable real estate platform architecture',
    requirements: [
      'Handle millions of property listings',
      'Support real-time updates',
      'Implement search with < 100ms latency',
      'Design for global scale'
    ],
    evaluationType: 'discussion',
    rubricWeights: {
      approach: 0.4,
      tradeoffArticulation: 0.3,
      scalability: 0.3
    }
  }
];

// Active Interview Sessions Storage
const activeSessions = new Map();

// Simulation Session Class
class InterviewSession {
  constructor(userId, drillId) {
    this.id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.userId = userId;
    this.drillId = drillId;
    this.drill = INTERVIEW_DRILLS.find(d => d.id === drillId);
    this.startTime = new Date();
    this.endTime = null;
    this.chatTranscript = [];
    this.codeSnapshots = [];
    this.currentCode = this.drill?.starterCode || '';
    this.status = 'active';
    this.scores = null;
    this.feedback = null;
  }

  addChatMessage(role, message) {
    this.chatTranscript.push({
      timestamp: new Date(),
      role, // 'interviewer' or 'candidate'
      message
    });
  }

  updateCode(code) {
    this.currentCode = code;
    this.codeSnapshots.push({
      timestamp: new Date(),
      code
    });
  }

  complete() {
    this.endTime = new Date();
    this.status = 'completed';
    this.duration = Math.floor((this.endTime - this.startTime) / 1000); // in seconds
  }

  generateScores() {
    // Simulate AI scoring based on rubric
    const scores = {};
    
    // Technical scores
    scores.technical = {};
    for (const [dimension, config] of Object.entries(RUBRIC_DIMENSIONS.technical)) {
      scores.technical[dimension] = {
        score: Math.floor(Math.random() * 4) + 6, // 6-10 range for demo
        maxScore: config.maxScore,
        weight: config.weight
      };
    }
    
    // Communication scores
    scores.communication = {};
    for (const [dimension, config] of Object.entries(RUBRIC_DIMENSIONS.communication)) {
      scores.communication[dimension] = {
        score: Math.floor(Math.random() * 4) + 6,
        maxScore: config.maxScore,
        weight: config.weight
      };
    }
    
    // Problem solving scores
    scores.problemSolving = {};
    for (const [dimension, config] of Object.entries(RUBRIC_DIMENSIONS.problemSolving)) {
      scores.problemSolving[dimension] = {
        score: Math.floor(Math.random() * 4) + 6,
        maxScore: config.maxScore,
        weight: config.weight
      };
    }
    
    // Calculate weighted totals
    scores.totalScore = this.calculateTotalScore(scores);
    
    this.scores = scores;
    return scores;
  }

  calculateTotalScore(scores) {
    let total = 0;
    let maxTotal = 0;
    
    for (const category of ['technical', 'communication', 'problemSolving']) {
      for (const [dimension, data] of Object.entries(scores[category])) {
        total += data.score * data.weight;
        maxTotal += data.maxScore * data.weight;
      }
    }
    
    return {
      raw: total,
      max: maxTotal,
      percentage: Math.round((total / maxTotal) * 100)
    };
  }

  generateFeedback() {
    // Simulate AI-generated feedback
    const feedback = {
      summary: `You completed the ${this.drill.title} drill in ${this.duration} seconds.`,
      strengths: [],
      improvements: [],
      codeReview: [],
      communicationReview: [],
      nextSteps: []
    };
    
    // Generate strengths based on high scores
    if (this.scores.technical.correctness.score >= 8) {
      feedback.strengths.push('Strong implementation correctness');
    }
    if (this.scores.communication.clarifyingQuestions.score >= 8) {
      feedback.strengths.push('Excellent clarifying questions');
    }
    
    // Generate improvements based on lower scores
    if (this.scores.technical.performance.score < 7) {
      feedback.improvements.push('Consider optimizing for performance');
    }
    if (this.scores.communication.tradeoffArticulation.score < 7) {
      feedback.improvements.push('Better articulate design tradeoffs');
    }
    
    // Code review points
    feedback.codeReview = [
      {
        line: 5,
        type: 'improvement',
        message: 'Consider using a more efficient data structure here'
      },
      {
        line: 12,
        type: 'good',
        message: 'Good edge case handling'
      }
    ];
    
    // Communication review
    feedback.communicationReview = [
      {
        timestamp: '00:02:15',
        type: 'positive',
        message: 'Good job asking about expected data volume'
      },
      {
        timestamp: '00:15:30',
        type: 'suggestion',
        message: 'Could have explained your approach before coding'
      }
    ];
    
    // Next steps
    feedback.nextSteps = [
      'Practice more system design problems',
      'Review data structure optimization techniques',
      'Work on verbal communication during coding'
    ];
    
    this.feedback = feedback;
    return feedback;
  }
}

// API ENDPOINTS

// Get available interview drills
app.get('/api/interview/drills', (req, res) => {
  const { category, difficulty } = req.query;
  
  let drills = [...INTERVIEW_DRILLS];
  
  if (category) {
    drills = drills.filter(d => d.category === category);
  }
  
  if (difficulty) {
    drills = drills.filter(d => d.difficulty === difficulty);
  }
  
  res.json(drills);
});

// Start a new interview session
app.post('/api/interview/sessions/start', (req, res) => {
  const { userId, drillId } = req.body;
  
  if (!userId || !drillId) {
    return res.status(400).json({ error: 'userId and drillId required' });
  }
  
  const drill = INTERVIEW_DRILLS.find(d => d.id === drillId);
  if (!drill) {
    return res.status(404).json({ error: 'Drill not found' });
  }
  
  const session = new InterviewSession(userId, drillId);
  activeSessions.set(session.id, session);
  
  // Initial interviewer message
  session.addChatMessage('interviewer', 
    `Welcome! Today we'll be working on: ${drill.title}. ${drill.description} You have ${drill.timeLimit} minutes. Feel free to ask any clarifying questions before we begin.`
  );
  
  res.json({
    sessionId: session.id,
    drill,
    starterCode: drill.starterCode,
    initialMessage: session.chatTranscript[0]
  });
});

// Send chat message in session
app.post('/api/interview/sessions/:sessionId/chat', (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;
  
  const session = activeSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Add candidate message
  session.addChatMessage('candidate', message);
  
  // Generate AI interviewer response (simplified)
  let response = '';
  if (message.toLowerCase().includes('clarify') || message.includes('?')) {
    response = "Good question! Let me clarify that for you. In this problem, you should consider both performance and correctness. The dataset could be quite large (up to 100k items).";
  } else if (message.toLowerCase().includes('approach')) {
    response = "That sounds like a solid approach. Can you walk me through how you'd handle edge cases?";
  } else {
    response = "I see. Please continue with your implementation.";
  }
  
  session.addChatMessage('interviewer', response);
  
  res.json({
    response,
    transcript: session.chatTranscript
  });
});

// Update code in session
app.post('/api/interview/sessions/:sessionId/code', (req, res) => {
  const { sessionId } = req.params;
  const { code } = req.body;
  
  const session = activeSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.updateCode(code);
  
  res.json({
    saved: true,
    snapshotCount: session.codeSnapshots.length
  });
});

// Submit session for evaluation
app.post('/api/interview/sessions/:sessionId/submit', (req, res) => {
  const { sessionId } = req.params;
  
  const session = activeSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  session.complete();
  const scores = session.generateScores();
  const feedback = session.generateFeedback();
  
  res.json({
    sessionId,
    duration: session.duration,
    scores,
    feedback,
    transcript: session.chatTranscript,
    finalCode: session.currentCode
  });
});

// Get session results
app.get('/api/interview/sessions/:sessionId/results', (req, res) => {
  const { sessionId } = req.params;
  
  const session = activeSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  if (session.status !== 'completed') {
    return res.status(400).json({ error: 'Session not yet completed' });
  }
  
  res.json({
    sessionId,
    drill: session.drill,
    duration: session.duration,
    scores: session.scores,
    feedback: session.feedback,
    transcript: session.chatTranscript,
    codeSnapshots: session.codeSnapshots
  });
});

// Get user performance history
app.get('/api/interview/users/:userId/performance', (req, res) => {
  const { userId } = req.params;
  
  // Get all sessions for user
  const userSessions = Array.from(activeSessions.values())
    .filter(s => s.userId === userId && s.status === 'completed');
  
  // Calculate aggregate scores
  const performanceData = {
    totalSessions: userSessions.length,
    averageScore: 0,
    strongestAreas: [],
    improvementAreas: [],
    recentSessions: [],
    progressOverTime: []
  };
  
  if (userSessions.length > 0) {
    // Calculate average score
    const avgScore = userSessions.reduce((sum, s) => 
      sum + (s.scores?.totalScore?.percentage || 0), 0) / userSessions.length;
    performanceData.averageScore = Math.round(avgScore);
    
    // Identify strong and weak areas
    const dimensionScores = {};
    userSessions.forEach(session => {
      if (session.scores) {
        for (const category of ['technical', 'communication', 'problemSolving']) {
          for (const [dimension, data] of Object.entries(session.scores[category])) {
            if (!dimensionScores[dimension]) {
              dimensionScores[dimension] = [];
            }
            dimensionScores[dimension].push(data.score);
          }
        }
      }
    });
    
    // Calculate average for each dimension
    const dimensionAverages = {};
    for (const [dimension, scores] of Object.entries(dimensionScores)) {
      dimensionAverages[dimension] = 
        scores.reduce((a, b) => a + b, 0) / scores.length;
    }
    
    // Sort to find strongest and weakest
    const sorted = Object.entries(dimensionAverages)
      .sort((a, b) => b[1] - a[1]);
    
    performanceData.strongestAreas = sorted.slice(0, 3).map(([dim, score]) => ({
      dimension: dim,
      averageScore: Math.round(score * 10) / 10
    }));
    
    performanceData.improvementAreas = sorted.slice(-3).map(([dim, score]) => ({
      dimension: dim,
      averageScore: Math.round(score * 10) / 10
    }));
    
    // Recent sessions
    performanceData.recentSessions = userSessions
      .sort((a, b) => b.endTime - a.endTime)
      .slice(0, 5)
      .map(s => ({
        sessionId: s.id,
        drillTitle: s.drill.title,
        score: s.scores?.totalScore?.percentage,
        date: s.endTime
      }));
    
    // Progress over time
    performanceData.progressOverTime = userSessions
      .sort((a, b) => a.endTime - b.endTime)
      .map(s => ({
        date: s.endTime,
        score: s.scores?.totalScore?.percentage
      }));
  }
  
  res.json(performanceData);
});

// Get rubric details
app.get('/api/interview/rubric', (req, res) => {
  res.json(RUBRIC_DIMENSIONS);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Interview Copilot Backend running on http://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/interview/drills - List available interview drills`);
  console.log(`  POST /api/interview/sessions/start - Start new interview session`);
  console.log(`  POST /api/interview/sessions/:id/chat - Send chat message`);
  console.log(`  POST /api/interview/sessions/:id/code - Update code`);
  console.log(`  POST /api/interview/sessions/:id/submit - Submit for evaluation`);
  console.log(`  GET  /api/interview/sessions/:id/results - Get session results`);
  console.log(`  GET  /api/interview/users/:id/performance - Get user performance`);
  console.log(`  GET  /api/interview/rubric - Get rubric dimensions`);
});