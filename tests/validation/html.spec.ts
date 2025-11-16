import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';

test.describe('HTML Validation and Quality Tests', () => {
  let htmlContent: string;

  test.beforeAll(async () => {
    // Read the HTML file for validation
    const htmlPath = resolve(__dirname, '../../index.html');
    htmlContent = readFileSync(htmlPath, 'utf8');
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('index.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('W3C HTML Validation', () => {
    test('should have valid HTML5 document structure', async ({ page }) => {
      // Check for proper DOCTYPE
      await expect(page.locator('html')).toBeAttached();

      const doctype = await page.evaluate(() => {
        return document.doctype?.name;
      });
      expect(doctype).toBe('html');
    });

    test('should have proper document metadata', async ({ page }) => {
      // Check charset
      const charset = await page.locator('meta[charset]').getAttribute('charset');
      expect(charset).toBe('UTF-8');

      // Check viewport meta tag
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      expect(viewport).toContain('width=device-width');
      expect(viewport).toContain('initial-scale=1');

      // Check language attribute
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('en');
    });

    test('should have proper page title', async ({ page }) => {
      const title = await page.title();
      expect(title).toBe('Frontend Mentor | Social links profile');
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThan(60); // SEO best practice
    });

    test('should have valid head structure', async ({ page }) => {
      // Check for essential head elements
      await expect(page.locator('head')).toBeAttached();
      await expect(page.locator('meta[charset]')).toBeAttached();
      await expect(page.locator('meta[name="viewport"]')).toBeAttached();
      await expect(page.locator('title')).toBeAttached();

      // Check for CSS link
      const cssLink = page.locator('link[rel="stylesheet"]');
      await expect(cssLink).toBeAttached();

      const href = await cssLink.getAttribute('href');
      expect(href).toBe('style.css');
    });

    test('should have valid body structure', async ({ page }) => {
      // Check main content exists
      await expect(page.locator('body')).toBeAttached();
      await expect(page.locator('.card')).toBeAttached();
      await expect(page.locator('.info')).toBeAttached();
      await expect(page.locator('.btn-s')).toBeAttached();
    });
  });

  test.describe('Semantic HTML Structure', () => {
    test('should use appropriate semantic elements', async ({ page }) => {
      // Check for semantic HTML5 elements where appropriate
      const body = await page.locator('body').innerHTML();

      // While this is a simple profile card, we should check for proper structure
      await expect(page.locator('.card')).toBeAttached();

      // Info section should be properly structured
      const info = page.locator('.info');
      await expect(info).toBeAttached();

      // Should contain heading for main content
      await expect(page.locator('h2')).toBeAttached();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();

      if (headingCount > 0) {
        // Get heading levels
        const levels: number[] = [];
        for (let i = 0; i < headingCount; i++) {
          const tag = await headings.nth(i).evaluate(el => el.tagName);
          levels.push(parseInt(tag.charAt(1)));
        }

        // Check for proper heading order (no skipping levels)
        for (let i = 1; i < levels.length; i++) {
          expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
        }
      }
    });

    test('should have proper list structure for navigation', async ({ page }) => {
      // While this uses buttons, we should check if there are any lists present
      const lists = page.locator('ul, ol, dl');
      const listCount = await lists.count();

      if (listCount > 0) {
        // Any lists should have proper list items
        for (let i = 0; i < listCount; i++) {
          const list = lists.nth(i);
          const listItems = list.locator('li');
          const itemCount = await listItems.count();
          expect(itemCount).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Image Validation', () => {
    test('should have proper image attributes', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);

        // Check alt text exists
        const alt = await image.getAttribute('alt');
        expect(alt).toBeDefined();

        // Check src attribute
        const src = await image.getAttribute('src');
        expect(src).toBeTruthy();
        expect(src!.length).toBeGreaterThan(0);

        // Check if image loads properly
        const naturalWidth = await image.evaluate(img => (img as HTMLImageElement).naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
      }
    });

    test('should have accessible image file paths', async ({ page }) => {
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const src = await image.getAttribute('src');

        if (src) {
          // Check for relative paths (good practice)
          expect(src.startsWith('./') || src.startsWith('../') || !src.startsWith('http')).toBeTruthy();

          // Check for valid image extensions
          const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
          const hasValidExtension = validExtensions.some(ext => src.toLowerCase().endsWith(ext));
          expect(hasValidExtension).toBeTruthy();
        }
      }
    });
  });

  test.describe('Link Validation', () => {
    test('should have valid link structures', async ({ page }) => {
      const links = page.locator('a');
      const linkCount = await links.count();

      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);

        // Check href attribute
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href!.length).toBeGreaterThan(0);

        // Check if link has accessible text
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const accessibleText = text || ariaLabel;
        expect(accessibleText?.trim()).toBeTruthy();
      }
    });

    test('should open external links in new tabs appropriately', async ({ page }) => {
      const externalLinks = page.locator('a[target="_blank"]');
      const externalCount = await externalLinks.count();

      for (let i = 0; i < externalCount; i++) {
        const link = externalLinks.nth(i);
        const href = await link.getAttribute('href');

        if (href && href.startsWith('http')) {
          // Should have security attributes for external links
          const rel = await link.getAttribute('rel');
          expect(rel).toContain('noopener');
          expect(rel).toContain('noreferrer');
        }
      }
    });
  });

  test.describe('Form Validation', () => {
    test('should have valid form structures', async ({ page }) => {
      const forms = page.locator('form');
      const formCount = await forms.count();

      for (let i = 0; i < formCount; i++) {
        const form = forms.nth(i);

        // Forms should have accessible controls
        const controls = form.locator('input, select, textarea, button');
        const controlCount = await controls.count();
        expect(controlCount).toBeGreaterThan(0);
      }
    });

    test('should have accessible button elements', async ({ page }) => {
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);

        // Buttons should have accessible text
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const accessibleText = text || ariaLabel;
        expect(accessibleText?.trim()).toBeTruthy();
        expect(accessibleText!.length).toBeGreaterThan(0);

        // Buttons should be keyboard accessible
        const disabled = await button.isDisabled();
        if (!disabled) {
          await button.focus();
          const focused = await page.locator(':focus').first();
          await expect(focused).toBeAttached();
        }
      }
    });
  });

  test.describe('CSS Validation', () => {
    test('should have valid CSS links', async ({ page }) => {
      const cssLinks = page.locator('link[rel="stylesheet"]');
      const linkCount = await cssLinks.count();

      for (let i = 0; i < linkCount; i++) {
        const link = cssLinks.nth(i);
        const href = await link.getAttribute('href');

        expect(href).toBeTruthy();
        expect(href!.length).toBeGreaterThan(0);

        // Check for valid CSS file extensions
        expect(href!.toLowerCase()).toMatch(/\.css$/);
      }
    });

    test('should not have inline styles that could override accessibility', async ({ page }) => {
      // Check for inline styles that might interfere with accessibility
      const elementsWithInlineStyles = await page.locator('[style]').count();

      // While inline styles aren't inherently bad, they shouldn't override accessibility
      if (elementsWithInlineStyles > 0) {
        const styledElements = page.locator('[style]');
        for (let i = 0; i < await styledElements.count(); i++) {
          const element = styledElements.nth(i);
          const style = await element.getAttribute('style');

          // Should not hide focus or override important accessibility styles
          expect(style?.toLowerCase()).not.toContain('display: none');
          expect(style?.toLowerCase()).not.toContain('visibility: hidden');
        }
      }
    });
  });

  test.describe('Performance Validation', () => {
    test('should have efficient DOM structure', async ({ page }) => {
      // Check for excessive DOM depth
      const maxDepth = await page.evaluate(() => {
        function getElementDepth(element: Element): number {
          let depth = 0;
          while (element.parentElement) {
            depth++;
            element = element.parentElement;
          }
          return depth;
        }

        const allElements = document.querySelectorAll('*');
        return Math.max(...Array.from(allElements).map(getElementDepth));
      });

      expect(maxDepth).toBeLessThan(20); // Reasonable depth limit

      // Check for total number of elements (should be efficient for a profile card)
      const elementCount = await page.locator('*').count();
      expect(elementCount).toBeLessThan(200); // Should be quite simple
    });

    test('should have appropriate file sizes', async ({ page }) => {
      // This is a basic check - in a real scenario, you'd check actual file sizes
      const htmlSize = htmlContent.length;
      expect(htmlSize).toBeLessThan(50000); // HTML should be under 50KB for a simple profile

      // Check CSS exists and is reasonable
      const cssResponse = await page.goto('style.css');
      if (cssResponse) {
        const cssSize = (await cssResponse.text()).length;
        expect(cssSize).toBeLessThan(10000); // CSS should be under 10KB
      }
    });
  });

  test.describe('Content Validation', () => {
    test('should have meaningful content', async ({ page }) => {
      // Check for meaningful text content
      const textContent = await page.locator('body').textContent();
      expect(textContent?.trim()).toBeTruthy();
      expect(textContent!.length).toBeGreaterThan(10);

      // Should not have placeholder text
      expect(textContent?.toLowerCase()).not.toContain('lorem ipsum');
      expect(textContent?.toLowerCase()).not.toContain('placeholder text');
    });

    test('should have appropriate content structure', async ({ page }) => {
      // Check for proper title hierarchy
      await expect(page.locator('h2')).toBeAttached();

      // Check for descriptive content
      const profileInfo = page.locator('.info');
      await expect(profileInfo).toBeAttached();

      // Should have user name and description
      const userName = await profileInfo.locator('h2').textContent();
      expect(userName?.trim()).toBeTruthy();
      expect(userName!.length).toBeGreaterThan(0);

      const userDescription = await profileInfo.locator('#p-1').textContent();
      expect(userDescription?.trim()).toBeTruthy();
      expect(userDescription!.length).toBeGreaterThan(0);
    });
  });
});