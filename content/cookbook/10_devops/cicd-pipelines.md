# CI/CD Pipeline Design and Implementation

## Overview
Comprehensive CI/CD pipeline strategies using GitHub Actions, GitLab CI, Jenkins, and AWS CodePipeline for automated build, test, and deployment workflows.

## GitHub Actions Pipelines

### 1. Complete Node.js Application Pipeline

```yaml
# .github/workflows/nodejs-app.yml
name: Node.js Application CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  AWS_REGION: us-east-1

jobs:
  test:
    name: Test Suite
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379
    
    - name: Upload test coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
    
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

  build:
    name: Build and Push
    runs-on: ubuntu-latest
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ steps.login-ecr.outputs.registry }}/my-app
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push Docker image
      id: build
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        platforms: linux/amd64,linux/arm64
    
    - name: Generate SBOM
      uses: anchore/sbom-action@v0
      with:
        image: ${{ steps.login-ecr.outputs.registry }}/my-app:${{ github.sha }}
        format: spdx-json
        output-file: sbom.spdx.json
    
    - name: Upload SBOM
      uses: actions/upload-artifact@v3
      with:
        name: sbom
        path: sbom.spdx.json

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --name staging-cluster --region ${{ env.AWS_REGION }}
    
    - name: Deploy to Kubernetes
      run: |
        sed -i "s|IMAGE_TAG|${{ needs.build.outputs.image-tag }}|g" k8s/staging/*.yaml
        kubectl apply -f k8s/staging/
        kubectl rollout status deployment/my-app -n staging
    
    - name: Run smoke tests
      run: |
        kubectl wait --for=condition=ready pod -l app=my-app -n staging --timeout=300s
        npm run test:smoke -- --env=staging

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, deploy-staging]
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Setup kubectl
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.28.0'
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --name production-cluster --region ${{ env.AWS_REGION }}
    
    - name: Blue-Green Deployment
      run: |
        # Update green deployment
        sed -i "s|IMAGE_TAG|${{ needs.build.outputs.image-tag }}|g" k8s/production/green/*.yaml
        kubectl apply -f k8s/production/green/
        kubectl rollout status deployment/my-app-green -n production
        
        # Run health checks
        kubectl wait --for=condition=ready pod -l app=my-app,version=green -n production --timeout=300s
        
        # Switch traffic to green
        kubectl patch service my-app-service -n production -p '{"spec":{"selector":{"version":"green"}}}'
        
        # Wait and cleanup blue
        sleep 300
        kubectl delete deployment my-app-blue -n production --ignore-not-found
    
    - name: Post-deployment tests
      run: |
        npm run test:e2e -- --env=production
        npm run test:performance -- --env=production
    
    - name: Notify Slack
      uses: 8398a7/action-slack@v3
      if: always()
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        fields: repo,commit,author,action,eventName,ref,workflow
```

### 2. Multi-Service Monorepo Pipeline

```yaml
# .github/workflows/monorepo.yml
name: Monorepo CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
      shared: ${{ steps.changes.outputs.shared }}
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Check for changes
      uses: dorny/paths-filter@v2
      id: changes
      with:
        filters: |
          frontend:
            - 'packages/frontend/**'
            - 'packages/shared/**'
          backend:
            - 'packages/backend/**'
            - 'packages/shared/**'
          shared:
            - 'packages/shared/**'

  test-shared:
    name: Test Shared Package
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.shared == 'true' }}
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Test shared package
      run: npm run test:shared

  test-frontend:
    name: Test Frontend
    runs-on: ubuntu-latest
    needs: [changes, test-shared]
    if: ${{ always() && needs.changes.outputs.frontend == 'true' }}
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build shared package
      run: npm run build:shared
    
    - name: Test frontend
      run: npm run test:frontend
    
    - name: Build frontend
      run: npm run build:frontend

  test-backend:
    name: Test Backend
    runs-on: ubuntu-latest
    needs: [changes, test-shared]
    if: ${{ always() && needs.changes.outputs.backend == 'true' }}
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build shared package
      run: npm run build:shared
    
    - name: Test backend
      run: npm run test:backend
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  build-and-deploy:
    name: Build and Deploy
    runs-on: ubuntu-latest
    needs: [changes, test-frontend, test-backend]
    if: ${{ always() && github.ref == 'refs/heads/main' }}
    
    strategy:
      matrix:
        service: [frontend, backend]
        include:
        - service: frontend
          needs-build: ${{ needs.changes.outputs.frontend }}
        - service: backend
          needs-build: ${{ needs.changes.outputs.backend }}
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      if: matrix.needs-build == 'true'
    
    - name: Build and deploy ${{ matrix.service }}
      if: matrix.needs-build == 'true'
      run: |
        echo "Building and deploying ${{ matrix.service }}"
        docker build -f packages/${{ matrix.service }}/Dockerfile -t ${{ matrix.service }}:latest .
        # Add deployment logic here
```

### 3. GitOps with ArgoCD

```yaml
# .github/workflows/gitops.yml
name: GitOps Deployment

on:
  push:
    branches: [main]
    paths:
    - 'src/**'
    - 'Dockerfile'

jobs:
  build-and-update-manifests:
    name: Build and Update GitOps Manifests
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout app repo
      uses: actions/checkout@v4
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push image
      run: |
        docker build -t myapp:${{ github.sha }} .
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push myapp:${{ github.sha }}
    
    - name: Checkout GitOps repo
      uses: actions/checkout@v4
      with:
        repository: myorg/gitops-manifests
        token: ${{ secrets.GITOPS_TOKEN }}
        path: gitops
    
    - name: Update Kubernetes manifests
      run: |
        cd gitops
        sed -i "s|image: myapp:.*|image: myapp:${{ github.sha }}|g" environments/staging/app.yaml
        
        git config --local user.email "action@github.com"
        git config --local user.name "GitHub Action"
        git add .
        git commit -m "Update image to ${{ github.sha }}"
        git push
    
    - name: Create ArgoCD sync annotation
      run: |
        kubectl annotate app myapp-staging argocd.argoproj.io/sync="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

## Jenkins Pipelines

### 1. Declarative Pipeline with Multiple Stages

```groovy
// Jenkinsfile
pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:18-alpine
    command:
    - cat
    tty: true
  - name: docker
    image: docker:dind
    securityContext:
      privileged: true
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
"""
        }
    }
    
    environment {
        DOCKER_REGISTRY = 'your-registry.com'
        IMAGE_NAME = 'myapp'
        KUBECONFIG_CREDENTIAL_ID = 'kubeconfig'
        SLACK_CHANNEL = '#deployments'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT_SHORT}"
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                container('node') {
                    sh 'npm ci'
                }
            }
        }
        
        stage('Code Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        container('node') {
                            sh 'npm run lint'
                        }
                    }
                }
                stage('Type Check') {
                    steps {
                        container('node') {
                            sh 'npm run type-check'
                        }
                    }
                }
                stage('Security Scan') {
                    steps {
                        container('node') {
                            sh 'npm audit --audit-level high'
                        }
                    }
                }
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        container('node') {
                            sh 'npm run test:unit -- --coverage --ci'
                        }
                    }
                    post {
                        always {
                            publishTestResults testResultsPattern: 'coverage/junit.xml'
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'coverage/lcov-report',
                                reportFiles: 'index.html',
                                reportName: 'Coverage Report'
                            ])
                        }
                    }
                }
                stage('Integration Tests') {
                    steps {
                        container('node') {
                            sh 'npm run test:integration'
                        }
                    }
                }
            }
        }
        
        stage('Build') {
            steps {
                container('docker') {
                    script {
                        def image = docker.build("${env.DOCKER_REGISTRY}/${env.IMAGE_NAME}:${env.IMAGE_TAG}")
                        docker.withRegistry("https://${env.DOCKER_REGISTRY}", 'docker-registry-credentials') {
                            image.push()
                            image.push('latest')
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'main'
            }
            steps {
                container('kubectl') {
                    withKubeConfig([credentialsId: env.KUBECONFIG_CREDENTIAL_ID]) {
                        sh """
                            sed -i 's|IMAGE_TAG|${env.IMAGE_TAG}|g' k8s/staging/*.yaml
                            kubectl apply -f k8s/staging/ -n staging
                            kubectl rollout status deployment/myapp -n staging
                        """
                    }
                }
            }
        }
        
        stage('Smoke Tests') {
            when {
                branch 'main'
            }
            steps {
                container('node') {
                    sh 'npm run test:smoke -- --env=staging'
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                allOf {
                    branch 'main'
                    expression { return currentBuild.result == null || currentBuild.result == 'SUCCESS' }
                }
            }
            steps {
                script {
                    def userInput = input(
                        id: 'userInput',
                        message: 'Deploy to production?',
                        parameters: [
                            choice(name: 'DEPLOY_STRATEGY', choices: ['blue-green', 'rolling', 'canary'], description: 'Deployment strategy')
                        ]
                    )
                    
                    container('kubectl') {
                        withKubeConfig([credentialsId: env.KUBECONFIG_CREDENTIAL_ID]) {
                            if (userInput.DEPLOY_STRATEGY == 'blue-green') {
                                sh """
                                    # Deploy to green
                                    sed -i 's|IMAGE_TAG|${env.IMAGE_TAG}|g' k8s/production/green/*.yaml
                                    kubectl apply -f k8s/production/green/ -n production
                                    kubectl rollout status deployment/myapp-green -n production
                                    
                                    # Health check
                                    kubectl wait --for=condition=ready pod -l app=myapp,version=green -n production --timeout=300s
                                    
                                    # Switch traffic
                                    kubectl patch service myapp-service -n production -p '{"spec":{"selector":{"version":"green"}}}'
                                    
                                    # Cleanup blue after delay
                                    sleep 300
                                    kubectl delete deployment myapp-blue -n production --ignore-not-found
                                """
                            } else if (userInput.DEPLOY_STRATEGY == 'rolling') {
                                sh """
                                    sed -i 's|IMAGE_TAG|${env.IMAGE_TAG}|g' k8s/production/*.yaml
                                    kubectl apply -f k8s/production/ -n production
                                    kubectl rollout status deployment/myapp -n production
                                """
                            }
                        }
                    }
                }
            }
        }
        
        stage('Post-Deploy Tests') {
            when {
                branch 'main'
            }
            parallel {
                stage('E2E Tests') {
                    steps {
                        container('node') {
                            sh 'npm run test:e2e -- --env=production'
                        }
                    }
                }
                stage('Performance Tests') {
                    steps {
                        container('node') {
                            sh 'npm run test:performance -- --env=production'
                        }
                    }
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            slackSend(
                channel: env.SLACK_CHANNEL,
                color: 'good',
                message: ":white_check_mark: Deployment successful for ${env.JOB_NAME} - ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
            )
        }
        failure {
            slackSend(
                channel: env.SLACK_CHANNEL,
                color: 'danger',
                message: ":x: Deployment failed for ${env.JOB_NAME} - ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)"
            )
        }
    }
}
```

### 2. Shared Jenkins Library

```groovy
// vars/deployApp.groovy
def call(Map config) {
    pipeline {
        agent any
        
        stages {
            stage('Build') {
                steps {
                    buildApplication(config)
                }
            }
            
            stage('Test') {
                steps {
                    runTests(config)
                }
            }
            
            stage('Deploy') {
                steps {
                    deployToEnvironment(config)
                }
            }
        }
    }
}

def buildApplication(config) {
    sh """
        docker build -t ${config.imageName}:${config.imageTag} .
        docker push ${config.imageName}:${config.imageTag}
    """
}

def runTests(config) {
    sh "npm test"
    publishTestResults testResultsPattern: 'test-results.xml'
}

def deployToEnvironment(config) {
    withKubeConfig([credentialsId: config.kubeconfig]) {
        sh """
            helm upgrade --install ${config.appName} ./helm \
                --set image.tag=${config.imageTag} \
                --set environment=${config.environment} \
                --namespace ${config.namespace}
        """
    }
}
```

## GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - security
  - package
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"
  CONTAINER_TEST_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_REF_SLUG
  CONTAINER_RELEASE_IMAGE: $CI_REGISTRY_IMAGE:latest

cache:
  paths:
    - node_modules/
    - .npm/

before_script:
  - npm ci --cache .npm --prefer-offline

build:
  stage: build
  image: node:18-alpine
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour
  only:
    - main
    - develop
    - merge_requests

.test_template: &test_definition
  stage: test
  image: node:18-alpine
  services:
    - name: postgres:15-alpine
      alias: postgres
    - name: redis:7-alpine
      alias: redis
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: testuser
    POSTGRES_PASSWORD: testpass
    DATABASE_URL: "postgresql://testuser:testpass@postgres:5432/testdb"
    REDIS_URL: "redis://redis:6379"
  before_script:
    - npm ci --cache .npm --prefer-offline
    - npm run migrate

unit-tests:
  <<: *test_definition
  script:
    - npm run test:unit -- --coverage --ci
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      junit: coverage/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 1 week

integration-tests:
  <<: *test_definition
  script:
    - npm run test:integration

e2e-tests:
  stage: test
  image: cypress/browsers:node18.12.0-chrome106-ff106
  services:
    - name: postgres:15-alpine
      alias: postgres
  variables:
    CYPRESS_CACHE_FOLDER: "$CI_PROJECT_DIR/cache/Cypress"
  cache:
    key: cypress-cache
    paths:
      - cache/Cypress/
  script:
    - npm run start:test &
    - npm run wait-on http://localhost:3000
    - npm run test:e2e -- --record --key $CYPRESS_RECORD_KEY
  artifacts:
    when: always
    paths:
      - cypress/screenshots
      - cypress/videos
    expire_in: 1 week

security-scan:
  stage: security
  image: registry.gitlab.com/gitlab-org/security-products/analyzers/nodejs-scan:2
  script:
    - npm audit --audit-level moderate
    - retire --path .
  artifacts:
    reports:
      dependency_scanning: gl-dependency-scanning-report.json
  allow_failure: true

sast:
  stage: security
  template: Security/SAST.gitlab-ci.yml

container-scan:
  stage: security
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker pull $CONTAINER_TEST_IMAGE
    - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock 
      -v $HOME/Library/Caches:/root/.cache/ aquasec/trivy:latest 
      image --exit-code 0 --no-progress --format template 
      --template "@contrib/gitlab.tpl" -o gl-container-scanning-report.json 
      $CONTAINER_TEST_IMAGE
  artifacts:
    reports:
      container_scanning: gl-container-scanning-report.json

build-container:
  stage: package
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build --pull -t $CONTAINER_TEST_IMAGE .
    - docker push $CONTAINER_TEST_IMAGE
    - docker tag $CONTAINER_TEST_IMAGE $CONTAINER_RELEASE_IMAGE
    - docker push $CONTAINER_RELEASE_IMAGE
  only:
    - main

.deploy_template: &deploy_definition
  image: alpine/helm:latest
  before_script:
    - apk add --no-cache curl
    - curl -LO "https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl"
    - chmod +x kubectl
    - mv kubectl /usr/local/bin/
    - echo $KUBE_CONFIG | base64 -d > kubeconfig
    - export KUBECONFIG=kubeconfig

deploy-staging:
  <<: *deploy_definition
  stage: deploy
  script:
    - helm upgrade --install myapp-staging ./helm/myapp
      --set image.tag=$CI_COMMIT_SHA
      --set environment=staging
      --namespace staging
      --create-namespace
  environment:
    name: staging
    url: https://staging.myapp.com
  only:
    - main

deploy-production:
  <<: *deploy_definition
  stage: deploy
  script:
    - helm upgrade --install myapp-production ./helm/myapp
      --set image.tag=$CI_COMMIT_SHA
      --set environment=production
      --namespace production
      --create-namespace
  environment:
    name: production
    url: https://myapp.com
  when: manual
  only:
    - main
```

## AWS CodePipeline with CloudFormation

```yaml
# codepipeline.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Complete CI/CD Pipeline for Node.js Application'

Parameters:
  GitHubOwner:
    Type: String
    Description: GitHub repository owner
  GitHubRepo:
    Type: String
    Description: GitHub repository name
  GitHubBranch:
    Type: String
    Default: main
    Description: GitHub branch to track

Resources:
  # S3 Bucket for Pipeline Artifacts
  ArtifactsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-pipeline-artifacts-${AWS::AccountId}'
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256

  # CodeBuild Project for Testing
  TestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${AWS::StackName}-test'
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/amazonlinux2-x86_64-standard:3.0
        EnvironmentVariables:
          - Name: DATABASE_URL
            Value: !Sub 'postgresql://testuser:testpass@localhost:5432/testdb'
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              runtime-versions:
                nodejs: 18
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
                - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
                - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
                - IMAGE_TAG=${COMMIT_HASH:=latest}
            build:
              commands:
                - echo Starting services for testing...
                - docker run -d --name postgres -p 5432:5432 -e POSTGRES_DB=testdb -e POSTGRES_USER=testuser -e POSTGRES_PASSWORD=testpass postgres:15
                - docker run -d --name redis -p 6379:6379 redis:7-alpine
                - sleep 10
                - echo Installing dependencies...
                - npm ci
                - echo Running tests...
                - npm run test:unit -- --coverage
                - npm run test:integration
                - echo Building the Docker image...
                - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
                - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $REPOSITORY_URI:$IMAGE_TAG
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Pushing the Docker image...
                - docker push $REPOSITORY_URI:$IMAGE_TAG
          artifacts:
            files:
              - '**/*'

  # CodeBuild Project for Building and Pushing
  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub '${AWS::StackName}-build'
      ServiceRole: !GetAtt CodeBuildRole.Arn
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/amazonlinux2-x86_64-standard:3.0
        PrivilegedMode: true
        EnvironmentVariables:
          - Name: AWS_DEFAULT_REGION
            Value: !Ref AWS::Region
          - Name: AWS_ACCOUNT_ID
            Value: !Ref AWS::AccountId
          - Name: IMAGE_REPO_NAME
            Value: !Ref ECRRepository
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            pre_build:
              commands:
                - echo Logging in to Amazon ECR...
                - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
                - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
                - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
                - IMAGE_TAG=${COMMIT_HASH:=latest}
            build:
              commands:
                - echo Build started on `date`
                - echo Building the Docker image...
                - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
                - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $REPOSITORY_URI:$IMAGE_TAG
            post_build:
              commands:
                - echo Build completed on `date`
                - echo Pushing the Docker image...
                - docker push $REPOSITORY_URI:$IMAGE_TAG
                - printf '{"ImageURI":"%s"}' $REPOSITORY_URI:$IMAGE_TAG > imageDetail.json
          artifacts:
            files:
              - imageDetail.json
              - appspec.yml
              - taskdef.json

  # CodeDeploy Application
  CodeDeployApplication:
    Type: AWS::CodeDeploy::Application
    Properties:
      ApplicationName: !Sub '${AWS::StackName}-app'
      ComputePlatform: ECS

  # CodeDeploy Deployment Group
  CodeDeployDeploymentGroup:
    Type: AWS::CodeDeploy::DeploymentGroup
    Properties:
      ApplicationName: !Ref CodeDeployApplication
      DeploymentGroupName: !Sub '${AWS::StackName}-deployment-group'
      ServiceRoleArn: !GetAtt CodeDeployRole.Arn
      AutoRollbackConfiguration:
        Enabled: true
        Events:
          - DEPLOYMENT_FAILURE
          - DEPLOYMENT_STOP_ON_ALARM
          - DEPLOYMENT_STOP_ON_INSTANCE_FAILURE
      BlueGreenDeploymentConfiguration:
        TerminateBlueInstancesOnDeploymentSuccess:
          Action: TERMINATE
          TerminationWaitTimeInMinutes: 5
        DeploymentReadyOption:
          ActionOnTimeout: CONTINUE_DEPLOYMENT
        GreenFleetProvisioningOption:
          Action: COPY_AUTO_SCALING_GROUP

  # CodePipeline
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub '${AWS::StackName}-pipeline'
      RoleArn: !GetAtt CodePipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactsBucket
      Stages:
        - Name: Source
          Actions:
            - Name: SourceAction
              ActionTypeId:
                Category: Source
                Owner: ThirdParty
                Provider: GitHub
                Version: 1
              Configuration:
                Owner: !Ref GitHubOwner
                Repo: !Ref GitHubRepo
                Branch: !Ref GitHubBranch
                OAuthToken: '{{resolve:secretsmanager:github-token}}'
              OutputArtifacts:
                - Name: SourceOutput
        
        - Name: Test
          Actions:
            - Name: TestAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref TestProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: TestOutput
        
        - Name: Build
          Actions:
            - Name: BuildAction
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref BuildProject
              InputArtifacts:
                - Name: SourceOutput
              OutputArtifacts:
                - Name: BuildOutput
        
        - Name: Deploy-Staging
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
                Version: 1
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref CodeDeployDeploymentGroup
                TaskDefinitionTemplateArtifact: BuildOutput
                AppSpecTemplateArtifact: BuildOutput
                ImageDetailsArtifact: BuildOutput
              InputArtifacts:
                - Name: BuildOutput
              Region: !Ref AWS::Region
        
        - Name: Approve-Production
          Actions:
            - Name: ManualApproval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: 1
              Configuration:
                CustomData: 'Please review the staging deployment and approve for production'
        
        - Name: Deploy-Production
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeployToECS
                Version: 1
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref CodeDeployDeploymentGroup
                TaskDefinitionTemplateArtifact: BuildOutput
                AppSpecTemplateArtifact: BuildOutput
                ImageDetailsArtifact: BuildOutput
              InputArtifacts:
                - Name: BuildOutput
              Region: !Ref AWS::Region
```

## Best Practices

### 1. Pipeline Security
- Use least privilege IAM roles and policies
- Scan container images for vulnerabilities
- Implement secrets management (AWS Secrets Manager, HashiCorp Vault)
- Use signed commits and verified builds
- Implement branch protection rules

### 2. Testing Strategy
- Run unit tests in parallel with different Node.js versions
- Implement integration tests with real service dependencies
- Use contract testing for microservices
- Include performance and load testing
- Implement smoke tests for post-deployment validation

### 3. Deployment Strategies
- Use blue-green deployments for zero-downtime releases
- Implement canary deployments for gradual rollouts
- Use feature flags for controlled feature releases
- Implement automated rollback triggers
- Monitor deployment metrics and health checks

### 4. Monitoring and Alerting
- Implement pipeline metrics and monitoring
- Set up alerts for failed deployments
- Track deployment frequency and lead time
- Monitor application performance post-deployment
- Use distributed tracing for complex applications

### 5. Pipeline Optimization
- Use efficient caching strategies
- Parallelize independent stages
- Optimize container build times with multi-stage builds
- Use pipeline templates and reusable workflows
- Implement artifact management and cleanup policies