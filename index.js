import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import dotenv from 'dotenv';
import { sendMail } from './sendMail.js';
import { sanitizeResults } from './sanitizeResults.js';
import fs from 'fs';
import validateLoginState from './validateLoginState.js';
dotenv.config();

const isStateValid = () => {
    try {
        if (fs.existsSync('state.json')) {
            const data = fs.readFileSync('state.json', 'utf8');
            JSON.parse(data);
            return true;
        }
    } catch (error) {
        console.warn("Invalid or corrupt state.json found. Proceeding without it.");
    }
    return false;
}

chromium.use(stealth());
const ENVIRONMENT = process.env.ENVIRONMENT
const PLACES = process.env.PLACES
const RECIPIENTS_STRING = process.env.RECIPIENTS
const TYPE = process.env.TYPE

const run = async () => {

    let context;
    const browser = await chromium.launch({ headless: ENVIRONMENT === 'LOCAL' ? false : true });
    if (ENVIRONMENT === 'TEST') {
        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        });
    }
    else {
        if (isStateValid() && TYPE === 'AUTH') {
            console.log("Using state.json")
            context = await browser.newContext({
                storageState: 'state.json',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            });
        }
        if (TYPE === 'UNAUTH') {
            context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            });
        } if (!isStateValid() && TYPE === 'AUTH') {
            console.log("No valid state.json found. Closing...");
            await browser.close();
        }
    }
    const page = await context.newPage();

    console.log("Navigating to BATELEC II Facebook page");
    await page.goto('https://www.facebook.com/Batelec2AreaIII', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('div[role="main"]', { timeout: 20000 });
    await page.waitForTimeout(3000);

    validateLoginState(page).catch(async (error) => {
        console.log(error)
        await browser.close()
    })

    // closes popups
    try {
        const closeBtn = page.locator('[aria-label="Close"], [aria-label="Not now"]').first();
        if (await closeBtn.isVisible({ timeout: 3000 })) {
            await closeBtn.click();
        }
    } catch (_) { }

    if (!PLACES) {
        throw new Error(`Places not defined in ENV, Please create an env file with PLACES key and value formatted like this : 
        address1,address1`)
    }

    const results = new Set();
    const requiredWords = PLACES.split(",");
    const triggerWords = ['notice', 'interruption', 'pabatid', 'abiso', 'deferred', 'scheduled', 'restoration', 'outage'];

    console.log("Scrolling and collecting posts...");

    for (let i = 0; i < 5; i++) {
        try {
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

        console.log(`Scroll ${i + 1}/5 — ${results.size} advisories found...`);
        await page.mouse.wheel(0, 2000);
        await page.waitForTimeout(4000);
    }

    console.log(`BATELEC II POWER ADVISORIES (${results.size} found)`);

    if (results.size === 0) {
        console.log("No advisories found.");
    } else {
        const rawResults = Array.from(results).map((result, index) => `Advisory # ${index + 1}: ${result} \n\n`).join('\n\n')
        const body = await sanitizeResults(rawResults)
        try {
            await sendMail(body, RECIPIENTS_STRING)
            console.log('Email sent')
        } catch (error) {
            console.log(`Error sending email: ${error}`)
        }
    }

    await browser.close();
};

run().catch(console.error);