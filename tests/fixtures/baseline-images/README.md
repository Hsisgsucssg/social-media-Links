# Visual Baseline Images Directory

This directory contains baseline screenshots for visual regression testing.

## Structure

```
baseline-images/
├── desktop/
│   ├── social-profile-desktop-full.png
│   ├── social-profile-card-desktop.png
│   ├── button-1-hover-desktop.png
│   ├── button-2-hover-desktop.png
│   ├── button-3-hover-desktop.png
│   ├── button-4-hover-desktop.png
│   └── button-5-hover-desktop.png
├── mobile/
│   ├── social-profile-mobile-full.png
│   ├── social-profile-card-mobile.png
│   ├── button-1-tapped-mobile.png
│   ├── button-2-tapped-mobile.png
│   ├── button-3-tapped-mobile.png
│   ├── button-4-tapped-mobile.png
│   └── button-5-tapped-mobile.png
├── tablet/
│   ├── social-profile-tablet-full.png
│   ├── social-profile-card-tablet.png
│   └── button-hover-tablet.png
└── cross-browser/
    ├── card-chromium.png
    ├── card-firefox.png
    └── card-webkit.png
```

## How to Generate Baselines

To generate baseline images for the first time or after intentional changes:

```bash
# Update all visual baselines
npm run test:visual:update

# Or run specific test with update flag
npx playwright test tests/visual/ --update-snapshots
```

## Baseline Management

### When to Update Baselines

1. **Initial Setup**: First time running tests
2. **Intentional Design Changes**: When you purposefully modify the visual design
3. **Bug Fixes**: When fixing visual regressions
4. **Major Updates**: Framework or dependency updates that affect rendering

### When NOT to Update Baselines

1. **Unintended Changes**: Random regressions or bugs
2. **Temporary Issues**: Browser rendering quirks
3. **Environment Differences**: CI/CD vs local development differences

### Version Control Strategy

- Baseline images should be committed to version control
- Use descriptive commit messages when updating baselines
- Consider reviewing visual changes before committing new baselines
- Use branches and pull requests for visual design changes

## Threshold Configuration

Visual comparison thresholds are configured in `playwright.config.ts`:

```typescript
expect: {
  threshold: 0.2, // 20% pixel difference tolerance
  toHaveScreenshot: {
    threshold: 0.2,
    mode: 'auto',
  },
}
```

Adjust thresholds based on:
- Browser rendering differences
- Anti-aliasing variations
- Font rendering differences
- Animation timing differences

## Debugging Visual Failures

When visual tests fail:

1. **Compare Images**: Look at the diff output in test results
2. **Check Thresholds**: Adjust if differences are negligible
3. **Review Changes**: Determine if differences are intentional
4. **Environment**: Check if it's a CI vs local environment issue

## Best Practices

1. **Consistent Environment**: Generate baselines on consistent OS/browser combinations
2. **Screenshot Timing**: Ensure consistent timing for animations and loading
3. **Viewport Consistency**: Use exact viewport sizes across test runs
4. **Image Optimization**: Use PNG for screenshots with good compression
5. **Clean Slate**: Reset page state before each screenshot

## Browser-Specific Considerations

- **Chrome/Chromium**: Most consistent across platforms
- **Firefox**: May have font rendering differences
- **Safari/WebKit**: iOS-specific rendering behaviors
- **Mobile Viewports**: Consider device pixel ratios

## File Naming Convention

Follow this pattern for baseline images:

```
{component}-{state}-{viewport}-{browser}.png

Examples:
- social-profile-card-desktop.png
- button-1-hover-mobile.png
- card-chromium.png
```

This ensures:
- Easy identification of test conditions
- Consistent organization
- Automated test matching
- Clear failure diagnostics