Feature: Security Measures
  As a system administrator
  I want the application to be secure from common vulnerabilities
  So that user data and system integrity are protected

  Background:
    Given the application is running in production mode
    And security testing tools are available
    And proper authentication is configured

  @security @headers @critical
  Scenario: Security Headers Implementation
    Given I am testing HTTP security headers
    When I make requests to any page
    Then Content-Security-Policy header should be present and restrictive
    And X-Frame-Options should be set to DENY or SAMEORIGIN
    And X-Content-Type-Options should be set to nosniff
    And X-XSS-Protection should be set to "1; mode=block"
    And Strict-Transport-Security should enforce HTTPS with max-age >= 31536000
    And Referrer-Policy should be set to strict-origin-when-cross-origin

  @security @https @critical
  Scenario: HTTPS and TLS Configuration
    Given I am testing SSL/TLS implementation
    When I access the application
    Then all traffic should be encrypted with HTTPS
    And TLS version should be 1.2 or higher
    And SSL certificate should be valid and properly configured
    And HTTP requests should redirect to HTTPS (301)
    And HSTS should be enforced for at least 1 year
    And certificate should not expire within 30 days

  @security @input-validation @critical
  Scenario: Input Validation and Sanitization
    Given I am testing form inputs and API endpoints
    When I submit various types of malicious input
    Then XSS payloads should be properly escaped or rejected
    And SQL injection attempts should be blocked
    And file upload should validate file types and sizes
    And input length limits should be enforced
    And special characters should be properly handled
    And CSRF tokens should be validated on state-changing operations

  @security @authentication @critical
  Scenario: Authentication Security
    Given I am testing authentication mechanisms
    When I attempt various authentication scenarios
    Then passwords should meet complexity requirements (min 8 chars, mixed case, numbers)
    And failed login attempts should be rate-limited (max 5 attempts per 15 minutes)
    And session tokens should be cryptographically secure
    And sessions should expire after inactivity (max 30 minutes)
    And password reset tokens should expire within 1 hour
    And account lockout should occur after repeated failed attempts

  @security @authorization @high
  Scenario: Authorization and Access Control
    Given I am testing access control mechanisms
    When I attempt to access restricted resources
    Then unauthorized access should be denied with 401/403 status
    And user roles and permissions should be properly enforced
    And privilege escalation should be prevented
    And sensitive data should only be accessible to authorized users
    And API endpoints should validate user permissions
    And admin functions should require additional authentication

  @security @data-protection @critical
  Scenario: Data Protection and Privacy
    Given I am testing data handling
    When I interact with sensitive data
    Then PII should be encrypted at rest and in transit
    And database connections should use encrypted channels
    And sensitive data should not appear in logs or error messages
    And data should be properly anonymized in non-production environments
    And backup data should be encrypted
    And data retention policies should be enforced

  @security @session-management @high
  Scenario: Session Security
    Given I am testing session management
    When I authenticate and use the application
    Then session IDs should be regenerated after login
    And sessions should be invalidated on logout
    And concurrent session limits should be enforced
    And session cookies should have secure and httpOnly flags
    And SameSite attribute should be set to prevent CSRF
    And session fixation attacks should be prevented

  @security @cors @medium
  Scenario: Cross-Origin Resource Sharing (CORS)
    Given I am testing CORS configuration
    When I make cross-origin requests
    Then CORS policy should be restrictive and specific
    And wildcard origins should not be allowed in production
    And credentials should only be allowed for trusted origins
    And preflight requests should be handled properly
    And allowed methods and headers should be minimal

  @security @dependency @high
  Scenario: Dependency Security
    Given I am analyzing application dependencies
    When I scan for security vulnerabilities
    Then no high or critical severity vulnerabilities should exist
    And dependencies should be regularly updated
    And security patches should be applied within 30 days
    And vulnerability scanning should be automated
    And supply chain attacks should be mitigated through integrity checks

  @security @api-security @high
  Scenario: API Security
    Given I am testing API endpoints
    When I make various API requests
    Then API rate limiting should be enforced (max 1000 requests/hour per user)
    And API versioning should be implemented
    And request/response size limits should be enforced
    And API keys should be properly validated and secured
    And sensitive API endpoints should require authentication
    And API responses should not leak sensitive information

  @security @error-handling @medium
  Scenario: Secure Error Handling
    Given I am testing error scenarios
    When errors occur in the application
    Then error messages should not reveal sensitive system information
    And stack traces should not be exposed to end users
    And error logs should not contain sensitive data
    And HTTP status codes should be appropriate and not leak information
    And custom error pages should be used instead of server defaults

  @security @file-upload @high
  Scenario: File Upload Security
    Given the application allows file uploads
    When I test file upload functionality
    Then uploaded files should be scanned for malware
    And file types should be validated by content, not just extension
    And file size limits should be enforced (max 10MB)
    And uploaded files should be stored outside web root
    And executable files should be prohibited
    And image files should be reprocessed to remove metadata

  @security @logging @medium
  Scenario: Security Logging and Monitoring
    Given I am testing security logging
    When security events occur
    Then failed authentication attempts should be logged
    And privilege escalation attempts should be logged
    And suspicious activities should trigger alerts
    And logs should be tamper-resistant
    And log retention should follow security policies
    And real-time security monitoring should be in place