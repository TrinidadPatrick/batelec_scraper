const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Opening Facebook. Please log in manually...");
  await page.goto('https://www.facebook.com/');
  
  try {
    console.log("Waiting for you to finish logging in...");
    await page.waitForSelector('div[aria-label="Create a post"], div[role="feed"]', { timeout: 120000 });
    
    console.log("Saving state...");
    
    await page.waitForTimeout(5000); 

    await context.storageState({ path: 'state.json' });
    console.log("State.json saved successfully.");
    
  } catch (error) {
    console.log("Login timed out or failed to detect home screen.");
  }

  await browser.close();
  console.log("Browser closed.");
})();