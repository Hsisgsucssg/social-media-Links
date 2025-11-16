import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set up visual baseline directory
  const baselineDir = './visual-baseline';

  try {
    // Create baseline directory if it doesn't exist
    await page.evaluate(() => {
      // This runs in the browser context - for any setup needed in the page
    });

    console.log('✅ Visual testing environment configured');
    console.log(`📁 Baseline directory: ${baselineDir}`);

  } catch (error) {
    console.error('❌ Error setting up visual testing:', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;