import { test, expect, devices } from '@playwright/test';

test.describe('Social Profile Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('index.html');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Desktop View (1440px)', () => {

    test('should display social profile card correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Take full page screenshot
      await expect(page).toHaveScreenshot('social-profile-desktop-full.png');

      // Take screenshot of just the card
      const card = page.locator('.card');
      await expect(card).toHaveScreenshot('social-profile-card-desktop.png');
    });

    test('should handle hover states on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Hover over each button and capture states
      const buttons = page.locator('.btn-s button');

      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        await button.hover();
        await expect(button).toHaveScreenshot(`button-${i + 1}-hover-desktop.png`);
        await page.mouse.move(0, 0); // Move mouse away
      }
    });

    test('should maintain layout stability on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Check initial layout
      await expect(page.locator('.card')).toHaveScreenshot('card-layout-initial-desktop.png');

      // Wait a bit and check again (for layout shift detection)
      await page.waitForTimeout(1000);
      await expect(page.locator('.card')).toHaveScreenshot('card-layout-stable-desktop.png');
    });
  });

  test.describe('Mobile View (375px)', () => {

    test('should display social profile card correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Take full page screenshot
      await expect(page).toHaveScreenshot('social-profile-mobile-full.png');

      // Take screenshot of just the card
      const card = page.locator('.card');
      await expect(card).toHaveScreenshot('social-profile-card-mobile.png');
    });

    test('should handle touch interactions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Test button touch states
      const buttons = page.locator('.btn-s button');

      for (let i = 0; i < await buttons.count(); i++) {
        const button = buttons.nth(i);
        await button.tap();
        // Capture tapped state
        await expect(button).toHaveScreenshot(`button-${i + 1}-tapped-mobile.png`);
      }
    });

    test('should maintain responsive design on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Check card dimensions
      const card = page.locator('.card');
      await expect(card).toHaveScreenshot('card-responsive-mobile.png');
    });
  });

  test.describe('Tablet View (768px)', () => {
    test('should display social profile card correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Take full page screenshot
      await expect(page).toHaveScreenshot('social-profile-tablet-full.png');

      // Take screenshot of just the card
      const card = page.locator('.card');
      await expect(card).toHaveScreenshot('social-profile-card-tablet.png');
    });

    test('should handle hover states on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Test button hover states on tablet
      const firstButton = page.locator('.btn-s button').first();
      await firstButton.hover();
      await expect(firstButton).toHaveScreenshot('button-hover-tablet.png');
    });
  });

  test.describe('Cross-browser Visual Consistency', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should look consistent in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        if (currentBrowser !== browserName) test.skip();

        await page.setViewportSize({ width: 1440, height: 900 });
        await expect(page.locator('.card')).toHaveScreenshot(`card-${browserName}.png`);
      });
    });
  });

  test.describe('Typography and Colors', () => {
    test('should maintain consistent typography across breakpoints', async ({ page }) => {
      const viewports = [
        { width: 375, name: 'mobile' },
        { width: 768, name: 'tablet' },
        { width: 1440, name: 'desktop' }
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: 800 });
        await expect(page.locator('.info')).toHaveScreenshot(`info-${viewport.name}.png`);
      }
    });

    test('should display correct colors and contrast', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Test color scheme consistency
      await expect(page.locator('.card')).toHaveScreenshot('color-scheme.png');
    });
  });

  test.describe('Image and Asset Loading', () => {
    test('should load avatar image correctly', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Wait for image to load
      const avatar = page.locator('.card img');
      await avatar.waitFor({ state: 'visible' });

      // Check if image is loaded properly
      const isLoaded = await avatar.evaluate((img) => {
        return img.complete && (img as HTMLImageElement).naturalHeight !== 0;
      });

      expect(isLoaded).toBe(true);
      await expect(avatar).toHaveScreenshot('avatar-loaded.png');
    });

    test('should handle broken images gracefully', async ({ page }) => {
      // This test ensures the page doesn't break if images fail to load
      await page.route('./assets/images/avatar-jessica.jpeg', route => {
        route.fulfill({ status: 404 });
      });

      await page.goto('index.html');
      await page.setViewportSize({ width: 1440, height: 900 });

      // Page should still render properly
      await expect(page.locator('.card')).toHaveScreenshot('avatar-broken.png');
    });
  });
});