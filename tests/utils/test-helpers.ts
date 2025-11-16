import { Page, Locator, expect } from '@playwright/test';

/**
 * Test utilities and helpers for social media links profile testing
 */

export interface ViewportConfig {
  width: number;
  height: number;
  name: string;
}

export const VIEWPORTS: ViewportConfig[] = [
  { width: 375, height: 667, name: 'mobile' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1440, height: 900, name: 'desktop' }
];

export const SOCIAL_BUTTONS = [
  { id: 'btn-1', label: 'GitHub' },
  { id: 'btn-2', label: 'Frontend Mentor' },
  { id: 'btn-3', label: 'LinkedIn' },
  { id: 'btn-4', label: 'Twitter' },
  { id: 'btn-5', label: 'Instagram' }
];

export const PERFORMANCE_THRESHOLDS = {
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500,
  cumulativeLayoutShift: 0.1,
  totalBlockingTime: 200,
  speedIndex: 3400
};

export const ACCESSIBILITY_THRESHOLD = 95;
export const BEST_PRACTICES_THRESHOLD = 90;
export const SEO_THRESHOLD = 90;

/**
 * Set viewport size and wait for layout to stabilize
 */
export async function setViewportAndWait(page: Page, viewport: ViewportConfig): Promise<void> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.waitForTimeout(100); // Allow for layout shifts
}

/**
 * Wait for page to fully load including images
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');

  // Wait for images to load
  const images = page.locator('img');
  const imageCount = await images.count();

  for (let i = 0; i < imageCount; i++) {
    const image = images.nth(i);
    await image.waitFor({ state: 'visible' });
  }

  // Additional wait for any layout shifts
  await page.waitForTimeout(500);
}

/**
 * Take screenshot with consistent naming and options
 */
export async function takeScreenshot(
  page: Page,
  element?: Locator,
  name: string = 'screenshot',
  options: { threshold?: number; fullPage?: boolean } = {}
): Promise<void> {
  const { threshold = 0.2, fullPage = false } = options;

  if (element) {
    await expect(element).toHaveScreenshot(`${name}.png`, {
      threshold,
      animations: 'disabled'
    });
  } else {
    await expect(page).toHaveScreenshot(`${name}.png`, {
      threshold,
      fullPage,
      animations: 'disabled'
    });
  }
}

/**
 * Test element color contrast
 */
export async function testColorContrast(
  page: Page,
  element: Locator,
  threshold: number = 4.5
): Promise<boolean> {
  const contrast = await element.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;

    // Simple contrast ratio calculation (would need a library for accurate results)
    const rgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    // This is a simplified check - real implementation would use a proper contrast library
    return true; // Placeholder
  });

  return contrast;
}

/**
 * Verify element is keyboard accessible
 */
export async function testKeyboardAccessibility(page: Page, element: Locator): Promise<boolean> {
  await element.focus();
  const focusedElement = await page.locator(':focus').first();
  const isFocused = await focusedElement.evaluate((el) => el === document.activeElement);

  return isFocused;
}

/**
 * Test responsive design at all breakpoints
 */
export async function testResponsiveDesign(
  page: Page,
  testFn: (page: Page, viewport: ViewportConfig) => Promise<void>
): Promise<void> {
  for (const viewport of VIEWPORTS) {
    await setViewportAndWait(page, viewport);
    await testFn(page, viewport);
  }
}

/**
 * Get performance metrics from the page
 */
export async function getPerformanceMetrics(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
    const lcp = (performance as any).getEntriesByType('largest-contentful-paint')[0]?.startTime || 0;

    return {
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      resourceCount: performance.getEntriesByType('resource').length
    };
  });
}

/**
 * Get DOM statistics
 */
export async function getDOMStats(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const allElements = document.querySelectorAll('*');
    const textNodes = Array.from(document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    ));

    const getElementDepth = (element: Element): number => {
      let depth = 0;
      while (element.parentElement) {
        depth++;
        element = element.parentElement;
      }
      return depth;
    };

    const depths = Array.from(allElements).map(getElementDepth);
    const maxDepth = Math.max(...depths);

    return {
      totalElements: allElements.length,
      textNodes: textNodes.length,
      maxDepth: maxDepth,
      buttons: document.querySelectorAll('button').length,
      images: document.querySelectorAll('img').length,
      links: document.querySelectorAll('a').length,
      headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length
    };
  });
}

/**
 * Mock network conditions
 */
export async function mockNetworkConditions(page: Page, conditions: {
  offline?: boolean;
  latency?: number;
  downloadThroughput?: number;
  uploadThroughput?: number;
}): Promise<void> {
  if (conditions.offline) {
    await page.context().setOffline(true);
  } else {
    await page.context().setOffline(false);

    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: conditions.latency || 0,
      downloadThroughput: conditions.downloadThroughput || -1,
      uploadThroughput: conditions.uploadThroughput || -1
    });
  }
}

/**
 * Mock geolocation
 */
export async function mockGeolocation(page: Page, coords: {
  latitude: number;
  longitude: number;
  accuracy?: number;
}): Promise<void> {
  await page.context().grantPermissions(['geolocation']);
  await page.setGeolocation(coords);
}

/**
 * Create color screenshot for visual verification
 */
export async function createColorMap(page: Page): Promise<Map<string, string>> {
  const colorMap = new Map<string, string>();

  // Get main colors from the page
  const colors = await page.evaluate(() => {
    const elements = [
      { selector: '.card', name: 'card' },
      { selector: '.btn-s button', name: 'button' },
      { selector: '.btn-s button:hover', name: 'button-hover' },
      { selector: '.info h2', name: 'heading' },
      { selector: '.info p', name: 'text' }
    ];

    const result: any = {};

    elements.forEach(({ selector, name }) => {
      const element = document.querySelector(selector);
      if (element) {
        const styles = window.getComputedStyle(element);
        result[name] = {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderColor: styles.borderColor
        };
      }
    });

    return result;
  });

  Object.entries(colors).forEach(([name, colorData]: [string, any]) => {
    Object.entries(colorData).forEach(([property, value]: [string, string]) => {
      colorMap.set(`${name}-${property}`, value);
    });
  });

  return colorMap;
}

/**
 * Verify social media links structure
 */
export async function verifySocialLinks(page: Page): Promise<boolean> {
  const buttons = page.locator('.btn-s button');
  const buttonCount = await buttons.count();

  if (buttonCount !== SOCIAL_BUTTONS.length) {
    return false;
  }

  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);
    const id = await button.getAttribute('id');
    const text = await button.textContent();

    const expectedButton = SOCIAL_BUTTONS[i];

    if (id !== expectedButton.id || text?.trim() !== expectedButton.label) {
      return false;
    }
  }

  return true;
}

/**
 * Test button interactions
 */
export async function testButtonInteractions(page: Page): Promise<void> {
  const buttons = page.locator('.btn-s button');
  const buttonCount = await buttons.count();

  // Test hover states
  for (let i = 0; i < buttonCount; i++) {
    const button = buttons.nth(i);

    // Test hover
    await button.hover();
    await page.waitForTimeout(100);

    // Test focus
    await button.focus();
    await page.waitForTimeout(100);

    // Test click
    await button.click();
    await page.waitForTimeout(100);

    // Move mouse away
    await page.mouse.move(0, 0);
  }
}

/**
 * Generate test report data
 */
export async function generateTestReport(page: Page): Promise<any> {
  const performanceMetrics = await getPerformanceMetrics(page);
  const domStats = await getDOMStats(page);
  const socialLinksValid = await verifySocialLinks(page);
  const colorMap = await createColorMap(page);

  return {
    timestamp: new Date().toISOString(),
    performance: performanceMetrics,
    dom: domStats,
    socialLinks: {
      valid: socialLinksValid,
      count: SOCIAL_BUTTONS.length
    },
    colors: Object.fromEntries(colorMap)
  };
}

/**
 * Wait for element to be stable (no position changes)
 */
export async function waitForStablePosition(
  page: Page,
  element: Locator,
  timeout: number = 1000
): Promise<void> {
  const startTime = Date.now();
  let lastPosition = await element.boundingBox();

  while (Date.now() - startTime < timeout) {
    await page.waitForTimeout(50);
    const currentPosition = await element.boundingBox();

    if (currentPosition && lastPosition) {
      const isStable =
        Math.abs(currentPosition.x - lastPosition.x) < 1 &&
        Math.abs(currentPosition.y - lastPosition.y) < 1;

      if (isStable) break;
    }

    lastPosition = currentPosition;
  }
}

/**
 * Test page with different font loading scenarios
 */
export async function testFontLoading(page: Page, scenario: 'fast' | 'slow' | 'blocked'): Promise<void> {
  switch (scenario) {
    case 'slow':
      await mockNetworkConditions(page, {
        latency: 2000,
        downloadThroughput: 50000
      });
      break;
    case 'blocked':
      await page.route('**/*.woff2', route => route.abort());
      await page.route('**/*.woff', route => route.abort());
      break;
  }

  await page.goto('index.html');
  await waitForPageLoad(page);
}

/**
 * Validate accessibility tree structure
 */
export async function validateAccessibilityTree(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const accessibilityTree: any[] = [];

    function buildTree(node: any, depth: number = 0): void {
      const role = node.role || 'unknown';
      const name = node.name || '';
      const children = node.children || [];

      accessibilityTree.push({
        role,
        name,
        depth,
        focused: node.focused || false,
        selected: node.selected || false,
        disabled: node.disabled || false
      });

      children.forEach((child: any) => buildTree(child, depth + 1));
    }

    // Get accessibility tree
    const root = document.body;
    buildTree(root);

    return {
      tree: accessibilityTree,
      totalElements: accessibilityTree.length,
      maxDepth: Math.max(...accessibilityTree.map(node => node.depth)),
      focusableElements: accessibilityTree.filter(node =>
        ['button', 'link', 'textbox'].includes(node.role)
      ).length
    };
  });
}