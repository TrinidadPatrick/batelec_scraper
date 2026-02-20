const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const dotenv = require('dotenv');
dotenv.config();

chromium.use(stealth());

const run = async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    console.log("Navigating to Facebook login");
    await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name=email]', { timeout: 15000 });

    await page.locator('input[name=email]').fill(process.env.USER);
    await page.locator('input[name=pass]').fill(process.env.PASSWORD);
    await new Promise((resolve) => setTimeout(()=>{resolve(1)}, 2000))
    await page.keyboard.press('Enter');

    await new Promise((resolve) => setTimeout(()=>{resolve(1)}, 5000))

    console.log("⌛ Waiting for login to complete...");
    await page.waitForURL(url => !url.includes('/login'), { timeout: 40000 }).catch(() => {
        console.log("URL didn't change after login it may have hit a checkpoint.");
    });
    await page.waitForTimeout(4000);

    console.log("Navigating to BATELEC II Facebook page");
    await page.goto('https://www.facebook.com/Batelec2AreaIII', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('div[role="main"]', { timeout: 20000 });
    await page.waitForTimeout(3000);

    // closes popups
    try {
        const closeBtn = page.locator('[aria-label="Close"], [aria-label="Not now"]').first();
        if (await closeBtn.isVisible({ timeout: 3000 })) {
            await closeBtn.click();
            console.log("✖️ Closed popup.");
        }
    } catch (_) {}

    const results = new Set();
    const requiredWords = ['darasa', 'malvar'];
    const triggerWords = ['notice', 'interruption', 'pabatid', 'abiso', 'deferred', 'scheduled', 'restoration', 'outage'];

    console.log("📜 Scrolling and collecting posts...");

    for (let i = 0; i < 3; i++) {
        try {
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('div[role="button"]'))
                    .filter(b => b.innerText === 'See more' || b.innerText === 'See More');
                buttons.forEach(b => b.click());
            });
            await page.waitForTimeout(1000);
        } catch (_) {}


        const posts = page.locator('div[data-ad-comet-preview="message"]');
        const count = await posts.count();

        for (let j = 0; j < count; j++) {
            const text = await posts.nth(j).innerText();
            const lowerText = text.toLowerCase();

            const hasRequired = requiredWords.some(w => lowerText.includes(w.toLowerCase()));
            const hasTrigger = triggerWords.some(w => lowerText.includes(w.toLowerCase()));

            if (hasRequired && hasTrigger && text.length > 50) {
                const cleanText = text.split(/All reactions/i)[0]
                                     .split(/Like\nComment/i)[0].trim();
                
                if (cleanText.length > 0) {
                    results.add(cleanText);
                }
            }
        }

        console.log(`   Scroll ${i + 1}/3 — ${results.size} advisories found...`);
        await page.mouse.wheel(0, 2000);
        await page.waitForTimeout(4000); 
    }

    console.log(`\n=========================================`);
    console.log(`   BATELEC II POWER ADVISORIES (${results.size} found)`);
    console.log(`=========================================\n`);

    if (results.size === 0) {
        console.log("No advisories found.");
    } else {
        Array.from(results).forEach((post, i) => {
            console.log(`[NOTICE #${i + 1}]\n${post}\n-----------------------------------------\n`);
        });
    }

    await browser.close();
};

run().catch(console.error);