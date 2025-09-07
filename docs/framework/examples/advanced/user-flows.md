# Advanced User Flows Examples

Complex, multi-step user journeys that test complete application workflows from start to finish.

## E-Commerce User Journey

### Complete Purchase Flow

```javascript
// tests/flows/ecommerce-purchase.test.js
import { scenario } from 'tests/framework/core/index.js'

scenario('Complete e-commerce purchase journey')
  // Initial setup
  .given.user.isNotAuthenticated()
  .given.store.hasProducts([
    { id: 1, name: 'Gaming Laptop', price: 1299, stock: 5, category: 'electronics' },
    { id: 2, name: 'Wireless Mouse', price: 79, stock: 20, category: 'accessories' },
    { id: 3, name: 'Mechanical Keyboard', price: 159, stock: 15, category: 'accessories' }
  ])
  .given.store.hasPromotions([
    { code: 'TECH20', discount: 0.20, minAmount: 1000 }
  ])
  
  // Step 1: Browse and discover products
  .when.user.navigatesTo('/')
  .then.page.showsHeroSection()
  .then.page.showsFeaturedProducts()
  .when.user.clicksLink('Shop Electronics')
  .then.user.isRedirectedTo('/products?category=electronics')
  .then.page.showsProducts(['Gaming Laptop'])
  .then.page.showsFilters(['category', 'price', 'brand'])
  
  // Step 2: Product research and comparison
  .when.user.clicksProduct('Gaming Laptop')
  .then.page.hasUrl('/products/1')
  .then.page.showsProductDetails({
    name: 'Gaming Laptop',
    price: '$1,299',
    images: expect.arrayContaining(['main.jpg']),
    specifications: expect.any(Object),
    reviews: expect.any(Array)
  })
  .when.user.scrollsTo('reviews-section')
  .then.page.showsCustomerReviews()
  .when.user.clicksTab('specifications')
  .then.page.showsDetailedSpecs()
  
  // Step 3: Add to cart and continue shopping
  .when.user.selectsQuantity(1)
  .when.user.clicksButton('Add to Cart')
  .then.page.showsNotification('Added to cart')
  .then.page.showsCartBadge('1')
  .then.api.addedToCart({ productId: 1, quantity: 1 })
  
  // Add accessories
  .when.user.navigatesTo('/products?category=accessories')
  .when.user.addToCart('Wireless Mouse')
  .when.user.addToCart('Mechanical Keyboard')
  .then.page.showsCartBadge('3')
  
  // Step 4: Review cart and apply promotions
  .when.user.clicksCartIcon()
  .then.page.showsCartOverlay()
  .then.page.showsCartItems([
    'Gaming Laptop - $1,299',
    'Wireless Mouse - $79', 
    'Mechanical Keyboard - $159'
  ])
  .then.page.showsSubtotal('$1,537')
  .when.user.clicksLink('View Full Cart')
  .then.page.hasUrl('/cart')
  .then.page.showsDetailedCart()
  
  // Apply discount code
  .when.user.fillsInput('promo-code', 'TECH20')
  .when.user.clicksButton('Apply Code')
  .then.page.showsDiscount('20% off - $259.40')
  .then.page.showsTotal('$1,277.60')
  .then.page.showsSuccess('Promo code applied!')
  
  // Step 5: Account creation during checkout
  .when.user.clicksButton('Proceed to Checkout')
  .then.page.hasUrl('/checkout')
  .then.page.showsGuestCheckoutOption()
  .then.page.showsAccountCreationOption()
  .when.user.clicksButton('Create Account & Checkout')
  .then.page.showsRegistrationForm()
  
  .when.user.fillsRegistrationForm({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!'
  })
  .when.user.clicksButton('Create Account')
  .then.api.createdAccount('/api/auth/register')
  .then.user.isAuthenticated()
  .then.page.showsWelcome('Welcome, John!')
  .then.user.receivesEmail('welcome')
  
  // Step 6: Shipping information
  .then.page.showsShippingForm()
  .when.user.fillsShippingAddress({
    street: '123 Tech Street',
    apartment: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94105',
    country: 'US'
  })
  .when.user.selectsShippingMethod('standard') // $9.99
  .then.page.updatesTotal('$1,287.59')
  
  // Step 7: Payment processing
  .when.user.clicksButton('Continue to Payment')
  .then.page.showsPaymentForm()
  .when.user.fillsPaymentInfo({
    cardNumber: '4111111111111111',
    expiry: '12/25',
    cvc: '123',
    name: 'John Doe',
    billingAddress: 'same-as-shipping'
  })
  .when.user.clicksButton('Place Order')
  
  // Step 8: Order processing and confirmation
  .then.page.showsProcessing('Processing your order...')
  .then.api.processedPayment()
  .then.api.createdOrder()
  .then.database.reducedInventory([
    { productId: 1, quantity: 1 },
    { productId: 2, quantity: 1 },
    { productId: 3, quantity: 1 }
  ])
  .then.page.hasUrl('/order/confirmation/12345')
  .then.page.showsOrderConfirmation({
    orderNumber: '#12345',
    total: '$1,287.59',
    estimatedDelivery: expect.any(String)
  })
  .then.user.receivesEmail('order-confirmation')
  .then.page.emptiesCart()
  
  // Step 9: Post-purchase experience
  .when.user.clicksLink('Track Your Order')
  .then.page.hasUrl('/account/orders/12345')
  .then.page.showsOrderTracking()
  .then.page.showsOrderStatus('Processing')
  .when.user.clicksButton('Download Invoice')
  .then.file.downloads('invoice-12345.pdf')
  .execute()
```

## SaaS Application Onboarding

### Complete User Onboarding Flow

```javascript
// tests/flows/saas-onboarding.test.js
scenario('SaaS application complete onboarding')
  .given.application.isAvailable()
  .given.plans.areAvailable([
    { name: 'Starter', price: 29, features: ['basic-analytics', '1-user'] },
    { name: 'Pro', price: 79, features: ['advanced-analytics', '5-users', 'integrations'] },
    { name: 'Enterprise', price: 199, features: ['custom-analytics', 'unlimited-users', 'api-access'] }
  ])
  
  // Step 1: Landing and plan selection
  .when.user.navigatesTo('/')
  .then.page.showsHeroSection('Grow your business with data')
  .then.page.showsPricingTiers()
  .when.user.scrollsTo('pricing-section')
  .then.page.showsFeatureComparison()
  .when.user.clicksButton('Start Pro Trial')
  .then.page.hasUrl('/signup?plan=pro')
  
  // Step 2: Account creation with trial
  .then.page.showsSignupForm()
  .then.page.showsSelectedPlan('Pro - 14 day free trial')
  .when.user.fillsSignupForm({
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@techstartup.com',
    company: 'Tech Startup Inc',
    password: 'SecurePassword123!',
    agreeToTerms: true
  })
  .when.user.clicksButton('Start Free Trial')
  .then.api.createdTrialAccount()
  .then.user.isAuthenticated()
  .then.user.receivesEmail('trial-welcome')
  
  // Step 3: Email verification
  .then.page.showsVerificationPrompt()
  .then.page.showsMessage('Please verify your email to continue')
  .when.user.checksEmail('verification')
  .when.user.clicksEmailLink('verify-email')
  .then.page.hasUrl('/verify-email?token=abc123')
  .then.page.showsSuccess('Email verified!')
  .then.user.isEmailVerified()
  
  // Step 4: Profile completion and company setup
  .then.page.redirectsTo('/onboarding/profile')
  .then.page.showsOnboardingProgress('1 of 5')
  .when.user.fillsProfileForm({
    role: 'Founder',
    companySize: '1-10',
    industry: 'Technology',
    goals: ['increase-revenue', 'track-metrics', 'automate-reports']
  })
  .when.user.clicksButton('Continue')
  
  // Step 5: Integration setup
  .then.page.hasUrl('/onboarding/integrations')
  .then.page.showsOnboardingProgress('2 of 5')
  .then.page.showsAvailableIntegrations(['google-analytics', 'stripe', 'shopify', 'mailchimp'])
  .when.user.selectsIntegration('google-analytics')
  .when.user.authorizes('google-oauth')
  .then.api.connectedIntegration('google-analytics')
  .when.user.selectsIntegration('stripe')
  .when.user.authorizes('stripe-oauth')
  .then.api.connectedIntegration('stripe')
  .when.user.clicksButton('Continue')
  
  // Step 6: Data import and initial setup
  .then.page.hasUrl('/onboarding/data-import')
  .then.page.showsOnboardingProgress('3 of 5')
  .then.page.showsMessage('Importing your data...')
  .then.api.importsData(['google-analytics', 'stripe'])
  .then.page.showsImportResults({
    'google-analytics': '30 days of traffic data',
    'stripe': '12 months of transaction data'
  })
  .when.user.clicksButton('Continue')
  
  // Step 7: Dashboard customization
  .then.page.hasUrl('/onboarding/dashboard')
  .then.page.showsOnboardingProgress('4 of 5')
  .then.page.showsDashboardTemplates()
  .when.user.selectsTemplate('saas-metrics')
  .then.page.showsCustomizationOptions()
  .when.user.selectsMetrics(['mrr', 'churn-rate', 'customer-lifetime-value', 'traffic'])
  .when.user.arrangeDashboard()
  .when.user.clicksButton('Save Dashboard')
  .then.dashboard.isCustomized()
  
  // Step 8: Team invitation
  .then.page.hasUrl('/onboarding/team')
  .then.page.showsOnboardingProgress('5 of 5')
  .then.page.showsTeamInviteForm()
  .when.user.invitesTeamMembers([
    { email: 'john@techstartup.com', role: 'Admin' },
    { email: 'mike@techstartup.com', role: 'Viewer' }
  ])
  .when.user.clicksButton('Send Invitations')
  .then.api.sentTeamInvites()
  .then.invitees.receiveEmails('team-invitation')
  
  // Step 9: Onboarding completion and first use
  .when.user.clicksButton('Complete Setup')
  .then.page.hasUrl('/dashboard')
  .then.page.showsOnboardingSuccess()
  .then.page.showsFullDashboard()
  .then.page.showsLiveData()
  .then.page.showsTrialStatus('13 days remaining')
  .then.user.receivesEmail('onboarding-complete')
  
  // Step 10: First meaningful action
  .when.user.clicksWidget('mrr-chart')
  .then.page.showsDetailedView('Monthly Recurring Revenue')
  .when.user.adjustsDateRange('last-6-months')
  .then.page.updatesChart()
  .when.user.clicksButton('Share Report')
  .then.page.showsShareModal()
  .when.user.sharesReport('john@techstartup.com')
  .then.api.sharedReport()
  .then.recipient.receivesEmail('report-shared')
  .execute()
```

## Content Management System Workflow

### Editorial Content Publishing Flow

```javascript
// tests/flows/cms-editorial.test.js
scenario('Complete editorial content publishing workflow')
  .given.user.isAuthenticated('editor@magazine.com')
  .given.user.hasRole('editor')
  .given.cms.hasContentTypes(['article', 'video', 'podcast'])
  .given.cms.hasCategories(['technology', 'business', 'lifestyle'])
  .given.cms.hasWorkflow(['draft', 'review', 'approved', 'published'])
  
  // Step 1: Content creation
  .when.user.navigatesTo('/admin/content/new')
  .then.page.showsContentTypeSelector()
  .when.user.selectsContentType('article')
  .then.page.showsArticleEditor()
  .then.page.hasRichTextEditor()
  .then.page.hasSeoFields()
  .then.page.hasPublishingOptions()
  
  .when.user.fillsArticleForm({
    title: 'The Future of AI in Web Development',
    slug: 'future-ai-web-development',
    excerpt: 'Exploring how artificial intelligence is transforming web development...',
    category: 'technology',
    tags: ['ai', 'web-development', 'automation', 'future-tech'],
    seoTitle: 'AI in Web Development: Trends and Predictions for 2024',
    seoDescription: 'Discover how AI is revolutionizing web development...',
    author: 'editor@magazine.com'
  })
  
  // Step 2: Content writing and media management
  .when.user.writesInEditor(`
    # The Future of AI in Web Development
    
    Artificial intelligence is rapidly transforming...
    
    ## Key Trends
    
    1. Automated code generation
    2. Intelligent testing
    3. Smart content optimization
  `)
  .when.user.insertsImage('ai-coding-illustration.jpg')
  .then.page.showsImageUploadDialog()
  .when.user.uploadsImage('ai-coding-illustration.jpg')
  .then.media.isUploaded()
  .when.user.setsImageAltText('AI coding illustration showing developer with robotic assistant')
  .when.user.insertsImage()
  .then.editor.containsImage()
  
  // Step 3: Content preview and revision
  .when.user.clicksButton('Preview')
  .then.page.showsContentPreview()
  .then.page.showsFormattedContent()
  .then.page.showsMetadata()
  .when.user.clicksButton('Edit')
  .then.page.returnsToEditor()
  
  .when.user.addsSection('Benefits of AI Integration')
  .when.user.insertsVideo('ai-demo-video.mp4')
  .when.user.addsPullQuote('"AI will not replace developers, but developers who use AI will replace those who don\'t"')
  
  // Step 4: SEO optimization and social media setup
  .when.user.clicksTab('SEO')
  .then.page.showsSeoAnalysis()
  .then.page.showsSeoScore(85)
  .then.page.showsSeoSuggestions([
    'Add more internal links',
    'Optimize image file names',
    'Add schema markup'
  ])
  .when.user.addInternalLinks(['previous-ai-article', 'web-development-guide'])
  .then.page.updatesSeoScore(92)
  
  .when.user.clicksTab('Social Media')
  .when.user.fillsSocialMediaData({
    facebookTitle: 'AI is Changing Web Development Forever',
    facebookDescription: 'See how artificial intelligence is transforming...',
    twitterTitle: 'The Future of AI in Web Dev',
    twitterDescription: 'AI trends every developer should know about...',
    linkedinTitle: 'Professional Insights: AI in Web Development'
  })
  .when.user.uploadsSocialImage('social-ai-preview.jpg')
  
  // Step 5: Save draft and content review workflow
  .when.user.clicksButton('Save Draft')
  .then.api.savedContent({ status: 'draft' })
  .then.page.showsSuccess('Draft saved')
  .then.page.showsLastSaved(expect.any(Date))
  
  .when.user.clicksButton('Submit for Review')
  .then.page.showsReviewSubmissionDialog()
  .when.user.addReviewNotes('Ready for technical review. Please check AI facts and examples.')
  .when.user.assignsReviewer('tech-editor@magazine.com')
  .when.user.clicksButton('Submit')
  .then.api.submittedForReview()
  .then.content.hasStatus('review')
  .then.reviewer.receivesEmail('review-request')
  
  // Step 6: Review process (switching user context)
  .given.user.isAuthenticated('tech-editor@magazine.com')
  .given.user.hasRole('tech-editor')
  .when.user.navigatesTo('/admin/content/review-queue')
  .then.page.showsReviewQueue()
  .then.page.showsArticle('The Future of AI in Web Development')
  .when.user.clicksArticle('The Future of AI in Web Development')
  .then.page.showsReviewInterface()
  .then.page.showsContentPreview()
  .then.page.hasCommentingTools()
  
  .when.user.addsComment('Great introduction! Could use more specific examples in section 2.', 'paragraph-2')
  .when.user.addsComment('This statistic needs a source citation.', 'statistic-1')
  .when.user.suggestsEdit('Consider adding a code example here', 'section-3')
  .when.user.clicksButton('Request Changes')
  .then.content.hasStatus('revision-needed')
  .then.author.receivesEmail('revision-request')
  
  // Step 7: Revision cycle (back to original author)
  .given.user.isAuthenticated('editor@magazine.com')
  .when.user.navigatesTo('/admin/content/revisions')
  .then.page.showsRevisionRequests()
  .when.user.opensArticle('The Future of AI in Web Development')
  .then.page.showsReviewComments()
  .then.page.highlightsCommentedSections()
  
  .when.user.addressesComment('paragraph-2', 'Added specific example of GitHub Copilot usage')
  .when.user.addressesComment('statistic-1', 'Added citation to Stack Overflow Developer Survey')
  .when.user.implementsSuggestion('section-3', 'Added React component example with AI-generated code')
  .when.user.clicksButton('Mark All Addressed')
  .when.user.clicksButton('Resubmit for Review')
  .then.content.hasStatus('review')
  .then.reviewer.receivesEmail('resubmission-notice')
  
  // Step 8: Approval and scheduling
  .given.user.isAuthenticated('tech-editor@magazine.com')
  .when.user.reviewsResubmission()
  .when.user.clicksButton('Approve for Publishing')
  .then.content.hasStatus('approved')
  
  .given.user.isAuthenticated('editor@magazine.com')
  .when.user.accessesApprovedContent()
  .then.page.showsPublishingOptions()
  .when.user.schedulesPublication({
    publishDate: '2024-03-15',
    publishTime: '09:00',
    timezone: 'EST',
    autoShare: {
      twitter: true,
      facebook: true,
      linkedin: true
    },
    newsletter: true
  })
  .when.user.clicksButton('Schedule Publication')
  .then.content.isScheduled()
  .then.calendar.hasScheduledPost()
  
  // Step 9: Publication and distribution
  .given.time.is('2024-03-15 09:00 EST')
  .when.scheduler.executesPublicationJob()
  .then.content.isPublished()
  .then.content.hasUrl('/articles/future-ai-web-development')
  .then.sitemap.isUpdated()
  .then.rss.isUpdated()
  .then.socialMedia.postsAreShared()
  .then.newsletter.includesArticle()
  .then.searchEngines.areNotified()
  
  // Step 10: Post-publication monitoring
  .given.time.passes(1, 'hour')
  .when.analytics.collectsData()
  .then.dashboard.showsTrafficMetrics()
  .then.dashboard.showsSocialEngagement()
  .when.user.navigatesTo('/admin/analytics/articles')
  .then.page.showsArticlePerformance({
    pageviews: expect.any(Number),
    uniqueVisitors: expect.any(Number),
    avgTimeOnPage: expect.any(Number),
    socialShares: expect.any(Number),
    comments: expect.any(Number)
  })
  .execute()
```

## Multi-tenant B2B Application Flow

### Enterprise Customer Onboarding

```javascript
// tests/flows/enterprise-onboarding.test.js
scenario('Enterprise multi-tenant customer onboarding')
  .given.application.supportsMultiTenancy()
  .given.user.isAuthenticated('admin@enterprise.com')
  .given.user.hasSuperAdminRole()
  .given.plans.hasEnterprisePlan({
    name: 'Enterprise',
    price: 'custom',
    features: ['multi-tenant', 'sso', 'api-access', 'custom-branding', 'dedicated-support']
  })
  
  // Step 1: Enterprise account creation
  .when.user.navigatesTo('/admin/tenants/new')
  .then.page.showsTenantCreationForm()
  .when.user.createsTenant({
    name: 'Acme Corporation',
    domain: 'acme.ourapp.com',
    subdomain: 'acme',
    plan: 'enterprise',
    adminEmail: 'admin@acme.com',
    billingEmail: 'billing@acme.com',
    maxUsers: 500,
    features: ['sso', 'api-access', 'custom-branding'],
    customizations: {
      primaryColor: '#FF6B35',
      logo: 'acme-logo.png',
      favicon: 'acme-favicon.ico'
    }
  })
  .when.user.clicksButton('Create Tenant')
  .then.api.createsTenant()
  .then.database.createsTenantSchema()
  .then.tenant.hasUniqueDatabase()
  .then.admin.receivesEmail('tenant-created')
  
  // Step 2: Tenant administrator setup
  .given.user.isAuthenticated('admin@acme.com')
  .given.user.accessesTenant('acme')
  .when.user.navigatesTo('https://acme.ourapp.com')
  .then.page.showsCustomBranding()
  .then.page.showsAcmeLogo()
  .then.page.hasCustomColors()
  .when.user.completesInitialSetup({
    companyInfo: {
      industry: 'Manufacturing',
      size: '1000-5000',
      country: 'United States'
    },
    preferences: {
      timezone: 'America/New_York',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY'
    }
  })
  .then.tenant.isConfigured()
  
  // Step 3: SSO configuration
  .when.user.navigatesTo('/admin/authentication/sso')
  .then.page.showsSSOConfiguration()
  .when.user.configuresSAML({
    provider: 'Azure AD',
    entityId: 'acme-ourapp',
    ssoUrl: 'https://login.microsoftonline.com/acme/saml2',
    certificate: 'saml-cert.pem',
    attributeMapping: {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
      firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'
    }
  })
  .when.user.testsSSOConnection()
  .then.sso.isConfiguredCorrectly()
  .then.sso.redirectsToProvider()
  .then.sso.authenticatesUser()
  .then.sso.returnsToApplication()
  
  // Step 4: User management and role setup
  .when.user.navigatesTo('/admin/users/roles')
  .then.page.showsRoleManagement()
  .when.user.createsCustomRoles([
    {
      name: 'Department Manager',
      permissions: ['read-reports', 'manage-team', 'approve-requests']
    },
    {
      name: 'Analyst',
      permissions: ['read-reports', 'create-dashboards', 'export-data']
    },
    {
      name: 'Viewer',
      permissions: ['read-reports']
    }
  ])
  .when.user.invitesUsers([
    { email: 'manager1@acme.com', role: 'Department Manager', department: 'Sales' },
    { email: 'manager2@acme.com', role: 'Department Manager', department: 'Marketing' },
    { email: 'analyst1@acme.com', role: 'Analyst', department: 'Sales' },
    { email: 'analyst2@acme.com', role: 'Analyst', department: 'Marketing' },
    { email: 'viewer1@acme.com', role: 'Viewer', department: 'Sales' }
  ])
  .then.api.sendsInvitations()
  .then.users.receiveInviteEmails()
  
  // Step 5: Data integration and API setup
  .when.user.navigatesTo('/admin/integrations')
  .then.page.showsAvailableIntegrations()
  .when.user.configuresAPIKeys({
    salesforce: 'sf_api_key_123',
    hubspot: 'hs_api_key_456',
    slack: 'slack_webhook_789'
  })
  .when.user.setupsDataSync({
    salesforce: {
      frequency: 'hourly',
      objects: ['accounts', 'opportunities', 'contacts']
    },
    hubspot: {
      frequency: 'daily',
      objects: ['contacts', 'deals', 'companies']
    }
  })
  .then.integrations.areConfigured()
  .then.api.beginsDataSync()
  
  // Step 6: Custom dashboard and reporting setup
  .when.user.navigatesTo('/admin/dashboards')
  .then.page.showsDashboardBuilder()
  .when.user.createsDashboard({
    name: 'Executive Dashboard',
    widgets: [
      { type: 'revenue-chart', timeframe: 'last-12-months' },
      { type: 'pipeline-funnel', source: 'salesforce' },
      { type: 'team-performance', department: 'sales' },
      { type: 'kpi-metrics', metrics: ['mrr', 'churn', 'cac'] }
    ],
    permissions: ['Department Manager', 'Admin'],
    autoRefresh: true
  })
  .when.user.createsDashboard({
    name: 'Sales Dashboard',
    widgets: [
      { type: 'deals-pipeline', assigned: 'current-user' },
      { type: 'activity-feed', type: 'sales-activities' },
      { type: 'quota-progress', period: 'current-quarter' }
    ],
    permissions: ['Analyst', 'Department Manager'],
    department: 'Sales'
  })
  .then.dashboards.areCreated()
  .then.widgets.displayRealTimeData()
  
  // Step 7: Notification and workflow setup
  .when.user.navigatesTo('/admin/notifications')
  .when.user.configuresNotifications([
    {
      trigger: 'large-deal-created',
      condition: 'deal_value > $100000',
      recipients: ['admin@acme.com'],
      channels: ['email', 'slack']
    },
    {
      trigger: 'quota-achievement',
      condition: 'monthly_quota >= 100%',
      recipients: ['team-managers'],
      channels: ['email']
    },
    {
      trigger: 'system-alert',
      condition: 'api_error_rate > 5%',
      recipients: ['it-team@acme.com'],
      channels: ['email', 'slack']
    }
  ])
  .then.notifications.areConfigured()
  
  // Step 8: Security and compliance setup
  .when.user.navigatesTo('/admin/security')
  .when.user.configuresSecurityPolicies({
    passwordPolicy: {
      minLength: 12,
      requireSpecialChars: true,
      requireNumbers: true,
      expiration: 90
    },
    sessionPolicy: {
      timeout: 480, // 8 hours
      maxConcurrentSessions: 3
    },
    ipWhitelist: ['203.0.113.0/24', '198.51.100.0/24'],
    twoFactorAuth: {
      required: true,
      methods: ['totp', 'sms']
    }
  })
  .when.user.enablesAuditLogging({
    events: ['login', 'data-access', 'config-changes', 'user-management'],
    retention: 365,
    exportFormat: 'json'
  })
  .then.security.isConfigured()
  .then.compliance.meetsRequirements()
  
  // Step 9: Go-live preparation and testing
  .when.user.navigatesTo('/admin/go-live')
  .then.page.showsGoLiveChecklist()
  .when.user.completesChecklist([
    'sso-configured',
    'users-invited', 
    'dashboards-created',
    'integrations-tested',
    'security-configured',
    'notifications-tested'
  ])
  .when.user.runsSystemHealthCheck()
  .then.system.passesHealthCheck()
  .when.user.schedulesGoLive('2024-03-20 08:00 EST')
  .then.system.isScheduledForLaunch()
  .then.stakeholders.receiveGoLiveNotification()
  
  // Step 10: Post-launch monitoring and support
  .given.time.is('2024-03-20 08:00 EST')
  .when.system.goesLive()
  .then.tenant.isActive()
  .then.users.canAccessSystem()
  .then.dashboards.showLiveData()
  .then.integrations.areSyncing()
  .when.user.monitorsSystemHealth()
  .then.metrics.showNormalOperation()
  .then.support.isNotified('tenant-launched')
  .then.customer.receivesWelcomeCall()
  .execute()
```

## Running Complex User Flows

### 1. Setup for Complex Flows:
```bash
# Create test data factories
mkdir tests/factories
# Create flow-specific setup
mkdir tests/flows/setup
```

### 2. Flow Test Configuration:
```javascript
// vitest.config.flows.js
export default defineConfig({
  test: {
    timeout: 120000, // 2 minutes for complex flows
    setupFiles: [
      'tests/setup/flow-setup.js'
    ],
    include: [
      'tests/flows/**/*.test.js'
    ]
  }
})
```

### 3. Run Complex Flows:
```bash
# Run all flow tests
pnpm test --config vitest.config.flows.js

# Run specific flow
pnpm test flows/ecommerce-purchase

# Run flows with detailed reporting
pnpm test flows/ --reporter=verbose
```

## Best Practices for Complex Flows

1. **Break Down Long Flows** - Use descriptive step comments
2. **Use Realistic Test Data** - Mirror production scenarios
3. **Test Error Recovery** - Include failure scenarios
4. **Mock External Services** - Control third-party dependencies
5. **Parallel Test Isolation** - Ensure flows don't interfere
6. **Performance Monitoring** - Track flow execution time
7. **Visual Documentation** - Create flow diagrams
8. **Stakeholder Review** - Validate flows with business users

---

**Next:** [Performance Testing](./performance.md) - Learn advanced performance testing patterns