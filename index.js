const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const dotenv = require('dotenv');
const { sendMail } = require('./sendMail');
const { sanitizeResults } = require('./sanitizeResults.js')
dotenv.config();

chromium.use(stealth());
const ENVIRONMENT = process.env.ENVIRONMENT
const run = async () => {
    let context;
    const browser = await chromium.launch({ headless: ENVIRONMENT === 'LOCAL' ? false : true });
    if (ENVIRONMENT === 'TEST') {
        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        });
    }
    else {
        console.log("Using state.json")
        context = await browser.newContext({
            // viewport: { width: 1920, height: 1080 },
            storageState: 'state.json',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        });
    }
    const page = await context.newPage();

    console.log("Navigating to BATELEC II Facebook page");
    await page.goto('https://www.facebook.com/Batelec2AreaIII', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('div[role="main"]', { timeout: 20000 });
    await page.waitForTimeout(3000);

    // closes popups
    try {
        const closeBtn = page.locator('[aria-label="Close"], [aria-label="Not now"]').first();
        if (await closeBtn.isVisible({ timeout: 3000 })) {
            await closeBtn.click();
        }
    } catch (_) { }

    const results = new Set();
    const requiredWords = ['darasa', 'malvar'];
    const triggerWords = ['notice', 'interruption', 'pabatid', 'abiso', 'deferred', 'scheduled', 'restoration', 'outage'];

    console.log("📜 Scrolling and collecting posts...");

    for (let i = 0; i < 3; i++) {
        try {
            await page.screenshot({ path: 'debug.png', fullPage: true });
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('div[role="button"]'))
                    .filter(b => b.innerText === 'See more' || b.innerText === 'See More');
                buttons.forEach(b => b.click());
            });
            await page.waitForTimeout(1000);
        } catch (_) { }


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
        await sendMail(body)
        console.log("No advisories found.");
    } else {
        const rawResults = Array.from(results).map((result, index) => `Advisory # ${index + 1}: ${result} \n\n`).toLocaleString()
        const body = await sanitizeResults(rawResults)
        console.log(rawResults)
        await sendMail(body)
        console.log('Email sent')
    }

    await browser.close();
};

run().catch(console.error);