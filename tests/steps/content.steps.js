/**
 * @fileoverview Content validation step definitions following London School TDD
 * Focuses on content processing behavior and validation contract testing
 */

import { Given, When, Then } from 'cucumber';
import { expect } from 'vitest';
import { createMockContentManager, createMockMarkdownProcessor, createMockContentValidator } from '../framework/mocks/content-mocks.js';
import { BDDTestRunner } from '../framework/bdd-test-runner.js';

/**
 * Mock services for content management
 * Following London School approach - test content processing collaborations
 */
const mockContentManager = createMockContentManager();
const mockMarkdownProcessor = createMockMarkdownProcessor();
const mockContentValidator = createMockContentValidator();

/**
 * BDD test runner instance for content scenarios
 */
const testRunner = new BDDTestRunner('content');

// Content Loading & Processing
Given('content exists at path {string}', async function(contentPath) {
  this.contentPath = contentPath;
  this.mockContent = {
    path: contentPath,
    raw: '# Test Content\n\nThis is test content.',
    frontmatter: { title: 'Test', date: '2024-01-01' },
    body: 'This is test content.'
  };
  
  mockContentManager.getContent.mockResolvedValue(this.mockContent);
  mockContentManager.contentExists.mockReturnValue(true);
  
  // Verify content existence check
  expect(mockContentManager.contentExists).toHaveBeenCalledWith(contentPath);
});

Given('content does not exist at path {string}', async function(contentPath) {
  this.contentPath = contentPath;
  
  mockContentManager.getContent.mockRejectedValue(new Error('Content not found'));
  mockContentManager.contentExists.mockReturnValue(false);
  
  // Verify non-existence handling
  expect(mockContentManager.contentExists).toHaveBeenCalledWith(contentPath);
});

When('the system loads the content', async function() {
  try {
    this.loadedContent = await mockContentManager.getContent(this.contentPath);
  } catch (error) {
    this.contentError = error;
  }
  
  // Verify content loading attempt
  expect(mockContentManager.getContent).toHaveBeenCalledWith(this.contentPath);
});

When('the content is processed for display', async function() {
  mockMarkdownProcessor.process.mockResolvedValue({
    html: '<h1>Test Content</h1><p>This is test content.</p>',
    toc: [{ level: 1, text: 'Test Content', anchor: 'test-content' }],
    metadata: this.mockContent.frontmatter
  });
  
  this.processedContent = await mockMarkdownProcessor.process(this.loadedContent);
  
  // Verify content processing behavior
  expect(mockMarkdownProcessor.process).toHaveBeenCalledWith(this.loadedContent);
});

Then('the content should be loaded successfully', async function() {
  expect(this.loadedContent).toEqual(
    expect.objectContaining({
      path: this.contentPath,
      raw: expect.any(String),
      frontmatter: expect.any(Object)
    })
  );
  
  // Verify successful content loading
  expect(mockContentManager.cacheContent).toHaveBeenCalledWith(this.contentPath, this.loadedContent);
});

Then('the content should be rendered as HTML', async function() {
  expect(this.processedContent.html).toContain('<h1>Test Content</h1>');
  
  // Verify HTML rendering contract
  expect(mockMarkdownProcessor.renderToHTML).toHaveBeenCalledWith(this.loadedContent.raw);
});

// Markdown Processing & Syntax Highlighting
Given('markdown content with code blocks', async function() {
  this.markdownWithCode = `
# Code Example

\`\`\`javascript
function hello() {
  console.log('Hello, world!');
}
\`\`\`
  `;
  
  mockMarkdownProcessor.detectCodeBlocks.mockReturnValue([{
    language: 'javascript',
    code: "function hello() {\n  console.log('Hello, world!');\n}",
    startLine: 3,
    endLine: 5
  }]);
});

When('syntax highlighting is applied', async function() {
  mockMarkdownProcessor.applySyntaxHighlighting.mockResolvedValue({
    highlighted: true,
    languages: ['javascript'],
    html: '<pre><code class="language-javascript">function hello() {\n  console.log(\'Hello, world!\');\n}</code></pre>'
  });
  
  this.highlightedContent = await mockMarkdownProcessor.applySyntaxHighlighting(this.markdownWithCode);
  
  // Verify syntax highlighting behavior
  expect(mockMarkdownProcessor.applySyntaxHighlighting).toHaveBeenCalledWith(this.markdownWithCode);
});

Then('code blocks should be syntax highlighted', async function() {
  expect(this.highlightedContent.highlighted).toBe(true);
  expect(this.highlightedContent.languages).toContain('javascript');
  
  // Verify highlighting application
  expect(mockMarkdownProcessor.validateHighlighting).toHaveBeenCalledWith(this.highlightedContent);
});

// Content Validation & Schema Compliance
Given('content with frontmatter schema', async function() {
  this.contentSchema = {
    title: { type: 'string', required: true },
    date: { type: 'string', format: 'date', required: true },
    tags: { type: 'array', items: 'string', required: false }
  };
  
  this.validContent = {
    frontmatter: {
      title: 'Valid Title',
      date: '2024-01-01',
      tags: ['test', 'content']
    },
    body: 'Valid content body'
  };
  
  mockContentValidator.setSchema.mockReturnValue(true);
  mockContentValidator.validateAgainstSchema.mockReturnValue({
    valid: true,
    errors: []
  });
});

Given('content with invalid frontmatter', async function() {
  this.invalidContent = {
    frontmatter: {
      // Missing required title
      date: 'invalid-date-format',
      tags: 'should-be-array'
    },
    body: 'Content body'
  };
  
  mockContentValidator.validateAgainstSchema.mockReturnValue({
    valid: false,
    errors: [
      'title is required',
      'date format is invalid',
      'tags must be an array'
    ]
  });
});

When('content validation is performed', async function() {
  const contentToValidate = this.validContent || this.invalidContent;
  
  this.validationResult = mockContentValidator.validateAgainstSchema(
    contentToValidate,
    this.contentSchema
  );
  
  // Verify validation execution
  expect(mockContentValidator.validateAgainstSchema).toHaveBeenCalledWith(
    contentToValidate,
    this.contentSchema
  );
});

Then('validation should pass', async function() {
  expect(this.validationResult.valid).toBe(true);
  expect(this.validationResult.errors).toHaveLength(0);
  
  // Verify successful validation behavior
  expect(mockContentValidator.recordValidationSuccess).toHaveBeenCalled();
});

Then('validation should fail with errors', async function() {
  expect(this.validationResult.valid).toBe(false);
  expect(this.validationResult.errors.length).toBeGreaterThan(0);
  
  // Verify validation failure handling
  expect(mockContentValidator.handleValidationErrors).toHaveBeenCalledWith(this.validationResult.errors);
});

// Content Search & Indexing
Given('indexed content in the system', async function() {
  this.indexedContent = [
    { path: '/content/post1.md', title: 'First Post', body: 'Content about JavaScript' },
    { path: '/content/post2.md', title: 'Second Post', body: 'Content about Vue.js' },
    { path: '/content/post3.md', title: 'Third Post', body: 'Content about testing' }
  ];
  
  mockContentManager.getSearchIndex.mockReturnValue({
    documents: this.indexedContent,
    indexed: true,
    lastUpdated: Date.now()
  });
});

When('the user searches for {string}', async function(searchTerm) {
  this.searchTerm = searchTerm;
  
  const mockResults = this.indexedContent.filter(content => 
    content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.body.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  mockContentManager.search.mockResolvedValue({
    query: searchTerm,
    results: mockResults,
    total: mockResults.length,
    executionTime: 45
  });
  
  this.searchResults = await mockContentManager.search(searchTerm);
  
  // Verify search execution
  expect(mockContentManager.search).toHaveBeenCalledWith(searchTerm);
});

Then('relevant content should be returned', async function() {
  expect(this.searchResults.results.length).toBeGreaterThan(0);
  expect(this.searchResults.total).toBe(this.searchResults.results.length);
  
  // Verify search result processing
  expect(mockContentManager.processSearchResults).toHaveBeenCalledWith(this.searchResults);
});

Then('search results should be ranked by relevance', async function() {
  mockContentManager.rankResults.mockReturnValue({
    ranked: true,
    algorithm: 'tf-idf',
    results: this.searchResults.results
  });
  
  const rankedResults = mockContentManager.rankResults(this.searchResults.results, this.searchTerm);
  
  expect(rankedResults.ranked).toBe(true);
  
  // Verify ranking behavior
  expect(mockContentManager.rankResults).toHaveBeenCalledWith(
    this.searchResults.results,
    this.searchTerm
  );
});

// Content Caching & Performance
Given('content caching is enabled', async function() {
  this.cachingEnabled = true;
  
  mockContentManager.isCachingEnabled.mockReturnValue(true);
  mockContentManager.getCacheStats.mockReturnValue({
    enabled: true,
    hitRate: 0.85,
    size: '2.4MB',
    entries: 156
  });
});

When('frequently accessed content is requested', async function() {
  this.frequentContentPath = '/content/popular-post.md';
  
  mockContentManager.getCachedContent.mockResolvedValue({
    content: this.mockContent,
    cached: true,
    cacheHit: true,
    retrievalTime: 5
  });
  
  this.cachedResult = await mockContentManager.getCachedContent(this.frequentContentPath);
  
  // Verify cache utilization
  expect(mockContentManager.getCachedContent).toHaveBeenCalledWith(this.frequentContentPath);
});

Then('content should be served from cache', async function() {
  expect(this.cachedResult.cached).toBe(true);
  expect(this.cachedResult.cacheHit).toBe(true);
  expect(this.cachedResult.retrievalTime).toBeLessThan(10);
  
  // Verify cache serving behavior
  expect(mockContentManager.logCacheHit).toHaveBeenCalledWith(this.frequentContentPath);
});

// Content Generation & Templates
Given('a content template {string}', async function(templateName) {
  this.templateName = templateName;
  this.templateData = {
    name: templateName,
    fields: ['title', 'date', 'author', 'content'],
    schema: { title: 'string', date: 'date', author: 'string' }
  };
  
  mockContentManager.getTemplate.mockResolvedValue(this.templateData);
  
  // Verify template retrieval
  expect(mockContentManager.getTemplate).toHaveBeenCalledWith(templateName);
});

When('content is generated from the template', async function() {
  const templateValues = {
    title: 'Generated Post',
    date: '2024-01-15',
    author: 'Test Author',
    content: 'This is generated content.'
  };
  
  mockContentManager.generateFromTemplate.mockResolvedValue({
    generated: true,
    template: this.templateName,
    content: {
      frontmatter: {
        title: templateValues.title,
        date: templateValues.date,
        author: templateValues.author
      },
      body: templateValues.content
    }
  });
  
  this.generatedContent = await mockContentManager.generateFromTemplate(
    this.templateName,
    templateValues
  );
  
  // Verify content generation behavior
  expect(mockContentManager.generateFromTemplate).toHaveBeenCalledWith(
    this.templateName,
    templateValues
  );
});

Then('new content should be created following the template structure', async function() {
  expect(this.generatedContent.generated).toBe(true);
  expect(this.generatedContent.content.frontmatter).toEqual(
    expect.objectContaining({
      title: expect.any(String),
      date: expect.any(String),
      author: expect.any(String)
    })
  );
  
  // Verify template compliance
  expect(mockContentValidator.validateTemplateCompliance).toHaveBeenCalledWith(
    this.generatedContent.content,
    this.templateData.schema
  );
});

// Content Versioning & History
Given('content with version history', async function() {
  this.contentWithHistory = {
    path: '/content/versioned-post.md',
    currentVersion: 3,
    versions: [
      { version: 1, date: '2024-01-01', author: 'user1' },
      { version: 2, date: '2024-01-05', author: 'user2' },
      { version: 3, date: '2024-01-10', author: 'user1' }
    ]
  };
  
  mockContentManager.getVersionHistory.mockResolvedValue(this.contentWithHistory.versions);
  
  // Verify version history retrieval
  expect(mockContentManager.getVersionHistory).toHaveBeenCalledWith(this.contentWithHistory.path);
});

When('a previous version is requested', async function() {
  this.requestedVersion = 2;
  
  mockContentManager.getVersion.mockResolvedValue({
    version: this.requestedVersion,
    content: {
      frontmatter: { title: 'Old Title' },
      body: 'Old content body'
    },
    metadata: {
      author: 'user2',
      date: '2024-01-05'
    }
  });
  
  this.versionContent = await mockContentManager.getVersion(
    this.contentWithHistory.path,
    this.requestedVersion
  );
  
  // Verify version retrieval behavior
  expect(mockContentManager.getVersion).toHaveBeenCalledWith(
    this.contentWithHistory.path,
    this.requestedVersion
  );
});

Then('the specific version should be returned', async function() {
  expect(this.versionContent.version).toBe(this.requestedVersion);
  expect(this.versionContent.content).toEqual(
    expect.objectContaining({
      frontmatter: expect.any(Object),
      body: expect.any(String)
    })
  );
  
  // Verify version validation
  expect(mockContentValidator.validateVersion).toHaveBeenCalledWith(this.versionContent);
});

/**
 * Cleanup and teardown
 */
After(async function() {
  // Reset all content mocks after each scenario
  jest.clearAllMocks();
  
  // Clean up test runner
  await testRunner.cleanup();
});