# Security Incident Response Playbook

Comprehensive incident response framework for detecting, analyzing, and responding to security incidents.

## Incident Response Framework

### Incident Classification System

```javascript
/**
 * Security incident classification and response orchestration
 */
class SecurityIncidentResponse {
  constructor(config) {
    this.config = config
    this.alertingService = new AlertingService(config.alerting)
    this.forensicsService = new ForensicsService(config.forensics)
    this.containmentService = new ContainmentService(config.containment)
  }
  
  /**
   * Incident severity classification
   */
  static SEVERITY_LEVELS = {
    CRITICAL: {
      level: 1,
      description: 'Immediate threat to business operations or data',
      responseTime: 15, // minutes
      escalation: ['CISO', 'CEO', 'Legal'],
      examples: ['Active data breach', 'Ransomware attack', 'Complete system compromise']
    },
    HIGH: {
      level: 2,
      description: 'Significant security compromise or threat',
      responseTime: 60, // minutes
      escalation: ['Security Team Lead', 'IT Manager'],
      examples: ['Privilege escalation', 'Malware infection', 'Unauthorized access']
    },
    MEDIUM: {
      level: 3,
      description: 'Moderate security concern requiring investigation',
      responseTime: 240, // minutes
      escalation: ['Security Analyst'],
      examples: ['Suspicious network activity', 'Failed intrusion attempts', 'Policy violations']
    },
    LOW: {
      level: 4,
      description: 'Minor security event for tracking',
      responseTime: 1440, // minutes (24 hours)
      escalation: [],
      examples: ['Security scan alerts', 'Minor configuration issues']
    }
  }
  
  /**
   * Process security incident
   * @param {Object} incident - Incident data
   * @returns {Object} Incident response result
   */
  async processIncident(incident) {
    console.log(`Processing security incident: ${incident.id}`)
    
    try {
      // 1. Initial triage and classification
      const classification = await this.classifyIncident(incident)
      
      // 2. Alert stakeholders based on severity
      await this.alertStakeholders(classification)
      
      // 3. Begin containment if necessary
      if (classification.severity.level <= 2) {
        await this.initiateContainment(incident, classification)
      }
      
      // 4. Start investigation and evidence collection
      const investigation = await this.startInvestigation(incident, classification)
      
      // 5. Generate initial incident report
      const report = await this.generateIncidentReport(incident, classification, investigation)
      
      return {
        incidentId: incident.id,
        classification: classification,
        investigation: investigation,
        report: report,
        status: 'In Progress'
      }
      
    } catch (error) {
      console.error(`Incident processing failed: ${error.message}`)
      throw error
    }
  }
  
  /**
   * Classify incident based on indicators
   * @param {Object} incident - Raw incident data
   * @returns {Object} Incident classification
   */
  async classifyIncident(incident) {
    const classification = {
      id: incident.id,
      timestamp: new Date().toISOString(),
      type: this.determineIncidentType(incident),
      severity: null,
      confidence: 0,
      affectedSystems: [],
      indicators: []
    }
    
    // Analyze incident indicators
    const indicators = await this.analyzeIndicators(incident)
    classification.indicators = indicators
    
    // Determine severity based on indicators and impact
    classification.severity = this.calculateSeverity(incident, indicators)
    
    // Calculate confidence score
    classification.confidence = this.calculateConfidence(indicators)
    
    // Identify affected systems
    classification.affectedSystems = await this.identifyAffectedSystems(incident, indicators)
    
    return classification
  }
  
  /**
   * Determine incident type based on characteristics
   * @param {Object} incident - Incident data
   * @returns {string} Incident type
   */
  determineIncidentType(incident) {
    const typeMapping = {
      malware: /malware|virus|trojan|ransomware|cryptolocker/i,
      dataBreach: /data.breach|exfiltration|unauthorized.access|pii/i,
      ddos: /ddos|denial.of.service|flooding/i,
      phishing: /phishing|spear.phishing|social.engineering/i,
      insider: /insider.threat|employee.misconduct|privilege.abuse/i,
      vulnerability: /vulnerability|cve|exploit|zero.day/i,
      compliance: /compliance|policy.violation|regulatory/i,
      availability: /outage|downtime|service.disruption/i
    }
    
    const description = `${incident.title} ${incident.description}`.toLowerCase()
    
    for (const [type, pattern] of Object.entries(typeMapping)) {
      if (pattern.test(description)) {
        return type
      }
    }
    
    return 'unknown'
  }
  
  /**
   * Calculate incident severity
   * @param {Object} incident - Incident data
   * @param {Array} indicators - Security indicators
   * @returns {Object} Severity classification
   */
  calculateSeverity(incident, indicators) {
    let severityScore = 0
    
    // Base severity from incident type
    const typeScores = {
      malware: 3,
      dataBreach: 4,
      ddos: 2,
      phishing: 2,
      insider: 3,
      vulnerability: 3,
      compliance: 2,
      availability: 2
    }
    
    severityScore += typeScores[incident.type] || 1
    
    // Adjust based on affected systems
    if (incident.affectedSystems?.includes('production')) severityScore += 2
    if (incident.affectedSystems?.includes('database')) severityScore += 2
    if (incident.affectedSystems?.includes('authentication')) severityScore += 2
    
    // Adjust based on data sensitivity
    if (incident.dataClassification === 'restricted') severityScore += 2
    if (incident.dataClassification === 'confidential') severityScore += 1
    
    // Adjust based on indicators
    const criticalIndicators = indicators.filter(i => i.severity === 'critical').length
    const highIndicators = indicators.filter(i => i.severity === 'high').length
    
    severityScore += criticalIndicators * 2
    severityScore += highIndicators * 1
    
    // Map score to severity level
    if (severityScore >= 8) return SecurityIncidentResponse.SEVERITY_LEVELS.CRITICAL
    if (severityScore >= 6) return SecurityIncidentResponse.SEVERITY_LEVELS.HIGH
    if (severityScore >= 3) return SecurityIncidentResponse.SEVERITY_LEVELS.MEDIUM
    return SecurityIncidentResponse.SEVERITY_LEVELS.LOW
  }
  
  /**
   * Initiate containment procedures
   * @param {Object} incident - Incident data
   * @param {Object} classification - Incident classification
   */
  async initiateContainment(incident, classification) {
    console.log(`Initiating containment for ${incident.id}`)
    
    const containmentActions = []
    
    switch (incident.type) {
      case 'malware':
        containmentActions.push(...await this.containMalware(incident))
        break
        
      case 'dataBreach':
        containmentActions.push(...await this.containDataBreach(incident))
        break
        
      case 'ddos':
        containmentActions.push(...await this.containDDoS(incident))
        break
        
      case 'insider':
        containmentActions.push(...await this.containInsiderThreat(incident))
        break
        
      default:
        containmentActions.push(...await this.genericContainment(incident))
    }
    
    // Execute containment actions
    for (const action of containmentActions) {
      try {
        await this.executeContainmentAction(action)
        console.log(`Containment action completed: ${action.type}`)
      } catch (error) {
        console.error(`Containment action failed: ${action.type} - ${error.message}`)
      }
    }
    
    return containmentActions
  }
  
  /**
   * Malware containment procedures
   * @param {Object} incident - Malware incident
   * @returns {Array} Containment actions
   */
  async containMalware(incident) {
    return [
      {
        type: 'ISOLATE_INFECTED_SYSTEMS',
        priority: 1,
        description: 'Isolate infected systems from network',
        systems: incident.affectedSystems,
        action: async () => {
          for (const system of incident.affectedSystems) {
            await this.containmentService.isolateSystem(system)
          }
        }
      },
      {
        type: 'DISABLE_USER_ACCOUNTS',
        priority: 2,
        description: 'Disable potentially compromised user accounts',
        accounts: incident.affectedUsers,
        action: async () => {
          for (const user of incident.affectedUsers || []) {
            await this.containmentService.disableUserAccount(user)
          }
        }
      },
      {
        type: 'BLOCK_MALICIOUS_DOMAINS',
        priority: 3,
        description: 'Block communication with malicious domains',
        domains: incident.indicators?.filter(i => i.type === 'domain'),
        action: async () => {
          const domains = incident.indicators?.filter(i => i.type === 'domain') || []
          for (const domain of domains) {
            await this.containmentService.blockDomain(domain.value)
          }
        }
      },
      {
        type: 'INITIATE_MALWARE_SCAN',
        priority: 4,
        description: 'Run comprehensive malware scan on network',
        action: async () => {
          await this.containmentService.initiateNetworkScan('malware')
        }
      }
    ]
  }
  
  /**
   * Data breach containment procedures
   * @param {Object} incident - Data breach incident
   * @returns {Array} Containment actions
   */
  async containDataBreach(incident) {
    return [
      {
        type: 'REVOKE_ACCESS_TOKENS',
        priority: 1,
        description: 'Revoke all active access tokens',
        action: async () => {
          await this.containmentService.revokeAllTokens()
        }
      },
      {
        type: 'CHANGE_DATABASE_CREDENTIALS',
        priority: 1,
        description: 'Change database connection credentials',
        databases: incident.affectedSystems?.filter(s => s.type === 'database'),
        action: async () => {
          const databases = incident.affectedSystems?.filter(s => s.type === 'database') || []
          for (const db of databases) {
            await this.containmentService.changeDBCredentials(db.id)
          }
        }
      },
      {
        type: 'ENABLE_DATABASE_AUDITING',
        priority: 2,
        description: 'Enable comprehensive database audit logging',
        action: async () => {
          await this.containmentService.enableDBAuditing()
        }
      },
      {
        type: 'RESTRICT_DATA_ACCESS',
        priority: 2,
        description: 'Implement emergency data access restrictions',
        action: async () => {
          await this.containmentService.restrictDataAccess('emergency')
        }
      },
      {
        type: 'NOTIFY_LEGAL_COMPLIANCE',
        priority: 3,
        description: 'Notify legal and compliance teams',
        action: async () => {
          await this.alertingService.notifyLegalTeam(incident)
        }
      }
    ]
  }
  
  /**
   * Start forensic investigation
   * @param {Object} incident - Incident data
   * @param {Object} classification - Incident classification
   * @returns {Object} Investigation details
   */
  async startInvestigation(incident, classification) {
    const investigation = {
      id: `INV-${incident.id}`,
      startTime: new Date().toISOString(),
      status: 'Active',
      evidence: [],
      timeline: [],
      findings: []
    }
    
    // Preserve evidence
    investigation.evidence = await this.preserveEvidence(incident, classification)
    
    // Create investigation timeline
    investigation.timeline = await this.createTimeline(incident, classification)
    
    // Begin analysis
    investigation.analysis = await this.beginForensicAnalysis(incident, classification)
    
    return investigation
  }
  
  /**
   * Preserve digital evidence
   * @param {Object} incident - Incident data
   * @param {Object} classification - Classification data
   * @returns {Array} Evidence collection results
   */
  async preserveEvidence(incident, classification) {
    const evidenceItems = []
    
    // System memory dumps
    for (const system of classification.affectedSystems) {
      if (system.type === 'server' || system.type === 'workstation') {
        const memoryDump = await this.forensicsService.createMemoryDump(system.id)
        evidenceItems.push({
          type: 'memory_dump',
          system: system.id,
          location: memoryDump.location,
          hash: memoryDump.sha256,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    // System snapshots
    for (const system of classification.affectedSystems) {
      const snapshot = await this.forensicsService.createSystemSnapshot(system.id)
      evidenceItems.push({
        type: 'system_snapshot',
        system: system.id,
        location: snapshot.location,
        hash: snapshot.sha256,
        timestamp: new Date().toISOString()
      })
    }
    
    // Log collection
    const logSources = [
      'system_logs',
      'application_logs', 
      'security_logs',
      'network_logs',
      'database_logs'
    ]
    
    for (const source of logSources) {
      const logs = await this.forensicsService.collectLogs(source, {
        timeRange: this.getRelevantTimeRange(incident),
        systems: classification.affectedSystems.map(s => s.id)
      })
      
      evidenceItems.push({
        type: 'log_collection',
        source: source,
        location: logs.location,
        hash: logs.sha256,
        timestamp: new Date().toISOString(),
        records: logs.count
      })
    }
    
    // Network packet capture
    if (incident.type === 'ddos' || incident.type === 'dataBreach') {
      const pcap = await this.forensicsService.captureNetworkTraffic({
        duration: 300, // 5 minutes
        filters: this.getNetworkFilters(incident)
      })
      
      evidenceItems.push({
        type: 'network_capture',
        location: pcap.location,
        hash: pcap.sha256,
        timestamp: new Date().toISOString(),
        packets: pcap.packetCount
      })
    }
    
    return evidenceItems
  }
}

/**
 * Automated incident response orchestration
 */
class AutomatedIncidentResponse {
  constructor(config) {
    this.config = config
    this.playbooks = new Map()
    this.loadPlaybooks()
  }
  
  /**
   * Load incident response playbooks
   */
  loadPlaybooks() {
    // Malware Response Playbook
    this.playbooks.set('malware', {
      name: 'Malware Incident Response',
      phases: [
        {
          name: 'Detection',
          actions: [
            { type: 'ALERT_GENERATION', automated: true },
            { type: 'INITIAL_TRIAGE', automated: true },
            { type: 'IOC_EXTRACTION', automated: true }
          ]
        },
        {
          name: 'Containment',
          actions: [
            { type: 'ISOLATE_SYSTEMS', automated: true, approval: false },
            { type: 'BLOCK_DOMAINS', automated: true, approval: false },
            { type: 'DISABLE_ACCOUNTS', automated: false, approval: true }
          ]
        },
        {
          name: 'Eradication',
          actions: [
            { type: 'MALWARE_REMOVAL', automated: false, approval: true },
            { type: 'VULNERABILITY_PATCHING', automated: false, approval: true },
            { type: 'SYSTEM_REBUILD', automated: false, approval: true }
          ]
        },
        {
          name: 'Recovery',
          actions: [
            { type: 'RESTORE_FROM_BACKUP', automated: false, approval: true },
            { type: 'RECONNECT_SYSTEMS', automated: false, approval: true },
            { type: 'MONITOR_FOR_REINFECTION', automated: true, approval: false }
          ]
        }
      ]
    })
    
    // Data Breach Response Playbook
    this.playbooks.set('dataBreach', {
      name: 'Data Breach Response',
      phases: [
        {
          name: 'Detection',
          actions: [
            { type: 'ANOMALY_DETECTION', automated: true },
            { type: 'ACCESS_ANALYSIS', automated: true },
            { type: 'DATA_CLASSIFICATION', automated: true }
          ]
        },
        {
          name: 'Containment',
          actions: [
            { type: 'REVOKE_TOKENS', automated: true, approval: false },
            { type: 'CHANGE_CREDENTIALS', automated: true, approval: false },
            { type: 'RESTRICT_ACCESS', automated: true, approval: false },
            { type: 'PRESERVE_EVIDENCE', automated: true, approval: false }
          ]
        },
        {
          name: 'Assessment',
          actions: [
            { type: 'DATA_IMPACT_ANALYSIS', automated: false, approval: false },
            { type: 'REGULATORY_ASSESSMENT', automated: false, approval: false },
            { type: 'CUSTOMER_IMPACT_ANALYSIS', automated: false, approval: false }
          ]
        },
        {
          name: 'Notification',
          actions: [
            { type: 'INTERNAL_NOTIFICATION', automated: true, approval: false },
            { type: 'REGULATORY_NOTIFICATION', automated: false, approval: true },
            { type: 'CUSTOMER_NOTIFICATION', automated: false, approval: true }
          ]
        }
      ]
    })
  }
  
  /**
   * Execute incident response playbook
   * @param {string} incidentType - Type of incident
   * @param {Object} context - Incident context
   * @returns {Object} Playbook execution results
   */
  async executePlaybook(incidentType, context) {
    const playbook = this.playbooks.get(incidentType)
    if (!playbook) {
      throw new Error(`No playbook found for incident type: ${incidentType}`)
    }
    
    console.log(`Executing playbook: ${playbook.name}`)
    
    const execution = {
      playbookId: incidentType,
      startTime: new Date().toISOString(),
      phases: [],
      status: 'Running',
      errors: []
    }
    
    for (const phase of playbook.phases) {
      const phaseResult = await this.executePhase(phase, context)
      execution.phases.push(phaseResult)
      
      // Stop execution if phase fails critically
      if (phaseResult.status === 'failed' && phaseResult.critical) {
        execution.status = 'Failed'
        break
      }
    }
    
    execution.endTime = new Date().toISOString()
    execution.duration = new Date(execution.endTime) - new Date(execution.startTime)
    
    if (execution.status !== 'Failed') {
      execution.status = 'Completed'
    }
    
    return execution
  }
  
  /**
   * Execute a phase of the incident response playbook
   * @param {Object} phase - Phase configuration
   * @param {Object} context - Execution context
   * @returns {Object} Phase execution result
   */
  async executePhase(phase, context) {
    console.log(`Executing phase: ${phase.name}`)
    
    const phaseResult = {
      name: phase.name,
      startTime: new Date().toISOString(),
      actions: [],
      status: 'Running',
      errors: []
    }
    
    for (const action of phase.actions) {
      try {
        const actionResult = await this.executeAction(action, context)
        phaseResult.actions.push(actionResult)
        
        if (actionResult.status === 'failed' && actionResult.critical) {
          phaseResult.status = 'failed'
          phaseResult.critical = true
          break
        }
      } catch (error) {
        phaseResult.errors.push({
          action: action.type,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    phaseResult.endTime = new Date().toISOString()
    phaseResult.duration = new Date(phaseResult.endTime) - new Date(phaseResult.startTime)
    
    if (phaseResult.status !== 'failed') {
      phaseResult.status = 'completed'
    }
    
    return phaseResult
  }
  
  /**
   * Execute individual action
   * @param {Object} action - Action configuration
   * @param {Object} context - Execution context
   * @returns {Object} Action result
   */
  async executeAction(action, context) {
    console.log(`Executing action: ${action.type}`)
    
    const actionResult = {
      type: action.type,
      startTime: new Date().toISOString(),
      status: 'running',
      automated: action.automated,
      approval: action.approval
    }
    
    try {
      // Check if action requires approval
      if (action.approval && !action.automated) {
        const approved = await this.requestApproval(action, context)
        if (!approved) {
          actionResult.status = 'skipped'
          actionResult.reason = 'Approval denied'
          return actionResult
        }
      }
      
      // Execute the action
      const result = await this.performAction(action.type, context)
      actionResult.result = result
      actionResult.status = 'completed'
      
    } catch (error) {
      actionResult.status = 'failed'
      actionResult.error = error.message
      actionResult.critical = this.isActionCritical(action.type)
    }
    
    actionResult.endTime = new Date().toISOString()
    actionResult.duration = new Date(actionResult.endTime) - new Date(actionResult.startTime)
    
    return actionResult
  }
}
```

## Incident Communication Templates

```javascript
/**
 * Incident communication and notification service
 */
class IncidentCommunication {
  constructor(config) {
    this.config = config
    this.templates = this.loadCommunicationTemplates()
  }
  
  /**
   * Load communication templates
   */
  loadCommunicationTemplates() {
    return {
      initialAlert: {
        subject: 'SECURITY INCIDENT ALERT - {{ severity }} - {{ title }}',
        body: `
SECURITY INCIDENT NOTIFICATION

Incident ID: {{ incidentId }}
Severity: {{ severity }}
Type: {{ type }}
Detected: {{ timestamp }}
Affected Systems: {{ affectedSystems }}

Initial Assessment:
{{ description }}

Immediate Actions Taken:
{{ immediateActions }}

Investigation Status: {{ investigationStatus }}

Next Update: {{ nextUpdate }}

Incident Commander: {{ commander }}
Contact: {{ commanderContact }}

This is an automated notification. Please do not reply to this email.
        `
      },
      
      statusUpdate: {
        subject: 'INCIDENT UPDATE - {{ incidentId }} - {{ status }}',
        body: `
INCIDENT STATUS UPDATE

Incident ID: {{ incidentId }}
Current Status: {{ status }}
Last Updated: {{ timestamp }}

Progress Summary:
{{ progressSummary }}

Recent Actions:
{{ recentActions }}

Current Findings:
{{ currentFindings }}

Estimated Resolution: {{ estimatedResolution }}

Next Steps:
{{ nextSteps }}

Next Update: {{ nextUpdate }}

Incident Commander: {{ commander }}
Contact: {{ commanderContact }}
        `
      },
      
      resolutionNotice: {
        subject: 'INCIDENT RESOLVED - {{ incidentId }} - {{ title }}',
        body: `
INCIDENT RESOLUTION NOTICE

Incident ID: {{ incidentId }}
Status: RESOLVED
Resolution Time: {{ resolutionTime }}
Duration: {{ duration }}

Final Summary:
{{ finalSummary }}

Root Cause:
{{ rootCause }}

Actions Taken:
{{ actionsTaken }}

Impact Assessment:
{{ impactAssessment }}

Lessons Learned:
{{ lessonsLearned }}

Follow-up Actions:
{{ followupActions }}

Post-Incident Review: {{ postIncidentReview }}

Thank you for your attention during this incident.

Incident Commander: {{ commander }}
        `
      },
      
      customerNotification: {
        subject: 'Important Security Notice - {{ companyName }}',
        body: `
Dear Valued Customer,

We are writing to inform you of a security incident that may have affected your account information.

What Happened:
{{ whatHappened }}

What Information Was Involved:
{{ informationInvolved }}

What We Are Doing:
{{ ourResponse }}

What You Can Do:
{{ customerActions }}

For More Information:
{{ contactInfo }}

We sincerely apologize for any inconvenience this may cause and want to assure you that we are taking this matter very seriously.

Sincerely,
{{ companyName }} Security Team
        `
      },
      
      regulatoryNotification: {
        subject: 'Data Breach Notification - {{ incidentId }}',
        body: `
REGULATORY NOTIFICATION - DATA BREACH

Organization: {{ organizationName }}
Incident ID: {{ incidentId }}
Date of Discovery: {{ discoveryDate }}
Date of Incident: {{ incidentDate }}

Nature of Breach:
{{ breachNature }}

Categories of Personal Data:
{{ dataCategories }}

Number of Individuals Affected:
{{ affectedCount }}

Circumstances of Breach:
{{ circumstances }}

Measures Taken:
{{ measuresTaken }}

Assessment of Risk:
{{ riskAssessment }}

Remediation Plan:
{{ remediationPlan }}

Contact Information:
{{ contactInfo }}

This notification is submitted in compliance with applicable data protection regulations.
        `
      }
    }
  }
  
  /**
   * Send incident notification
   * @param {string} templateType - Template to use
   * @param {Object} incident - Incident data
   * @param {Array} recipients - Recipients list
   */
  async sendNotification(templateType, incident, recipients) {
    const template = this.templates[templateType]
    if (!template) {
      throw new Error(`Template not found: ${templateType}`)
    }
    
    const message = this.renderTemplate(template, incident)
    
    const notification = {
      id: `NOTIFY-${incident.id}-${Date.now()}`,
      incidentId: incident.id,
      templateType: templateType,
      recipients: recipients,
      subject: message.subject,
      body: message.body,
      sentAt: new Date().toISOString(),
      delivery: []
    }
    
    // Send to each recipient
    for (const recipient of recipients) {
      try {
        await this.sendMessage(recipient, message)
        notification.delivery.push({
          recipient: recipient,
          status: 'delivered',
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        notification.delivery.push({
          recipient: recipient,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    return notification
  }
  
  /**
   * Render template with incident data
   * @param {Object} template - Message template
   * @param {Object} incident - Incident data
   * @returns {Object} Rendered message
   */
  renderTemplate(template, incident) {
    const context = {
      incidentId: incident.id,
      severity: incident.classification?.severity?.description || 'Unknown',
      title: incident.title,
      type: incident.type,
      timestamp: new Date(incident.timestamp).toLocaleString(),
      description: incident.description,
      affectedSystems: incident.affectedSystems?.map(s => s.name).join(', ') || 'Unknown',
      commander: incident.commander?.name || 'Security Team',
      commanderContact: incident.commander?.contact || this.config.defaultContact,
      companyName: this.config.companyName,
      organizationName: this.config.organizationName,
      ...incident.templateData // Additional template-specific data
    }
    
    return {
      subject: this.interpolateTemplate(template.subject, context),
      body: this.interpolateTemplate(template.body, context)
    }
  }
  
  /**
   * Interpolate template variables
   * @param {string} template - Template string
   * @param {Object} context - Template context
   * @returns {string} Interpolated string
   */
  interpolateTemplate(template, context) {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
      return context[key] || match
    })
  }
}
```

This comprehensive incident response documentation provides:

1. **Incident Classification System** - Structured severity levels and automated triage
2. **Automated Response Orchestration** - Playbook-driven incident response with containment procedures
3. **Forensics Integration** - Evidence preservation and investigation procedures
4. **Communication Framework** - Templated notifications for stakeholders, customers, and regulators
5. **Threat Intelligence Integration** - Context-aware risk assessment and mitigation
6. **Compliance Support** - Regulatory notification templates and procedures

The framework enables organizations to respond to security incidents systematically, ensuring proper containment, investigation, and communication while maintaining compliance with relevant regulations.