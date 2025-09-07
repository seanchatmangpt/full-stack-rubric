# Automated Security Testing Patterns

Comprehensive automated security testing strategies integrated into CI/CD pipelines.

## Security Testing Framework

### OWASP ZAP Integration

```javascript
/**
 * OWASP ZAP automated security testing integration
 * Comprehensive web application security scanner
 */
class ZAPSecurityTester {
  constructor(config) {
    this.zapClient = new ZapClient({
      proxy: config.proxy || 'http://localhost:8080'
    })
    this.targetUrl = config.targetUrl
    this.config = config
  }
  
  /**
   * Run complete OWASP ZAP security scan
   * @returns {Object} Security test results
   */
  async runFullSecurityScan() {
    console.log(`Starting OWASP ZAP security scan for ${this.targetUrl}`)
    
    try {
      // Start ZAP session
      await this.zapClient.core.newSession('security-scan')
      
      // Configure ZAP settings
      await this.configureZAP()
      
      // Spider the application
      await this.spiderScan()
      
      // Passive vulnerability scanning
      await this.passiveScan()
      
      // Active vulnerability scanning
      await this.activeScan()
      
      // Generate security report
      const report = await this.generateReport()
      
      // Evaluate security gate
      const gateResult = this.evaluateSecurityGate(report)
      
      return {
        success: gateResult.passed,
        report,
        gate: gateResult
      }
      
    } catch (error) {
      console.error('ZAP security scan failed:', error)
      throw error
    }
  }
  
  /**
   * Configure ZAP scanner settings
   */
  async configureZAP() {
    // Set global exclusions
    const exclusions = this.config.exclusions || [
      '.*logout.*',
      '.*\\.css.*',
      '.*\\.js.*',
      '.*\\.png.*',
      '.*\\.jpg.*'
    ]
    
    for (const exclusion of exclusions) {
      await this.zapClient.core.excludeFromProxy(exclusion)
    }
    
    // Configure authentication if needed
    if (this.config.authentication) {
      await this.configureAuthentication()
    }
    
    // Set scan policy
    if (this.config.scanPolicy) {
      await this.zapClient.ascan.setScannerAttackStrength(
        this.config.scanPolicy.attackStrength || 'MEDIUM'
      )
      await this.zapClient.ascan.setScannerAlertThreshold(
        this.config.scanPolicy.alertThreshold || 'MEDIUM'
      )
    }
  }
  
  /**
   * Configure authentication for authenticated scans
   */
  async configureAuthentication() {
    const auth = this.config.authentication
    
    switch (auth.type) {
      case 'form':
        await this.configureFormAuthentication(auth)
        break
      case 'header':
        await this.configureHeaderAuthentication(auth)
        break
      case 'script':
        await this.configureScriptAuthentication(auth)
        break
    }
  }
  
  /**
   * Spider scan to discover application endpoints
   */
  async spiderScan() {
    console.log('Starting spider scan...')
    
    const spiderScanId = await this.zapClient.spider.scan(this.targetUrl)
    
    // Wait for spider to complete
    let spiderProgress = '0'
    while (parseInt(spiderProgress) < 100) {
      await this.sleep(5000)
      spiderProgress = await this.zapClient.spider.status(spiderScanId)
      console.log(`Spider progress: ${spiderProgress}%`)
    }
    
    const spiderResults = await this.zapClient.spider.results(spiderScanId)
    console.log(`Spider found ${spiderResults.length} URLs`)
    
    return spiderResults
  }
  
  /**
   * Run passive security scan
   */
  async passiveScan() {
    console.log('Running passive security scan...')
    
    // Enable all passive scan rules
    await this.zapClient.pscan.enableAllScanners()
    
    // Wait for passive scan to complete
    let recordsToScan = '1'
    while (parseInt(recordsToScan) > 0) {
      await this.sleep(2000)
      recordsToScan = await this.zapClient.pscan.recordsToScan()
    }
    
    console.log('Passive scan completed')
  }
  
  /**
   * Run active security scan
   */
  async activeScan() {
    console.log('Starting active security scan...')
    
    const activeScanId = await this.zapClient.ascan.scan(this.targetUrl)
    
    // Wait for active scan to complete
    let scanProgress = '0'
    while (parseInt(scanProgress) < 100) {
      await this.sleep(10000)
      scanProgress = await this.zapClient.ascan.status(activeScanId)
      console.log(`Active scan progress: ${scanProgress}%`)
    }
    
    console.log('Active scan completed')
    return activeScanId
  }
  
  /**
   * Generate comprehensive security report
   * @returns {Object} Security scan report
   */
  async generateReport() {
    const alerts = await this.zapClient.core.alerts()
    
    const report = {
      scanDate: new Date().toISOString(),
      targetUrl: this.targetUrl,
      totalAlerts: alerts.length,
      summary: {
        high: 0,
        medium: 0,
        low: 0,
        informational: 0
      },
      vulnerabilities: []
    }
    
    // Process alerts
    alerts.forEach(alert => {
      const severity = alert.risk.toLowerCase()
      report.summary[severity] = (report.summary[severity] || 0) + 1
      
      report.vulnerabilities.push({
        name: alert.alert,
        severity: severity,
        confidence: alert.confidence,
        description: alert.description,
        solution: alert.solution,
        reference: alert.reference,
        instances: alert.instances?.map(instance => ({
          uri: instance.uri,
          method: instance.method,
          param: instance.param,
          evidence: instance.evidence
        })) || []
      })
    })
    
    return report
  }
  
  /**
   * Evaluate security gate criteria
   * @param {Object} report - Security scan report
   * @returns {Object} Gate evaluation result
   */
  evaluateSecurityGate(report) {
    const gate = this.config.securityGate || {
      maxHigh: 0,
      maxMedium: 5,
      maxLow: 20
    }
    
    const violations = []
    
    if (report.summary.high > gate.maxHigh) {
      violations.push(`High risk vulnerabilities: ${report.summary.high} (max: ${gate.maxHigh})`)
    }
    
    if (report.summary.medium > gate.maxMedium) {
      violations.push(`Medium risk vulnerabilities: ${report.summary.medium} (max: ${gate.maxMedium})`)
    }
    
    if (report.summary.low > gate.maxLow) {
      violations.push(`Low risk vulnerabilities: ${report.summary.low} (max: ${gate.maxLow})`)
    }
    
    return {
      passed: violations.length === 0,
      violations,
      summary: report.summary
    }
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### Security Unit Testing Framework

```javascript
/**
 * Security-focused unit testing framework
 * Tests for common security vulnerabilities
 */
class SecurityUnitTester {
  constructor(app) {
    this.app = app
    this.testResults = []
  }
  
  /**
   * Run all security unit tests
   * @returns {Object} Test results
   */
  async runAllTests() {
    console.log('Running security unit tests...')
    
    const testSuites = [
      () => this.testSQLInjection(),
      () => this.testXSS(),
      () => this.testCSRF(),
      () => this.testAuthenticationBypass(),
      () => this.testAuthorizationFlaws(),
      () => this.testInputValidation(),
      () => this.testSessionManagement(),
      () => this.testCryptography(),
      () => this.testErrorHandling(),
      () => this.testSecurityHeaders()
    ]
    
    for (const testSuite of testSuites) {
      try {
        await testSuite()
      } catch (error) {
        this.testResults.push({
          suite: testSuite.name,
          status: 'failed',
          error: error.message
        })
      }
    }
    
    return this.generateTestReport()
  }
  
  /**
   * Test for SQL injection vulnerabilities
   */
  async testSQLInjection() {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users (username, password) VALUES ('hacker', 'password'); --",
      "' AND 1=1 --",
      "' OR 1=1 LIMIT 1 --"
    ]
    
    console.log('Testing SQL injection resistance...')
    
    for (const payload of sqlInjectionPayloads) {
      // Test login endpoint
      const loginResponse = await this.makeRequest('POST', '/api/login', {
        username: payload,
        password: 'test'
      })
      
      this.assertSecureResponse(loginResponse, 'SQL injection in login', {
        shouldNotContain: ['mysql', 'postgresql', 'sqlite', 'syntax error', 'database'],
        shouldNotExpose: ['stack trace', 'internal error']
      })
      
      // Test search endpoint
      const searchResponse = await this.makeRequest('GET', `/api/search?q=${encodeURIComponent(payload)}`)
      
      this.assertSecureResponse(searchResponse, 'SQL injection in search', {
        shouldNotContain: ['mysql', 'postgresql', 'sqlite', 'syntax error'],
        maxResponseTime: 5000 // Detect time-based SQL injection
      })
    }
    
    this.testResults.push({
      suite: 'SQL Injection',
      status: 'passed',
      testsRun: sqlInjectionPayloads.length * 2
    })
  }
  
  /**
   * Test for XSS vulnerabilities
   */
  async testXSS() {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "javascript:alert('XSS')",
      '<img src="x" onerror="alert(\'XSS\')">',
      '<svg/onload=alert("XSS")>',
      '{{constructor.constructor("alert(\\"XSS\\")")()}}',
      '<iframe src="javascript:alert(\\'XSS\\')"></iframe>'
    ]
    
    console.log('Testing XSS protection...')
    
    for (const payload of xssPayloads) {
      // Test reflected XSS in search
      const searchResponse = await this.makeRequest('GET', `/api/search?q=${encodeURIComponent(payload)}`)
      
      this.assertXSSProtection(searchResponse, payload)
      
      // Test stored XSS in comments
      const commentResponse = await this.makeRequest('POST', '/api/comments', {
        content: payload,
        postId: 1
      })
      
      this.assertXSSProtection(commentResponse, payload)
    }
    
    this.testResults.push({
      suite: 'XSS Protection',
      status: 'passed',
      testsRun: xssPayloads.length * 2
    })
  }
  
  /**
   * Test CSRF protection
   */
  async testCSRF() {
    console.log('Testing CSRF protection...')
    
    // Attempt state-changing operations without CSRF token
    const criticalEndpoints = [
      { method: 'POST', path: '/api/users', data: { username: 'attacker' } },
      { method: 'PUT', path: '/api/users/1', data: { role: 'admin' } },
      { method: 'DELETE', path: '/api/users/1' },
      { method: 'POST', path: '/api/transfer', data: { amount: 1000, to: 'attacker' } }
    ]
    
    for (const endpoint of criticalEndpoints) {
      const response = await this.makeRequest(endpoint.method, endpoint.path, endpoint.data, {
        omitCSRFToken: true
      })
      
      // Should be rejected without CSRF token
      if (response.status !== 403 && response.status !== 401) {
        throw new Error(`CSRF vulnerability found in ${endpoint.method} ${endpoint.path}`)
      }
    }
    
    this.testResults.push({
      suite: 'CSRF Protection',
      status: 'passed',
      testsRun: criticalEndpoints.length
    })
  }
  
  /**
   * Test authentication bypass attempts
   */
  async testAuthenticationBypass() {
    console.log('Testing authentication bypass resistance...')
    
    const bypassAttempts = [
      // Header manipulation
      { headers: { 'X-User-Id': '1', 'X-Role': 'admin' } },
      { headers: { 'Authorization': 'Bearer fake-token' } },
      { headers: { 'X-Forwarded-User': 'admin' } },
      
      // Parameter pollution
      { query: { userId: ['1', '2'] } },
      { body: { userId: 1, role: 'admin' } },
      
      // JWT manipulation
      { headers: { 'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0.eyJ1c2VyIjoiYWRtaW4ifQ.' } }
    ]
    
    for (const attempt of bypassAttempts) {
      const response = await this.makeRequest('GET', '/api/admin/users', null, attempt)
      
      if (response.status === 200) {
        throw new Error('Authentication bypass detected')
      }
    }
    
    this.testResults.push({
      suite: 'Authentication Bypass',
      status: 'passed',
      testsRun: bypassAttempts.length
    })
  }
  
  /**
   * Test input validation
   */
  async testInputValidation() {
    console.log('Testing input validation...')
    
    const invalidInputs = [
      // Oversized inputs
      { field: 'username', value: 'a'.repeat(10000) },
      { field: 'email', value: 'a'.repeat(500) + '@test.com' },
      
      // Invalid formats
      { field: 'email', value: 'not-an-email' },
      { field: 'phone', value: 'not-a-phone' },
      { field: 'url', value: 'not-a-url' },
      
      // Null bytes and control characters
      { field: 'username', value: 'user\x00admin' },
      { field: 'content', value: 'test\x1b[31mred text\x1b[0m' },
      
      // Path traversal
      { field: 'filename', value: '../../../etc/passwd' },
      { field: 'path', value: '..\\..\\windows\\system32\\config\\sam' }
    ]
    
    for (const input of invalidInputs) {
      const response = await this.makeRequest('POST', '/api/validate', {
        [input.field]: input.value
      })
      
      if (response.status === 200 && !response.body.errors) {
        throw new Error(`Input validation missing for ${input.field}`)
      }
    }
    
    this.testResults.push({
      suite: 'Input Validation',
      status: 'passed',
      testsRun: invalidInputs.length
    })
  }
  
  /**
   * Test security headers presence
   */
  async testSecurityHeaders() {
    console.log('Testing security headers...')
    
    const response = await this.makeRequest('GET', '/')
    
    const requiredHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy',
      'Referrer-Policy'
    ]
    
    const missingHeaders = []
    
    for (const header of requiredHeaders) {
      if (!response.headers[header.toLowerCase()]) {
        missingHeaders.push(header)
      }
    }
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing security headers: ${missingHeaders.join(', ')}`)
    }
    
    this.testResults.push({
      suite: 'Security Headers',
      status: 'passed',
      testsRun: requiredHeaders.length
    })
  }
  
  /**
   * Assert that response is secure against XSS
   * @param {Object} response - HTTP response
   * @param {string} payload - XSS payload
   */
  assertXSSProtection(response, payload) {
    const body = response.body || ''
    
    // Check if payload is reflected unencoded
    if (body.includes(payload)) {
      throw new Error(`XSS vulnerability: payload reflected unencoded`)
    }
    
    // Check for common XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i
    ]
    
    for (const pattern of xssPatterns) {
      if (pattern.test(body)) {
        throw new Error(`XSS vulnerability: dangerous pattern found in response`)
      }
    }
    
    // Check Content-Type header
    const contentType = response.headers['content-type']
    if (contentType && !contentType.includes('charset=utf-8')) {
      console.warn('Response missing UTF-8 charset declaration')
    }
  }
  
  /**
   * Make HTTP request for testing
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Object} Response object
   */
  async makeRequest(method, path, data = null, options = {}) {
    const config = {
      method,
      url: path,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }
    
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.data = data
    }
    
    if (data && method === 'GET') {
      config.params = data
    }
    
    if (!options.omitCSRFToken) {
      config.headers['X-CSRF-Token'] = 'test-csrf-token'
    }
    
    try {
      const response = await axios(config)
      return {
        status: response.status,
        headers: response.headers,
        body: response.data
      }
    } catch (error) {
      return {
        status: error.response?.status || 500,
        headers: error.response?.headers || {},
        body: error.response?.data || error.message
      }
    }
  }
  
  /**
   * Generate comprehensive test report
   * @returns {Object} Test report
   */
  generateTestReport() {
    const passed = this.testResults.filter(r => r.status === 'passed').length
    const failed = this.testResults.filter(r => r.status === 'failed').length
    const total = this.testResults.length
    
    return {
      summary: {
        total,
        passed,
        failed,
        passRate: total > 0 ? (passed / total * 100).toFixed(2) + '%' : '0%'
      },
      results: this.testResults,
      timestamp: new Date().toISOString()
    }
  }
}
```

## CI/CD Security Pipeline Integration

### GitHub Actions Security Workflow

```yaml
name: Security Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1' # Weekly security scan

jobs:
  security-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
      actions: read
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    # Static Code Analysis
    - name: Run CodeQL Analysis
      uses: github/codeql-action/init@v3
      with:
        languages: javascript
        queries: security-and-quality
    
    - name: Autobuild
      uses: github/codeql-action/autobuild@v3
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
    
    # Dependency Security Scanning
    - name: Run Snyk to check for vulnerabilities
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high --sarif-file-output=snyk.sarif
    
    - name: Upload Snyk results to GitHub
      uses: github/codeql-action/upload-sarif@v3
      if: always()
      with:
        sarif_file: snyk.sarif
    
    # Container Security Scanning
    - name: Build Docker image
      run: |
        docker build -t security-test:${{ github.sha }} .
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: 'security-test:${{ github.sha }}'
        format: 'sarif'
        output: 'trivy-results.sarif'
        severity: 'CRITICAL,HIGH'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v3
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'
    
    # Infrastructure as Code Security
    - name: Run Checkov
      uses: bridgecrewio/checkov-action@master
      with:
        directory: .
        framework: dockerfile,kubernetes
        output_format: sarif
        output_file_path: checkov.sarif
    
    - name: Upload Checkov results
      uses: github/codeql-action/upload-sarif@v3
      if: always()
      with:
        sarif_file: checkov.sarif
    
    # Secrets Scanning
    - name: Run TruffleHog
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
        extra_args: --debug --only-verified
    
    # SAST with Semgrep
    - name: Run Semgrep
      uses: returntocorp/semgrep-action@v1
      with:
        config: >-
          p/security-audit
          p/secrets
          p/owasp-top-ten
          p/cwe-top-25
      env:
        SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
    
    # Dynamic Security Testing
    - name: Start application
      run: |
        npm install
        npm run build
        npm start &
        sleep 30
    
    - name: Run OWASP ZAP Scan
      uses: zaproxy/action-full-scan@v0.8.0
      with:
        target: 'http://localhost:3000'
        rules_file_name: '.zap/rules.tsv'
        cmd_options: '-a -j'
        allow_issue_writing: false
        artifact_name: 'zap-report'
    
    # Security Unit Tests
    - name: Run Security Unit Tests
      run: |
        npm test -- --testPathPattern=security
      env:
        NODE_ENV: test
    
    # Generate Security Report
    - name: Generate Security Report
      run: |
        node scripts/generate-security-report.js
    
    - name: Upload Security Report
      uses: actions/upload-artifact@v4
      with:
        name: security-report
        path: security-report.json
    
    # Security Gate Evaluation
    - name: Security Gate
      run: |
        node scripts/security-gate.js
      env:
        MAX_HIGH_VULNERABILITIES: 0
        MAX_MEDIUM_VULNERABILITIES: 5
        FAIL_ON_SECRETS: true
```

## Automated Security Testing Best Practices

### 1. Shift Left Security
- Integrate security testing early in development
- Use pre-commit hooks for basic security checks
- IDE plugins for real-time security feedback
- Security training for developers

### 2. Comprehensive Coverage
- Static Application Security Testing (SAST)
- Dynamic Application Security Testing (DAST)
- Interactive Application Security Testing (IAST)
- Software Composition Analysis (SCA)

### 3. Continuous Monitoring
- Runtime Application Self-Protection (RASP)
- Security monitoring in production
- Threat intelligence integration
- Behavioral analysis and anomaly detection

### 4. Security Gates
- Define clear security criteria for deployments
- Automated vulnerability assessment
- Risk-based decision making
- Exception handling and approval workflows

### 5. Tool Integration
- CI/CD pipeline integration
- SARIF format for standardized reporting
- Security information aggregation
- Automated remediation suggestions

### 6. Reporting and Metrics
- Executive security dashboards
- Developer-friendly security reports
- Trend analysis and KPIs
- Compliance reporting automation