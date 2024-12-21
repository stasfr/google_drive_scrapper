import puppeteer from 'puppeteer-core';
import dotenv from 'dotenv';

dotenv.config();

const URL = 'https://drive.google.com/file/d/1Jt5pdVcKGyyuKK2JAJdXd8ykgDcxkoRd';
const BROWSER_WS = process.env.BROWSER_WS;

run(URL);

async function run(url) {
  console.log('Connecting to browser...');
  const browser = await puppeteer.connect({
    browserWSEndpoint: BROWSER_WS,
  });
  console.log('Connected! Navigate to site...');
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('Navigated');
  console.log('Scrolling to the end');
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  console.log(page.locator('a[role="document"]'));

  console.log('Closing browser');
  await browser.close();
}

async function interact(page) {
  console.log('Waiting for search form...');
  const search_input = await page.waitForSelector(
    '[data-testid="destination-container"] input',
    { timeout: 60000 }
  );
  console.log('Search form appeared! Filling it...');
  await search_input.type(search_text);
  await page.click('[data-testid="searchbox-dates-container"] button');
  await page.waitForSelector('[data-testid="searchbox-datepicker-calendar"]');
  await page.click(`[data-date="${check_in}"]`);
  await page.click(`[data-date="${check_out}"]`);
  console.log('Form filled! Submitting and waiting for result...');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
  ]);
}

async function parse(page) {
  return await page.$$eval('[data-testid="property-card"]', (els) =>
    els.map((el) => {
      const name = el.querySelector('[data-testid="title"]')?.innerText;
      const price = el.querySelector(
        '[data-testid="price-and-discounted-price"]'
      )?.innerText;
      const review_score =
        el.querySelector('[data-testid="review-score"]')?.innerText ?? '';
      const [score_str, , , reviews_str = ''] = review_score.split('\n');
      const score = parseFloat(score_str) || score_str;
      const reviews = parseInt(reviews_str.replace(/\D/g, '')) || reviews_str;
      return { name, price, score, reviews };
    })
  );
}
