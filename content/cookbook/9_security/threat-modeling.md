# Threat Modeling Framework

Comprehensive threat modeling methodology for identifying, analyzing, and mitigating security risks.

## STRIDE Threat Modeling

### Threat Categories

```javascript
/**
 * STRIDE threat modeling implementation
 * Systematic approach to identify security threats
 */
class STRIDEThreatModel {
  constructor(system) {
    this.system = system
    this.threats = []
    this.mitigations = []
  }
  
  /**
   * Analyze system using STRIDE methodology
   * @returns {Object} Threat analysis results
   */
  analyzeThreats() {
    const strideCategories = {
      spoofing: this.analyzeSpoofingThreats(),
      tampering: this.analyzeTamperingThreats(),
      repudiation: this.analyzeRepudiationThreats(),
      informationDisclosure: this.analyzeInformationDisclosureThreats(),
      denialOfService: this.analyzeDenialOfServiceThreats(),
      elevationOfPrivilege: this.analyzeElevationOfPrivilegeThreats()
    }
    
    return {
      systemOverview: this.system,
      threatsByCategory: strideCategories,
      riskAssessment: this.calculateRiskScores(strideCategories),
      mitigationPriorities: this.prioritizeMitigations()
    }
  }
  
  /**
   * Analyze spoofing threats
   * Identity-based attacks
   */
  analyzeSpoofingThreats() {
    const threats = []
    
    // Authentication bypass threats
    threats.push({
      id: 'S001',
      title: 'Weak Authentication Mechanisms',
      description: 'Attacker bypasses authentication using weak passwords, default credentials, or authentication flaws',
      assets: ['User accounts', 'Admin interface', 'API endpoints'],
      attackVectors: [
        'Password brute force attacks',
        'Default credential exploitation',
        'Session hijacking',
        'Token manipulation'
      ],
      impact: 'High - Complete account takeover',
      likelihood: 'Medium',
      riskScore: 7.5,
      mitigations: [
        'Implement strong password policies',
        'Enable multi-factor authentication',
        'Use secure session management',
        'Implement account lockout mechanisms'
      ]
    })
    
    // Identity spoofing
    threats.push({
      id: 'S002',
      title: 'Identity Spoofing in Communications',
      description: 'Attacker impersonates legitimate users or services',
      assets: ['Email communications', 'API communications', 'User interfaces'],
      attackVectors: [
        'Email spoofing',
        'DNS spoofing',
        'IP address spoofing',
        'Certificate spoofing'
      ],
      impact: 'Medium - Unauthorized access to resources',
      likelihood: 'Medium',
      riskScore: 6.0,
      mitigations: [
        'Implement SPF, DKIM, DMARC for email',
        'Use certificate pinning',
        'Implement mutual TLS authentication',
        'Verify caller identity through multiple factors'
      ]
    })
    
    return threats
  }
  
  /**
   * Analyze tampering threats
   * Data integrity attacks
   */
  analyzeTamperingThreats() {
    const threats = []
    
    threats.push({
      id: 'T001',
      title: 'Data Tampering in Transit',
      description: 'Attacker modifies data during transmission',
      assets: ['API communications', 'Database connections', 'File transfers'],
      attackVectors: [
        'Man-in-the-middle attacks',
        'Protocol downgrade attacks',
        'Certificate substitution',
        'Network packet injection'
      ],
      impact: 'High - Data corruption and integrity loss',
      likelihood: 'Medium',
      riskScore: 7.0,
      mitigations: [
        'Enforce TLS 1.2+ for all communications',
        'Implement certificate validation',
        'Use message authentication codes (MAC)',
        'Deploy network monitoring and intrusion detection'
      ]
    })
    
    threats.push({
      id: 'T002',
      title: 'Database Tampering',
      description: 'Unauthorized modification of stored data',
      assets: ['User data', 'Configuration data', 'Audit logs'],
      attackVectors: [
        'SQL injection attacks',
        'Privilege escalation',
        'Direct database access',
        'Backup file modification'
      ],
      impact: 'Critical - Complete data integrity compromise',
      likelihood: 'Low',
      riskScore: 6.5,
      mitigations: [
        'Implement parameterized queries',
        'Use database access controls',
        'Enable database audit logging',
        'Encrypt sensitive data at rest'
      ]
    })
    
    return threats
  }
  
  /**
   * Calculate risk scores for all threats
   * @param {Object} threatsByCategory - Categorized threats
   * @returns {Object} Risk assessment summary
   */
  calculateRiskScores(threatsByCategory) {
    const allThreats = Object.values(threatsByCategory).flat()
    
    const riskDistribution = {
      critical: allThreats.filter(t => t.riskScore >= 9).length,
      high: allThreats.filter(t => t.riskScore >= 7 && t.riskScore < 9).length,
      medium: allThreats.filter(t => t.riskScore >= 4 && t.riskScore < 7).length,
      low: allThreats.filter(t => t.riskScore < 4).length
    }
    
    const averageRisk = allThreats.reduce((sum, t) => sum + t.riskScore, 0) / allThreats.length
    
    return {
      totalThreats: allThreats.length,
      averageRisk: Math.round(averageRisk * 10) / 10,
      distribution: riskDistribution,
      highestRiskThreats: allThreats
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5)
    }
  }
}
```

## Attack Tree Analysis

```javascript
/**
 * Attack tree analysis for systematic threat exploration
 */
class AttackTreeAnalyzer {
  constructor() {
    this.attackTrees = new Map()
  }
  
  /**
   * Create attack tree for specific goal
   * @param {string} goal - Attack goal
   * @returns {Object} Attack tree structure
   */
  createAttackTree(goal) {
    const tree = {
      goal: goal,
      id: this.generateTreeId(),
      root: this.buildAttackNode(goal),
      paths: [],
      mitigations: []
    }
    
    this.attackTrees.set(tree.id, tree)
    return tree
  }
  
  /**
   * Build comprehensive attack tree for data breach
   * @returns {Object} Data breach attack tree
   */
  buildDataBreachAttackTree() {
    return {
      goal: 'Data Breach - Steal Sensitive Customer Data',
      type: 'OR',
      children: [
        {
          goal: 'Direct Database Attack',
          type: 'AND',
          children: [
            {
              goal: 'Gain Database Access',
              type: 'OR',
              children: [
                {
                  goal: 'SQL Injection',
                  type: 'leaf',
                  probability: 0.3,
                  impact: 9,
                  effort: 'Medium',
                  mitigations: ['Input validation', 'Parameterized queries', 'WAF']
                },
                {
                  goal: 'Database Credential Theft',
                  type: 'OR',
                  children: [
                    {
                      goal: 'Configuration File Exposure',
                      type: 'leaf',
                      probability: 0.2,
                      impact: 8,
                      effort: 'Low'
                    },
                    {
                      goal: 'Environment Variable Exposure',
                      type: 'leaf',
                      probability: 0.15,
                      impact: 8,
                      effort: 'Low'
                    }
                  ]
                },
                {
                  goal: 'Network Eavesdropping',
                  type: 'leaf',
                  probability: 0.1,
                  impact: 7,
                  effort: 'High',
                  mitigations: ['TLS encryption', 'Network segmentation']
                }
              ]
            },
            {
              goal: 'Extract Sensitive Data',
              type: 'leaf',
              probability: 0.9,
              impact: 10,
              effort: 'Low',
              mitigations: ['Data encryption', 'Access logging', 'DLP']
            }
          ]
        },
        {
          goal: 'Application-Level Attack',
          type: 'AND',
          children: [
            {
              goal: 'Gain Application Access',
              type: 'OR',
              children: [
                {
                  goal: 'Authentication Bypass',
                  type: 'OR',
                  children: [
                    {
                      goal: 'Password Attack',
                      type: 'leaf',
                      probability: 0.4,
                      impact: 8,
                      effort: 'Medium'
                    },
                    {
                      goal: 'Session Hijacking',
                      type: 'leaf',
                      probability: 0.25,
                      impact: 8,
                      effort: 'Medium'
                    }
                  ]
                },
                {
                  goal: 'Authorization Flaws',
                  type: 'leaf',
                  probability: 0.3,
                  impact: 7,
                  effort: 'Medium'
                }
              ]
            },
            {
              goal: 'Data Exfiltration',
              type: 'OR',
              children: [
                {
                  goal: 'API Data Extraction',
                  type: 'leaf',
                  probability: 0.8,
                  impact: 9,
                  effort: 'Low'
                },
                {
                  goal: 'Screen Scraping',
                  type: 'leaf',
                  probability: 0.6,
                  impact: 6,
                  effort: 'High'
                }
              ]
            }
          ]
        },
        {
          goal: 'Infrastructure Attack',
          type: 'AND',
          children: [
            {
              goal: 'Gain Infrastructure Access',
              type: 'OR',
              children: [
                {
                  goal: 'Container Escape',
                  type: 'leaf',
                  probability: 0.1,
                  impact: 9,
                  effort: 'High',
                  mitigations: ['Container hardening', 'Runtime protection']
                },
                {
                  goal: 'Cloud Misconfiguration',
                  type: 'leaf',
                  probability: 0.4,
                  impact: 8,
                  effort: 'Low',
                  mitigations: ['Configuration scanning', 'Least privilege']
                }
              ]
            },
            {
              goal: 'Access Data Stores',
              type: 'leaf',
              probability: 0.7,
              impact: 9,
              effort: 'Medium'
            }
          ]
        }
      ]
    }
  }
  
  /**
   * Calculate attack path probabilities
   * @param {Object} tree - Attack tree
   * @returns {Array} Attack paths with probabilities
   */
  calculateAttackPaths(tree) {
    const paths = []
    
    function traverseTree(node, currentPath = [], currentProbability = 1) {
      if (node.type === 'leaf') {
        paths.push({
          path: [...currentPath, node.goal],
          probability: currentProbability * (node.probability || 1),
          impact: node.impact || 5,
          effort: node.effort || 'Unknown',
          mitigations: node.mitigations || []
        })
        return
      }
      
      if (node.children) {
        for (const child of node.children) {
          let newProbability = currentProbability
          
          if (node.type === 'AND') {
            newProbability *= (child.probability || 1)
          } else if (node.type === 'OR') {
            // For OR nodes, we consider each child as a separate path
            traverseTree(child, [...currentPath, node.goal], currentProbability)
            continue
          }
          
          traverseTree(child, [...currentPath, node.goal], newProbability)
        }
      }
    }
    
    traverseTree(tree)
    
    return paths.sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact))
  }
}
```

## Security Risk Assessment

```javascript
/**
 * Quantitative security risk assessment framework
 */
class SecurityRiskAssessment {
  constructor() {
    this.assets = []
    this.threats = []
    this.vulnerabilities = []
    this.riskMatrix = this.initializeRiskMatrix()
  }
  
  /**
   * Initialize risk assessment matrix
   * @returns {Object} Risk matrix configuration
   */
  initializeRiskMatrix() {
    return {
      impact: {
        1: 'Minimal',
        2: 'Minor', 
        3: 'Moderate',
        4: 'Major',
        5: 'Severe'
      },
      likelihood: {
        1: 'Very Low',
        2: 'Low',
        3: 'Medium',
        4: 'High', 
        5: 'Very High'
      },
      riskLevels: {
        'Low': { min: 1, max: 6, color: 'green' },
        'Medium': { min: 7, max: 12, color: 'yellow' },
        'High': { min: 13, max: 20, color: 'orange' },
        'Critical': { min: 21, max: 25, color: 'red' }
      }
    }
  }
  
  /**
   * Conduct comprehensive risk assessment
   * @param {Array} assets - System assets
   * @returns {Object} Risk assessment results
   */
  conductRiskAssessment(assets) {
    const riskAssessment = {
      assessmentDate: new Date().toISOString(),
      assets: assets,
      risks: [],
      summary: {
        totalRisks: 0,
        riskDistribution: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      }
    }
    
    for (const asset of assets) {
      const assetRisks = this.assessAssetRisks(asset)
      riskAssessment.risks.push(...assetRisks)
    }
    
    riskAssessment.summary = this.calculateRiskSummary(riskAssessment.risks)
    riskAssessment.prioritizedMitigations = this.prioritizeMitigations(riskAssessment.risks)
    
    return riskAssessment
  }
  
  /**
   * Assess risks for a specific asset
   * @param {Object} asset - Asset to assess
   * @returns {Array} Risk scenarios for asset
   */
  assessAssetRisks(asset) {
    const riskScenarios = []
    
    // Define common threat scenarios based on asset type
    const threatScenarios = this.getThreatScenariosForAsset(asset)
    
    for (const scenario of threatScenarios) {
      const risk = {
        id: this.generateRiskId(),
        assetId: asset.id,
        assetName: asset.name,
        assetValue: asset.value,
        threat: scenario.threat,
        vulnerability: scenario.vulnerability,
        impact: this.calculateImpact(asset, scenario),
        likelihood: this.calculateLikelihood(scenario),
        riskScore: 0,
        riskLevel: '',
        mitigations: scenario.mitigations || [],
        residualRisk: 0
      }
      
      risk.riskScore = risk.impact * risk.likelihood
      risk.riskLevel = this.determineRiskLevel(risk.riskScore)
      risk.residualRisk = this.calculateResidualRisk(risk)
      
      riskScenarios.push(risk)
    }
    
    return riskScenarios
  }
  
  /**
   * Get threat scenarios for specific asset type
   * @param {Object} asset - Asset information
   * @returns {Array} Relevant threat scenarios
   */
  getThreatScenariosForAsset(asset) {
    const scenarioMap = {
      'web-application': [
        {
          threat: 'SQL Injection Attack',
          vulnerability: 'Unvalidated input parameters',
          baseImpact: 4,
          baseLikelihood: 3,
          mitigations: ['Input validation', 'Parameterized queries', 'WAF']
        },
        {
          threat: 'Cross-Site Scripting (XSS)',
          vulnerability: 'Insufficient output encoding',
          baseImpact: 3,
          baseLikelihood: 4,
          mitigations: ['Output encoding', 'CSP headers', 'Input validation']
        },
        {
          threat: 'Authentication Bypass',
          vulnerability: 'Weak authentication mechanism',
          baseImpact: 5,
          baseLikelihood: 2,
          mitigations: ['MFA', 'Strong password policy', 'Session management']
        }
      ],
      'database': [
        {
          threat: 'Unauthorized Data Access',
          vulnerability: 'Excessive database privileges',
          baseImpact: 5,
          baseLikelihood: 3,
          mitigations: ['Principle of least privilege', 'Database auditing', 'Encryption']
        },
        {
          threat: 'Data Breach via Backup',
          vulnerability: 'Unencrypted database backups',
          baseImpact: 5,
          baseLikelihood: 2,
          mitigations: ['Backup encryption', 'Secure storage', 'Access controls']
        }
      ],
      'api': [
        {
          threat: 'API Rate Limit Bypass',
          vulnerability: 'Missing or weak rate limiting',
          baseImpact: 3,
          baseLikelihood: 4,
          mitigations: ['Rate limiting', 'API gateway', 'Monitoring']
        },
        {
          threat: 'Sensitive Data Exposure',
          vulnerability: 'Excessive data in API responses',
          baseImpact: 4,
          baseLikelihood: 3,
          mitigations: ['Data minimization', 'Field filtering', 'Access controls']
        }
      ]
    }
    
    return scenarioMap[asset.type] || []
  }
  
  /**
   * Calculate business impact score
   * @param {Object} asset - Asset information
   * @param {Object} scenario - Threat scenario
   * @returns {number} Impact score (1-5)
   */
  calculateImpact(asset, scenario) {
    let impact = scenario.baseImpact || 3
    
    // Adjust based on asset criticality
    impact += (asset.criticality || 3) - 3
    
    // Adjust based on data sensitivity
    if (asset.dataClassification === 'confidential') impact += 1
    if (asset.dataClassification === 'restricted') impact += 2
    
    // Adjust based on user base
    if (asset.userBase === 'external') impact += 1
    if (asset.userBase === 'public') impact += 2
    
    return Math.min(Math.max(impact, 1), 5)
  }
  
  /**
   * Calculate likelihood score
   * @param {Object} scenario - Threat scenario
   * @returns {number} Likelihood score (1-5)
   */
  calculateLikelihood(scenario) {
    let likelihood = scenario.baseLikelihood || 3
    
    // Adjust based on existing controls
    const mitigationCount = scenario.mitigations?.length || 0
    likelihood = Math.max(likelihood - Math.floor(mitigationCount / 2), 1)
    
    // Adjust based on threat intelligence
    if (scenario.activeThreat) likelihood += 1
    if (scenario.knownExploits) likelihood += 1
    
    return Math.min(Math.max(likelihood, 1), 5)
  }
  
  /**
   * Determine risk level based on score
   * @param {number} riskScore - Calculated risk score
   * @returns {string} Risk level
   */
  determineRiskLevel(riskScore) {
    for (const [level, range] of Object.entries(this.riskMatrix.riskLevels)) {
      if (riskScore >= range.min && riskScore <= range.max) {
        return level
      }
    }
    return 'Unknown'
  }
  
  /**
   * Generate risk treatment plan
   * @param {Array} risks - Identified risks
   * @returns {Object} Risk treatment recommendations
   */
  generateRiskTreatmentPlan(risks) {
    const treatmentPlan = {
      immediate: [], // Critical/High risks requiring immediate attention
      shortTerm: [], // Medium risks for short-term mitigation
      longTerm: [], // Low risks for long-term planning
      accept: [] // Risks below acceptance threshold
    }
    
    for (const risk of risks) {
      const treatment = {
        riskId: risk.id,
        riskDescription: `${risk.threat} affecting ${risk.assetName}`,
        currentRisk: risk.riskLevel,
        recommendedActions: risk.mitigations,
        estimatedCost: this.estimateMitigationCost(risk),
        timeline: this.estimateTimeline(risk),
        residualRisk: this.calculateResidualRisk(risk)
      }
      
      switch (risk.riskLevel) {
        case 'Critical':
          treatmentPlan.immediate.push(treatment)
          break
        case 'High':
          treatmentPlan.immediate.push(treatment)
          break
        case 'Medium':
          treatmentPlan.shortTerm.push(treatment)
          break
        case 'Low':
          treatmentPlan.longTerm.push(treatment)
          break
      }
    }
    
    return treatmentPlan
  }
}
```

## Threat Intelligence Integration

```javascript
/**
 * Threat intelligence integration for contextual risk assessment
 */
class ThreatIntelligenceService {
  constructor(config) {
    this.config = config
    this.sources = {
      mitre: new MITREATTCKClient(),
      cve: new CVEDatabaseClient(),
      commercial: new CommercialThreatFeedClient(config.threatFeed)
    }
  }
  
  /**
   * Enrich risk assessment with threat intelligence
   * @param {Array} risks - Risk assessment results
   * @returns {Array} Intelligence-enriched risks
   */
  async enrichWithThreatIntelligence(risks) {
    const enrichedRisks = []
    
    for (const risk of risks) {
      const enrichment = await this.getThreatIntelligence(risk)
      
      enrichedRisks.push({
        ...risk,
        threatIntelligence: enrichment,
        adjustedLikelihood: this.adjustLikelihoodWithIntelligence(risk, enrichment),
        contextualMitigations: this.getContextualMitigations(risk, enrichment)
      })
    }
    
    return enrichedRisks
  }
  
  /**
   * Get threat intelligence for specific risk
   * @param {Object} risk - Risk information
   * @returns {Object} Threat intelligence data
   */
  async getThreatIntelligence(risk) {
    const intelligence = {
      mitre: await this.getMITREMapping(risk),
      cve: await this.getRelevantCVEs(risk),
      campaigns: await this.getActiveCampaigns(risk),
      indicators: await this.getThreatIndicators(risk)
    }
    
    return intelligence
  }
  
  /**
   * Map risk to MITRE ATT&CK framework
   * @param {Object} risk - Risk information
   * @returns {Array} MITRE techniques
   */
  async getMITREMapping(risk) {
    const techniqueMapping = {
      'SQL Injection Attack': ['T1190', 'T1505.003'],
      'Cross-Site Scripting': ['T1189', 'T1055'],
      'Authentication Bypass': ['T1078', 'T1110'],
      'Privilege Escalation': ['T1068', 'T1134']
    }
    
    const techniques = techniqueMapping[risk.threat] || []
    const mitreData = []
    
    for (const techniqueId of techniques) {
      const technique = await this.sources.mitre.getTechnique(techniqueId)
      mitreData.push({
        id: techniqueId,
        name: technique.name,
        tactics: technique.tactics,
        mitigations: technique.mitigations,
        detection: technique.detection
      })
    }
    
    return mitreData
  }
}
```

This comprehensive security documentation provides:

1. **Authentication & Authorization Patterns** - JWT and OAuth 2.0 implementation with security best practices
2. **API Gateway Security** - Multi-layered security with rate limiting, validation, and monitoring
3. **Container Security** - Docker and Kubernetes security with runtime protection
4. **Automated Security Testing** - OWASP ZAP integration and CI/CD security pipelines
5. **Threat Modeling Framework** - STRIDE methodology and attack tree analysis
6. **Risk Assessment Tools** - Quantitative risk analysis and threat intelligence integration

The documentation includes production-ready code examples, security configurations, and comprehensive best practices for building secure applications and infrastructure.