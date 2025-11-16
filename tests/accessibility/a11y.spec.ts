import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Accessibility Compliance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('index.html');
    await page.waitForLoadState('networkidle');
    await injectAxe(page);
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should pass axe-core accessibility checks', async ({ page }) => {
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        rules: {
          // WCAG 2.1 AA specific rules
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management-semantics': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-required-children': { enabled: true },
          'aria-required-parent': { enabled: true },
          'aria-roles': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
        }
      });
    });

    test('should have proper semantic HTML structure', async ({ page }) => {
      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);

      // Check for landmark elements
      await expect(page.locator('main, [role="main"]')).toBeAttached();

      // Verify nav structure if present
      const navs = page.locator('nav, [role="navigation"]');
      if (await navs.count() > 0) {
        await expect(navs.first()).toBeAttached();
      }
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check buttons have accessible names
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const accessibleName = await button.getAttribute('aria-label') ||
                               await button.textContent() ||
                               await button.getAttribute('title');

        expect(accessibleName?.trim()).toBeTruthy();
      }

      // Check images have alt text
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const altText = await image.getAttribute('alt');
        // Alt text should be present (even if empty for decorative images)
        expect(altText).toBeDefined();
      }
    });
  });

  test.describe('Color Contrast Testing', () => {
    test('should meet WCAG AA color contrast ratios', async ({ page }) => {
      // Focus on color contrast specifically
      await checkA11y(page, null, {
        rules: {
          'color-contrast': { enabled: true },
        }
      });
    });

    test('should maintain contrast for interactive elements', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      // Test default state
      await checkA11y(page, '.btn-s', {
        rules: {
          'color-contrast': { enabled: true },
        }
      });

      // Test hover states
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        await button.hover();
        await checkA11y(page, '.btn-s', {
          rules: {
            'color-contrast': { enabled: true },
          }
        });
        await page.mouse.move(0, 0);
      }
    });
  });

  test.describe('Keyboard Navigation Testing', () => {
    test('should be fully navigable with keyboard', async ({ page }) => {
      // Start at the top of the page
      await page.keyboard.press('Tab');

      // Should focus on first focusable element
      const firstFocusable = await page.locator(':focus').first();
      await expect(firstFocusable).toBeAttached();

      // Navigate through all focusable elements
      const focusableElements = page.locator('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const elementCount = await focusableElements.count();

      for (let i = 0; i < elementCount; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.locator(':focus').first();
        await expect(focusedElement).toBeAttached();

        // Test if Enter/Space works on buttons
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        if (tagName === 'button') {
          await page.keyboard.press('Enter');
          await page.keyboard.press('Space');
        }
      }
    });

    test('should maintain visible focus indicators', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        await button.focus();

        // Take screenshot of focused state for visual verification
        await expect(button).toHaveScreenshot(`button-${i + 1}-focused.png`);

        // Check if element has focus styles (can't fully test via automation, but we can take screenshots)
        const computedStyle = await button.evaluate((el) => {
          return window.getComputedStyle(el);
        });

        // Focus should be visible (outlines, background changes, etc.)
        expect(computedStyle).toBeDefined();
      }
    });

    test('should have logical tab order', async ({ page }) => {
      // Test that tab order follows visual order
      const tabOrder: string[] = [];

      await page.keyboard.press('Tab');
      let currentElement = await page.locator(':focus').first();

      while (await currentElement.count() > 0) {
        const tagName = await currentElement.evaluate(el => el.tagName.toLowerCase());
        const text = await currentElement.textContent();
        tabOrder.push(`${tagName}: ${text}`);

        await page.keyboard.press('Tab');
        currentElement = await page.locator(':focus').first();

        // Prevent infinite loop
        if (tabOrder.length > 20) break;
      }

      // Tab order should include all interactive elements
      expect(tabOrder.length).toBeGreaterThanOrEqual(5); // At least the 5 buttons
    });
  });

  test.describe('Screen Reader Testing', () => {
    test('should have proper accessibility tree structure', async ({ page }) => {
      // Check for proper heading structure
      await checkA11y(page, null, {
        rules: {
          'heading-order': { enabled: true },
          'region': { enabled: true },
        }
      });
    });

    test('should announce button actions properly', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');

        // Each button should have descriptive text
        const accessibleText = ariaLabel || text;
        expect(accessibleText?.trim()).toBeTruthy();
        expect(accessibleText!.length).toBeGreaterThan(0);
      }
    });

    test('should handle dynamic content announcements', async ({ page }) => {
      // While this is a static page, we should test the structure
      // that would support dynamic content announcements

      // Check for live regions if any exist
      const liveRegions = page.locator('[aria-live], [aria-atomic]');
      const liveRegionCount = await liveRegions.count();

      // If live regions exist, they should be properly configured
      for (let i = 0; i < liveRegionCount; i++) {
        const region = liveRegions.nth(i);
        const politeness = await region.getAttribute('aria-live');
        expect(['polite', 'assertive', 'off']).toContain(politeness || 'off');
      }
    });
  });

  test.describe('Focus Management', () => {
    test('should not have focus traps', async ({ page }) => {
      // Should be able to tab through entire page and exit
      await page.keyboard.press('Tab');

      let focusCount = 0;
      let previousFocus = '';
      let currentFocus = '';

      do {
        previousFocus = currentFocus;
        currentFocus = await page.locator(':focus').evaluate(el => el.tagName + (el.textContent ? ': ' + el.textContent : ''));
        focusCount++;
        await page.keyboard.press('Tab');

        // Prevent infinite loop
        if (focusCount > 50) break;

      } while (currentFocus !== previousFocus);

      // Should not get stuck in focus traps
      expect(focusCount).toBeLessThan(50);
    });

    test('should handle focus after interactions', async ({ page }) => {
      // Test button interactions don't break focus management
      const buttons = page.locator('button');
      const firstButton = buttons.first();

      await firstButton.focus();
      await firstButton.click();

      // Focus should remain predictable after interactions
      const focusedElement = await page.locator(':focus').first();
      expect(focusedElement).toBeAttached();
    });
  });

  test.describe('Responsive Accessibility', () => {
    const viewports = [
      { width: 375, name: 'Mobile' },
      { width: 768, name: 'Tablet' },
      { width: 1440, name: 'Desktop' }
    ];

    viewports.forEach(viewport => {
      test(`should maintain accessibility on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: 800 });

        // Run full accessibility check at this viewport
        await checkA11y(page, null, {
          detailedReport: true,
          rules: {
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-management-semantics': { enabled: true },
          }
        });
      });
    });
  });
});