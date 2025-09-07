# Container Security Patterns

Comprehensive security patterns for containerized applications using Docker and Kubernetes.

## Secure Container Images

### Multi-stage Dockerfile Security

```dockerfile
# Multi-stage build with security best practices
FROM node:18-alpine AS builder

# Create non-root user for build stage
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./
COPY --chown=nextjs:nodejs package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY --chown=nextjs:nodejs . .

# Build application
RUN npm run build

# Production stage with minimal base image
FROM node:18-alpine AS production

# Install security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy only production files from builder
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Remove unnecessary packages and files
RUN apk del curl wget && \
    rm -rf /tmp/* /var/tmp/*

# Set proper file permissions
RUN chmod -R 755 /app && \
    find /app -type f -exec chmod 644 {} \;

# Switch to non-root user
USER nextjs

# Expose port (non-privileged port)
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start application
CMD ["node", "dist/server.js"]
```

### Container Security Scanning

```javascript
/**
 * Container vulnerability scanning configuration
 * Integrate with CI/CD pipeline for automated security checks
 */
const containerSecurityConfig = {
  // Trivy security scanner configuration
  trivy: {
    scanners: ['vuln', 'secret', 'config'],
    severity: ['HIGH', 'CRITICAL'],
    ignoreUnfixed: false,
    format: 'sarif',
    output: 'trivy-results.sarif'
  },
  
  // Snyk container scanning
  snyk: {
    severity: 'high',
    monitor: true,
    dockerfilePath: './Dockerfile',
    exclude: ['npm-shrinkwrap.json']
  },
  
  // Clair static analysis
  clair: {
    config: {
      clair: {
        database: {
          type: 'pgsql',
          options: {
            source: process.env.CLAIR_DB_CONNECTION
          }
        },
        api: {
          healthPort: 6061,
          port: 6060,
          timeout: '900s'
        },
        updaters: {
          sets: ['alpine', 'debian', 'ubuntu', 'rhel'],
          config: {
            debian: {
              url: 'https://salsa.debian.org/security-tracker-team/security-tracker/raw/master/data/json'
            }
          }
        }
      }
    }
  }
}

/**
 * Automated container security pipeline
 */
async function runContainerSecurityScan(imageName, tag) {
  const fullImageName = `${imageName}:${tag}`
  
  console.log(`Starting security scan for ${fullImageName}`)
  
  // Run Trivy scan
  const trivyResults = await runTrivyScan(fullImageName)
  
  // Run Snyk scan
  const snykResults = await runSnykScan(fullImageName)
  
  // Analyze results
  const securityReport = analyzeSecurityResults(trivyResults, snykResults)
  
  // Check if scan passes security gate
  if (!passesSecurityGate(securityReport)) {
    throw new Error('Container security scan failed - blocking deployment')
  }
  
  return securityReport
}

/**
 * Security gate evaluation
 * @param {Object} report - Security scan report
 * @returns {boolean} Whether image passes security gate
 */
function passesSecurityGate(report) {
  const { vulnerabilities, secrets, misconfigurations } = report
  
  // Block if critical vulnerabilities found
  if (vulnerabilities.critical > 0) {
    console.error(`Critical vulnerabilities found: ${vulnerabilities.critical}`)
    return false
  }
  
  // Block if secrets detected
  if (secrets.total > 0) {
    console.error(`Secrets detected: ${secrets.total}`)
    return false
  }
  
  // Block if critical misconfigurations found
  if (misconfigurations.critical > 0) {
    console.error(`Critical misconfigurations found: ${misconfigurations.critical}`)
    return false
  }
  
  // Warn about high vulnerabilities but don't block
  if (vulnerabilities.high > 5) {
    console.warn(`High vulnerabilities found: ${vulnerabilities.high}`)
  }
  
  return true
}
```

## Kubernetes Security Manifests

### Secure Pod Security Standards

```yaml
# Pod Security Policy with strict security controls
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted-psp
  annotations:
    seccomp.security.alpha.kubernetes.io/allowedProfileNames: 'runtime/default'
    seccomp.security.alpha.kubernetes.io/defaultProfileName: 'runtime/default'
    apparmor.security.beta.kubernetes.io/allowedProfileNames: 'runtime/default'
    apparmor.security.beta.kubernetes.io/defaultProfileName: 'runtime/default'
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  hostNetwork: false
  hostIPC: false
  hostPID: false
  runAsUser:
    rule: 'MustRunAsNonRoot'
  supplementalGroups:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  fsGroup:
    rule: 'MustRunAs'
    ranges:
      - min: 1
        max: 65535
  readOnlyRootFilesystem: false
  seLinux:
    rule: RunAsAny

---
# NetworkPolicy for micro-segmentation
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: web-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: production
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: production
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
  - to: []
    ports:
    - protocol: TCP
      port: 443  # HTTPS outbound
    - protocol: UDP
      port: 53   # DNS

---
# Secure Deployment with security context
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secure-web-app
  namespace: production
  labels:
    app: web-app
    version: "1.0.0"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
        version: "1.0.0"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
        seccompProfile:
          type: RuntimeDefault
      serviceAccountName: web-app-service-account
      automountServiceAccountToken: false
      containers:
      - name: web-app
        image: myregistry/web-app:1.0.0
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1001
          runAsGroup: 1001
          capabilities:
            drop:
            - ALL
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        volumeMounts:
        - name: tmp-volume
          mountPath: /tmp
        - name: cache-volume
          mountPath: /app/cache
        - name: config-volume
          mountPath: /app/config
          readOnly: true
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        startupProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 30
      volumes:
      - name: tmp-volume
        emptyDir: {}
      - name: cache-volume
        emptyDir: {}
      - name: config-volume
        configMap:
          name: app-config
      nodeSelector:
        node-type: application
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - web-app
              topologyKey: kubernetes.io/hostname
      tolerations:
      - key: "node-type"
        operator: "Equal"
        value: "application"
        effect: "NoSchedule"

---
# Service Account with minimal permissions
apiVersion: v1
kind: ServiceAccount
metadata:
  name: web-app-service-account
  namespace: production
automountServiceAccountToken: false

---
# Role with minimal required permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: web-app-role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: web-app-rolebinding
  namespace: production
subjects:
- kind: ServiceAccount
  name: web-app-service-account
  namespace: production
roleRef:
  kind: Role
  name: web-app-role
  apiGroup: rbac.authorization.k8s.io
```

### Secrets Management

```yaml
# External Secrets Operator configuration
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-secret-store
  namespace: production
spec:
  provider:
    vault:
      server: "https://vault.company.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "web-app-role"
          serviceAccountRef:
            name: "web-app-service-account"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: database-external-secret
  namespace: production
spec:
  refreshInterval: 15m
  secretStoreRef:
    name: vault-secret-store
    kind: SecretStore
  target:
    name: database-secret
    creationPolicy: Owner
  data:
  - secretKey: url
    remoteRef:
      key: production/database
      property: connection_url
  - secretKey: username
    remoteRef:
      key: production/database
      property: username
  - secretKey: password
    remoteRef:
      key: production/database
      property: password

---
# Sealed Secrets for GitOps
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: sealed-database-secret
  namespace: production
spec:
  encryptedData:
    url: AgBy3i4OJSWK+PiTySYZZA9rO43cGDEQAx...
    username: Afby3i4OJSWK+PiTySYZZA9rO43cGDEQAx...
    password: Bgby3i4OJSWK+PiTySYZZA9rO43cGDEQAx...
  template:
    metadata:
      name: database-secret
      namespace: production
    type: Opaque
```

## Container Runtime Security

### Falco Security Rules

```yaml
# Custom Falco rules for container runtime security
customRules:
  rules-custom.yaml: |-
    # Detect privilege escalation attempts
    - rule: Privilege Escalation Attempt
      desc: Detect attempts to escalate privileges in containers
      condition: >
        spawned_process and container and
        (proc.name in (sudo, su, doas) or
         proc.cmdline contains "sudo " or
         proc.cmdline contains "su -")
      output: >
        Privilege escalation attempt detected (user=%user.name command=%proc.cmdline
        container=%container.name image=%container.image.repository:%container.image.tag)
      priority: WARNING
      tags: [container, privilege_escalation]
    
    # Detect sensitive file access
    - rule: Sensitive File Access
      desc: Detect access to sensitive files in containers
      condition: >
        open_read and container and
        (fd.name startswith /etc/shadow or
         fd.name startswith /etc/passwd or
         fd.name startswith /root/.ssh/ or
         fd.name startswith /etc/ssl/private/)
      output: >
        Sensitive file accessed (user=%user.name file=%fd.name
        container=%container.name image=%container.image.repository:%container.image.tag)
      priority: WARNING
      tags: [container, sensitive_files]
    
    # Detect cryptocurrency mining
    - rule: Cryptocurrency Mining
      desc: Detect cryptocurrency mining activity
      condition: >
        spawned_process and container and
        (proc.name in (xmrig, ccminer, cgminer, bfgminer) or
         proc.cmdline contains "stratum+tcp" or
         proc.cmdline contains "mining.pool")
      output: >
        Cryptocurrency mining detected (user=%user.name command=%proc.cmdline
        container=%container.name image=%container.image.repository:%container.image.tag)
      priority: CRITICAL
      tags: [container, cryptomining]
    
    # Detect reverse shell attempts
    - rule: Reverse Shell Attempt
      desc: Detect reverse shell connection attempts
      condition: >
        spawned_process and container and
        ((proc.name in (bash, sh, zsh) and proc.args contains "-i") or
         (proc.name = nc and (proc.args contains "-e" or proc.args contains "-c")) or
         proc.cmdline contains "/dev/tcp")
      output: >
        Reverse shell attempt detected (user=%user.name command=%proc.cmdline
        container=%container.name image=%container.image.repository:%container.image.tag)
      priority: CRITICAL
      tags: [container, reverse_shell]
    
    # Detect container escape attempts
    - rule: Container Escape Attempt
      desc: Detect attempts to escape from container
      condition: >
        spawned_process and container and
        (proc.cmdline contains "docker.sock" or
         proc.cmdline contains "runc" or
         proc.cmdline contains "cgroup" or
         proc.name = nsenter)
      output: >
        Container escape attempt detected (user=%user.name command=%proc.cmdline
        container=%container.name image=%container.image.repository:%container.image.tag)
      priority: CRITICAL
      tags: [container, escape_attempt]
```

### Container Security Monitoring

```javascript
/**
 * Container security monitoring service
 * Integrates with multiple security tools for comprehensive monitoring
 */
class ContainerSecurityMonitor {
  constructor(config) {
    this.config = config
    this.falcoClient = new FalcoClient(config.falco)
    this.aquaClient = new AquaSecurityClient(config.aqua)
    this.twistlockClient = new TwistlockClient(config.twistlock)
  }
  
  /**
   * Monitor container runtime security events
   */
  async startMonitoring() {
    // Start Falco event stream
    this.falcoClient.streamEvents((event) => {
      this.handleSecurityEvent('falco', event)
    })
    
    // Monitor container vulnerabilities
    setInterval(async () => {
      await this.scanRunningContainers()
    }, this.config.scanInterval || 300000) // 5 minutes
    
    // Monitor compliance violations
    setInterval(async () => {
      await this.checkComplianceViolations()
    }, this.config.complianceInterval || 900000) // 15 minutes
  }
  
  /**
   * Handle security events from various sources
   * @param {string} source - Event source (falco, aqua, twistlock)
   * @param {Object} event - Security event
   */
  async handleSecurityEvent(source, event) {
    const securityEvent = this.normalizeSecurityEvent(source, event)
    
    // Log security event
    console.log(`Security event from ${source}:`, securityEvent)
    
    // Store in security incident database
    await this.storeSecurityEvent(securityEvent)
    
    // Check if event requires immediate action
    if (this.isCriticalEvent(securityEvent)) {
      await this.handleCriticalEvent(securityEvent)
    }
    
    // Send alerts based on severity
    if (securityEvent.severity >= this.config.alertThreshold) {
      await this.sendSecurityAlert(securityEvent)
    }
  }
  
  /**
   * Scan running containers for vulnerabilities
   */
  async scanRunningContainers() {
    try {
      const containers = await this.getRunningContainers()
      
      for (const container of containers) {
        const scanResult = await this.scanContainer(container)
        
        if (this.hasHighRiskVulnerabilities(scanResult)) {
          await this.handleVulnerableContainer(container, scanResult)
        }
      }
    } catch (error) {
      console.error('Error scanning containers:', error)
    }
  }
  
  /**
   * Check for compliance violations
   */
  async checkComplianceViolations() {
    const violations = []
    
    // Check Pod Security Standards compliance
    const pssViolations = await this.checkPSSCompliance()
    violations.push(...pssViolations)
    
    // Check CIS Kubernetes Benchmark compliance
    const cisViolations = await this.checkCISCompliance()
    violations.push(...cisViolations)
    
    // Check custom security policies
    const customViolations = await this.checkCustomPolicies()
    violations.push(...customViolations)
    
    if (violations.length > 0) {
      await this.handleComplianceViolations(violations)
    }
  }
  
  /**
   * Handle critical security events
   * @param {Object} event - Critical security event
   */
  async handleCriticalEvent(event) {
    switch (event.type) {
      case 'container_escape':
        await this.quarantineContainer(event.containerId)
        break
        
      case 'cryptomining':
        await this.terminateContainer(event.containerId)
        break
        
      case 'reverse_shell':
        await this.isolateContainer(event.containerId)
        break
        
      case 'privilege_escalation':
        await this.auditContainer(event.containerId)
        break
        
      default:
        await this.logCriticalEvent(event)
    }
  }
  
  /**
   * Quarantine suspicious container
   * @param {string} containerId - Container to quarantine
   */
  async quarantineContainer(containerId) {
    try {
      // Apply restrictive network policy
      await this.applyQuarantineNetworkPolicy(containerId)
      
      // Scale down deployment
      await this.scaleDownDeployment(containerId)
      
      // Create forensics snapshot
      await this.createForensicsSnapshot(containerId)
      
      console.log(`Container ${containerId} quarantined successfully`)
    } catch (error) {
      console.error(`Failed to quarantine container ${containerId}:`, error)
    }
  }
}
```

## Container Security Best Practices

### 1. Image Security
- Use minimal base images (distroless, Alpine)
- Scan images for vulnerabilities
- Sign images with content trust
- Use private registries with access controls

### 2. Runtime Security
- Run containers as non-root users
- Use read-only file systems where possible
- Drop all unnecessary capabilities
- Enable security profiles (AppArmor, SELinux)

### 3. Network Security
- Implement network segmentation with NetworkPolicies
- Use service mesh for encrypted communication
- Restrict ingress and egress traffic
- Monitor network traffic for anomalies

### 4. Secrets Management
- Use external secret management systems
- Avoid hardcoding secrets in images
- Rotate secrets regularly
- Use sealed secrets or external secrets operators

### 5. Compliance & Governance
- Implement Pod Security Standards
- Use admission controllers for policy enforcement
- Regular compliance auditing
- Automated remediation of violations

### 6. Monitoring & Logging
- Monitor runtime behavior with Falco
- Centralized logging for security events
- Real-time alerting for critical events
- Regular security assessments

### 7. Supply Chain Security
- Verify image signatures
- Use admission controllers to enforce policies
- Scan dependencies for vulnerabilities
- Implement software bill of materials (SBOM)