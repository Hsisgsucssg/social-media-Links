# Testing Documentation

## Overview

This project has comprehensive testing infrastructure covering visual regression, accessibility, HTML validation, and performance testing using Playwright.

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:visual
npm run test:a11y
npm run test:performance
npm run test:validation

# Run tests with UI for debugging
npm run test:ui

# Update visual baselines
npm run test:visual:update

# Run tests headed (show browser)
npm run test:headed

# Run in debug mode
npm run test:debug

# View test report
npm run test:report
```

## Test Categories

### 1. Visual Regression Tests (`tests/visual/`)

**Purpose**: Catch unintended visual changes across different screen sizes and browsers

**Coverage**:
- Desktop (1440px)
- Mobile (375px)
- Tablet (768px)
- Cross-browser consistency
- Button hover states
- Typography and colors
- Image loading

**Key Files**:
- `tests/visual/social-profile.spec.ts` - Main visual tests
- `tests/setup/visual-setup.ts` - Visual testing environment setup

### 2. Accessibility Tests (`tests/accessibility/`)

**Purpose**: Ensure WCAG 2.1 AA compliance and screen reader compatibility

**Coverage**:
- axe-core accessibility violations
- Semantic HTML structure
- ARIA labels and roles
- Color contrast ratios
- Keyboard navigation
- Focus management

**Key Files**:
- `tests/accessibility/a11y.spec.ts` - Comprehensive accessibility testing

### 3. HTML Validation Tests (`tests/validation/`)

**Purpose**: Validate HTML quality, standards compliance, and structure

**Coverage**:
- W3C HTML validation
- Meta tags verification
- Image alt text validation
- Link href verification
- Semantic structure
- Form accessibility

**Key Files**:
- `tests/validation/html.spec.ts` - HTML validation and quality checks

### 4. Performance Tests (`tests/performance/`)

**Purpose**: Monitor loading speed, Core Web Vitals, and optimization

**Coverage**:
- Lighthouse performance scores
- Core Web Vitals metrics
- Resource optimization
- Loading time benchmarks
- Memory usage
- Network performance

**Key Files**:
- `tests/performance/performance.spec.ts` - Performance and Lighthouse testing

## Test Configuration

### Playwright Configuration (`playwright.config.ts`)

**Browsers Tested**:
- Chromium (Chrome)
- Firefox
- WebKit (Safari)

**Viewports**:
- Mobile: 375×667px (Pixel 5)
- Tablet: 768×1024px (iPad Pro)
- Desktop: 1440×900px

**Features**:
- Automatic screenshots on failure
- Video recording on failure
- Trace collection on retry
- Visual comparison with thresholds
- Parallel test execution

## Test Utilities

### Test Helpers (`tests/utils/test-helpers.ts`)

Common utilities for testing:
- Viewport management
- Screenshot functions
- Color contrast testing
- Keyboard accessibility
- Performance metrics
- DOM statistics
- Responsive testing helpers

### Mock Data (`tests/mocks/social-links.json`)

Test data for:
- Social media platform definitions
- URL patterns
- Button state expectations
- Accessibility requirements
- Edge cases and variations

## Performance Benchmarks

### Core Web Vitals Targets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Total Blocking Time**: < 200ms

### Lighthouse Score Targets
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

### Resource Budgets
- **Total page size**: < 500KB
- **CSS size**: < 10KB
- **Image size**: < 100KB per image
- **Request count**: < 10 requests

## Continuous Integration

### GitHub Actions Workflow

**Triggers**:
- Pull requests to main
- Push to main
- Manual workflow dispatch

**Test Matrix**:
- OS: Ubuntu, Windows, macOS
- Browsers: Chromium, Firefox, Safari
- Viewports: Mobile, Desktop, Tablet

**Jobs**:
1. **test**: Cross-platform testing
2. **performance**: Performance benchmarks
3. **cross-browser**: Visual consistency
4. **accessibility-report**: Accessibility compliance
5. **security-audit**: Dependency security
6. **comment-pr**: Test results on PR

### Artifacts and Reports

Test results are uploaded as artifacts:
- Test screenshots and videos
- Performance reports
- Accessibility audit results
- HTML validation reports

## Visual Testing

### Baseline Management

**Generating Baselines**:
```bash
npm run test:visual:update
```

**Updating Specific Tests**:
```bash
npx playwright test tests/visual/social-profile.spec.ts --update-snapshots
```

**Threshold Configuration**:
- Default threshold: 0.2 (20% pixel difference)
- Adjustable per test in `playwright.config.ts`

### Screenshot Naming

Pattern: `{component}-{state}-{viewport}-{browser}.png`

Examples:
- `social-profile-card-desktop.png`
- `button-1-hover-mobile.png`
- `card-chromium.png`

## Accessibility Testing

### WCAG 2.1 AA Compliance

Tests cover:
- **Perceivable**: Color contrast, alt text, readable content
- **Operable**: Keyboard navigation, focus management
- **Understandable**: Clear labels, logical structure
- **Robust**: Semantic HTML, ARIA support

### Manual Verification

While automated testing covers most cases, manual testing is recommended for:
- Screen reader compatibility
- Real keyboard usage
- Voice control testing
- Cognitive load assessment

## Performance Monitoring

### Metrics Tracked

- **Loading Performance**: FCP, LCP, Speed Index
- **Interactivity**: TBT, FID
- **Visual Stability**: CLS
- **Resource Optimization**: Bundle sizes, image optimization

### Optimization Tips

Based on test results:
1. **Image Optimization**: Use WebP format, proper sizing
2. **CSS Minification**: Remove unused styles
3. **Font Loading**: Optimize font loading strategies
4. **Caching**: Implement proper cache headers

## Debugging

### Common Issues

**Visual Test Failures**:
1. Check if changes are intentional
2. Verify environment consistency
3. Adjust thresholds if needed
4. Review anti-aliasing differences

**Performance Test Failures**:
1. Check network conditions
2. Verify resource loading
3. Review Core Web Vitals thresholds
4. Optimize assets

**Accessibility Test Failures**:
1. Review axe-core violations
2. Check color contrast
3. Verify keyboard navigation
4. Add proper ARIA labels

### Test Debugging

```bash
# Run specific test with debugging
npx playwright test tests/visual/social-profile.spec.ts --debug

# Run with UI mode
npx playwright test --ui

# Run with headed mode (show browser)
npx playwright test --headed

# Generate trace file
npx playwright test --trace on
```

## Maintenance

### Regular Updates

1. **Dependency Updates**: Keep testing tools updated
2. **Browser Versions**: Update Playwright browsers regularly
3. **Baseline Images**: Update after intentional design changes
4. **Thresholds**: Adjust based on project evolution

### Test Maintenance

- Review test coverage regularly
- Update test data when features change
- Optimize test performance
- Remove obsolete tests
- Add tests for new features

## Contributing Guidelines

### Adding New Tests

1. Follow existing patterns in test files
2. Use test helpers from `tests/utils/test-helpers.ts`
3. Add appropriate assertions and error messages
4. Update mock data if needed
5. Document new test coverage

### Test Naming

- Use descriptive test names
- Follow consistent naming patterns
- Group related tests in `describe` blocks
- Include test purpose in comments

### Code Quality

- Use TypeScript for type safety
- Follow Playwright best practices
- Handle async/await properly
- Include proper cleanup in tests

## Troubleshooting

### Installation Issues

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reinstall Playwright
npx playwright install --force
```

### Browser Issues

```bash
# Install specific browsers
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit

# Install system dependencies
npx playwright install-deps
```

### Test Environment

```bash
# Verify installation
npx playwright --version

# Check browser installation
npx playwright install --dry-run

# Test basic functionality
npx playwright test --list
```

## Support and Resources

- [Playwright Documentation](https://playwright.dev/)
- [axe-core Documentation](https://www.deque.com/axe/core-documentation/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

For issues specific to this project's test setup, please create an issue in the repository.