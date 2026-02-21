const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth');
const dotenv = require('dotenv');
const { sendMail } = require('./sendMail');
const {sanitizeResults} = require('./sanitizeResults.js')
dotenv.config();

chromium.use(stealth());
const ENVIRONMENT = process.env.ENVIRONMENT
const run = async () => {
    let context;
    const browser = await chromium.launch({ headless: ENVIRONMENT === 'LOCAL' ? false : true });
    if(ENVIRONMENT === 'LOCAL'){
    context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });}
    else{
        console.log("Using state.json")
        context = await browser.newContext({ 
        viewport: { width: 1920, height: 1080 },
        storageState: 'state.json',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });
    }
    const page = await context.newPage();

    console.log("Navigating to login");

    await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input[name=email]', { timeout: 15000 });

    await page.locator('input[name=email]').fill(process.env.USER);
    await page.locator('input[name=pass]').fill(process.env.PASSWORD);
    await new Promise((resolve) => setTimeout(() => { resolve(1) }, 2000))
    await page.keyboard.press('Enter');

    await new Promise((resolve) => setTimeout(() => { resolve(1) }, 5000))

    console.log("Logging in");
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
        console.log("No advisories found.");
    } else {
        // Array.from(results).forEach((post, i) => {
        //     console.log(`[NOTICE #${i + 1}]\n${post}\n-----------------------------------------\n`);
        // });

        let emailBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #333;">
                <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px;">
                    ⚡ BATELEC II Power Advisory Summary
                </h2>
                <p>The following power interruption notices were found for <b>Darasa</b> and <b>Malvar</b>:</p>
            `;

                    // 2. Loop through results and build HTML "Cards"
                    Array.from(results).forEach((post, i) => {
                        // Detect if it's a Deferment to change the color
                        const isDeferred = post.toLowerCase().includes('deferred') || post.toLowerCase().includes('hindi matutuloy');
                        const borderColor = isDeferred ? '#dc3545' : '#ffc107'; // Red for deferred, Yellow for scheduled
                        const statusLabel = isDeferred ? '⚠️ DEFERRED / MOVED' : '📅 SCHEDULED';

                        emailBody += `
                <div style="margin-bottom: 20px; padding: 15px; border-left: 5px solid ${borderColor}; background-color: #f9f9f9; border-radius: 4px;">
                    <span style="font-size: 12px; font-weight: bold; color: ${borderColor};">${statusLabel}</span>
                    <div style="white-space: pre-wrap; margin-top: 10px; line-height: 1.5;">${post}</div>
                </div>
                `;
                    });

                    // 3. Add Footer
                    emailBody += `
                <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
                <p style="font-size: 11px; color: #777; text-align: center;">
                    Automated Scraper Update • ${new Date().toLocaleString()}
                </p>
            </div>
            `;
            const rawResults = Array.from(results).map((result, index) => `Advisory # ${index + 1}: ${result}`).toLocaleString()
            const body = await sanitizeResults(rawResults)
            console.log(rawResults)
            await sendMail(body)
            console.log('Email sent')
    }

    await browser.close();
};

run().catch(console.error);