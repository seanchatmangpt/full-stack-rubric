# Publishing Guide for @nuxt/bdd

This document outlines the complete process for publishing the @nuxt/bdd package to npm.

## Pre-Publication Checklist

### 1. Package Verification

Before publishing, ensure all these items are complete:

- [ ] `package.json` is properly configured with correct metadata
- [ ] All source files are in `src/` directory
- [ ] Build configuration (`build.config.js`) is present
- [ ] `.npmignore` excludes development files
- [ ] `README.md` is comprehensive and up-to-date
- [ ] `CHANGELOG.md` is updated with current version
- [ ] TypeScript definitions are generated
- [ ] All tests pass
- [ ] Code is linted and formatted

### 2. Version Strategy

This package follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible  
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### 3. Build Process

The package uses [unbuild](https://github.com/unjs/unbuild) for building:

```bash
# Build the package
pnpm run build

# This generates:
# - dist/index.mjs (ES module)
# - dist/index.cjs (CommonJS)
# - dist/index.d.ts (TypeScript definitions)
# - dist/vitest.* (Vitest utilities)
# - dist/cucumber.* (Cucumber utilities)
```

## Publishing Workflow

### Method 1: Manual Publishing (Recommended for first release)

1. **Prepare the release:**
   ```bash
   cd vendors/nuxt-bdd
   
   # Install dependencies
   pnpm install
   
   # Run tests
   pnpm test
   
   # Build package
   pnpm build
   
   # Verify package contents
   npm pack --dry-run
   ```

2. **Update version:**
   ```bash
   # For patch release
   npm version patch
   
   # For minor release  
   npm version minor
   
   # For major release
   npm version major
   ```

3. **Publish to npm:**
   ```bash
   # Dry run first (recommended)
   npm publish --dry-run
   
   # If everything looks good, publish
   npm publish
   ```

### Method 2: Using Package Scripts

The package includes convenient scripts:

```bash
# Build and test, then publish
pnpm run release

# Dry run (test without actually publishing)
pnpm run release:dry

# Quick version bumps
pnpm run version:patch
pnpm run version:minor  
pnpm run version:major
```

### Method 3: Automated with GitHub Actions (Future)

For automated publishing, create `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm test
        
      - name: Build package
        run: pnpm build
        
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Package Validation

### Before Publishing

1. **Test installation locally:**
   ```bash
   npm pack
   cd ../test-project
   npm install ../nuxt-bdd/nuxt-bdd-1.0.0.tgz
   ```

2. **Verify exports work:**
   ```javascript
   // Test in a Node.js file
   import { defineBDDConfig } from '@nuxt/bdd'
   import { Given, When, Then } from '@nuxt/bdd/cucumber'
   import { mountBDD } from '@nuxt/bdd/vitest'
   
   console.log('All imports successful!')
   ```

3. **Check package size:**
   ```bash
   npm pack --dry-run
   # Ensure bundle size is reasonable (<100KB)
   ```

### After Publishing

1. **Verify on npmjs.com:**
   - Visit https://www.npmjs.com/package/@nuxt/bdd
   - Check metadata, README, and file contents

2. **Test installation:**
   ```bash
   npm install @nuxt/bdd
   # Test in a fresh project
   ```

## Security Considerations

### Package Access

The package is configured for public access:
```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

### Dependency Security

- All dependencies are actively maintained
- Regular security audits via `npm audit`
- Minimal dependency footprint

## Troubleshooting

### Common Publishing Issues

1. **403 Forbidden**: Check npm authentication
   ```bash
   npm whoami
   npm adduser
   ```

2. **Package name taken**: Update package name in `package.json`

3. **Version conflict**: Ensure version number is higher than published version

4. **Build errors**: Check build configuration and dependencies

5. **Missing files**: Verify `.npmignore` isn't excluding required files

### Recovery Procedures

If a bad version is published:

1. **Unpublish within 24 hours:**
   ```bash
   npm unpublish @nuxt/bdd@1.0.0
   ```

2. **Deprecate version:**
   ```bash
   npm deprecate @nuxt/bdd@1.0.0 "This version has issues, please upgrade"
   ```

3. **Publish hotfix:**
   ```bash
   npm version patch
   npm publish
   ```

## Post-Publication Tasks

1. **Update documentation**
2. **Create GitHub release**
3. **Notify users/communities**
4. **Update dependent packages**
5. **Monitor for issues**

## Support

For publishing issues:
- Check [npm documentation](https://docs.npmjs.com/)
- Review package logs
- Contact package maintainers
- Open issue in GitHub repository