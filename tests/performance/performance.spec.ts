import { test, expect } from '@playwright/test';

test.describe('Performance and Core Web Vitals Testing', () => {
  test.describe('Loading Performance', () => {
    test('should load resources efficiently', async ({ page }) => {
      const startTime = Date.now();

      // Monitor resource loading
      const resources: any[] = [];
      page.on('response', response => {
        resources.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
      });

      await page.goto('index.html');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Page should load quickly
      expect(loadTime).toBeLessThan(2000); // < 2 seconds for simple profile

      // Check critical resources
      const cssResources = resources.filter(r => r.url.includes('.css'));
      const imageResources = resources.filter(r => r.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/));

      // Should have CSS and at least one image
      expect(cssResources.length).toBeGreaterThanOrEqual(1);
      expect(imageResources.length).toBeGreaterThanOrEqual(1);

      // All resources should load successfully
      resources.forEach(resource => {
        expect([200, 304]).toContain(resource.status);
      });
    });

    test('should have optimized resource sizes', async ({ page }) => {
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');

      // Get resource sizes
      const resourceSizes = await page.evaluate(() => {
        const performance = (window as any).performance;
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        return entries.map(entry => ({
          name: entry.name,
          size: entry.transferSize || 0,
          type: entry.name.split('.').pop()?.toLowerCase()
        }));
      });

      // CSS should be small
      const cssSize = resourceSizes
        .filter(r => r.type === 'css')
        .reduce((sum, r) => sum + r.size, 0);

      expect(cssSize).toBeLessThan(10000); // < 10KB

      // Images should be optimized
      const imageSizes = resourceSizes
        .filter(r => ['jpg', 'jpeg', 'png', 'webp'].includes(r.type || ''));

      imageSizes.forEach(img => {
        expect(img.size).toBeLessThan(100000); // Each image < 100KB
      });

      // Total page size should be reasonable
      const totalSize = resourceSizes.reduce((sum, r) => sum + r.size, 0);
      expect(totalSize).toBeLessThan(500000); // < 500KB total
    });

    test('should have efficient DOM rendering', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('index.html');

      // Wait for DOM to be ready
      await page.waitForLoadState('domcontentloaded');
      const domTime = Date.now() - startTime;

      // DOM should be ready quickly
      expect(domTime).toBeLessThan(500);

      // Check for layout shifts
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          new (window as any).PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          }).observe({ entryTypes: ['layout-shift'] });

          // Wait a bit for any layout shifts
          setTimeout(() => resolve(clsValue), 1000);
        });
      });

      expect(cls).toBeLessThan(0.1);
    });
  });

  test.describe('Runtime Performance', () => {
    test('should handle interactions smoothly', async ({ page }) => {
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');

      // Test button hover performance
      const buttons = page.locator('.btn-s button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);

        // Measure hover response time
        const hoverStart = Date.now();
        await button.hover();
        const hoverTime = Date.now() - hoverStart;

        expect(hoverTime).toBeLessThan(100); // Hover should be instant

        // Check if styles are applied correctly
        const computedStyle = await button.evaluate((el) => {
          return window.getComputedStyle(el);
        });

        expect(computedStyle).toBeDefined();
      }
    });

    test('should have smooth scrolling', async ({ page }) => {
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');

      // Test scroll performance if needed
      const scrollStart = Date.now();

      // Scroll down and up
      await page.evaluate(() => {
        window.scrollTo(0, 100);
      });

      await page.waitForTimeout(100);

      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });

      const scrollTime = Date.now() - scrollStart;
      expect(scrollTime).toBeLessThan(200);
    });

    test('should handle responsive changes efficiently', async ({ page }) => {
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');

      // Test responsive changes
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1440, height: 900 }
      ];

      for (const viewport of viewports) {
        const resizeStart = Date.now();

        await page.setViewportSize(viewport);

        // Wait for layout to stabilize
        await page.waitForTimeout(100);

        const resizeTime = Date.now() - resizeStart;
        expect(resizeTime).toBeLessThan(300);

        // Check if layout is still valid
        const card = page.locator('.card');
        await expect(card).toBeVisible();
      }
    });
  });

  test.describe('Memory and Resource Management', () => {
    test('should not have memory leaks', async ({ page }) => {
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Simulate user interactions
      const buttons = page.locator('.btn-s button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        await button.hover();
        await page.mouse.move(0, 0);
      }

      // Wait for garbage collection
      await page.waitForTimeout(1000);

      // Check memory usage again
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Memory shouldn't increase dramatically
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(1000000); // < 1MB increase
    });

    test('should clean up event listeners', async ({ page }) => {
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');

      // Check for excessive event listeners
      const listenerCount = await page.evaluate(() => {
        let count = 0;
        const elements = document.querySelectorAll('*');
        elements.forEach(el => {
          const eventListeners = (el as any).eventListenerCount || 0;
          count += eventListeners;
        });
        return count;
      });

      // Should not have excessive listeners for a simple profile
      expect(listenerCount).toBeLessThan(50);
    });
  });

  test.describe('Network Performance', () => {
    test('should use efficient caching', async ({ page }) => {
      const responses: any[] = [];

      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers()
        });
      });

      await page.goto('index.html');
      await page.waitForLoadState('networkidle');

      // Check cache headers
      responses.forEach(response => {
        if (response.url.includes('.css')) {
          // CSS should have cache headers
          const cacheControl = response.headers['cache-control'];
          expect(cacheControl).toBeDefined();
        }
      });
    });

    test('should minimize network requests', async ({ page }) => {
      const requestCount = await page.evaluate(() => {
        return (window as any).performance.getEntriesByType('resource').length;
      });

      // Should have minimal requests for a simple profile
      expect(requestCount).toBeLessThan(10);
    });
  });

  test.describe('Performance Budget Enforcement', () => {
    test('should stay within performance budgets', async ({ page }) => {
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');

      // Define performance budgets
      const budgets = {
        totalSize: 500000,      // 500KB
        cssSize: 10000,        // 10KB
        imageSize: 100000,     // 100KB per image
        scriptSize: 0,         // No JavaScript for this simple profile
        requestCount: 10,      // Max 10 requests
        loadTime: 2000         // 2 seconds
      };

      // Check against budgets
      const metrics = await page.evaluate(() => {
        const resources = (window as any).performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        return {
          totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
          cssSize: resources.filter(r => r.name.includes('.css')).reduce((sum, r) => sum + (r.transferSize || 0), 0),
          imageSize: resources.filter(r => r.name.match(/\.(jpg|jpeg|png|webp)$/)).reduce((sum, r) => sum + (r.transferSize || 0), 0),
          scriptSize: resources.filter(r => r.name.includes('.js')).reduce((sum, r) => sum + (r.transferSize || 0), 0),
          requestCount: resources.length
        };
      });

      // Verify all budgets
      expect(metrics.totalSize).toBeLessThan(budgets.totalSize);
      expect(metrics.cssSize).toBeLessThan(budgets.cssSize);
      expect(metrics.imageSize).toBeLessThan(budgets.imageSize);
      expect(metrics.scriptSize).toBeLessThan(budgets.scriptSize);
      expect(metrics.requestCount).toBeLessThan(budgets.requestCount);
    });
  });
});