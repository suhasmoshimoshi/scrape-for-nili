const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = process.env.PORT || 5000;

app.get('/', async (req, res) => {
  try {
    const eventData = await scrapeEvents();
    res.json(eventData);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ error: 'An error occurred while scraping data' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
function getBrowserLaunchOptions() {
  return {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome-stable',
    headless: 'new',
    timeout: 120000, // Increase the launch timeout to 60 seconds
  };
}


async function scrapeEvents() {
  const browser = await puppeteer.launch(getBrowserLaunchOptions());
  const page = await browser.newPage();

  try {
    await page.goto('https://insider.in/all-events-in-bengaluru-weekend/parties');
    await autoScroll(page);

    await page.waitForSelector('[data-ref="event_card"]');
    await page.waitForSelector('[data-ref="event_card_image"]');
    await page.waitForSelector('[data-ref="event_card_title"]');
    await page.waitForSelector('[data-ref="event_card_date_string"] p');
    await page.waitForSelector('[data-ref="event_card_location"]');

    const eventData = await page.evaluate(() => {
      const eventCards = document.querySelectorAll('[data-ref="event_card"]');
      return Array.from(eventCards).map(card => {
        const titleElement = card.querySelector('[data-ref="event_card_title"]');
        const dateElement = card.querySelector('[data-ref="event_card_date_string"] p');
        const locationElement = card.querySelector('[data-ref="event_card_location"]');
        const linkElement = card.querySelector('a');
        const imageElement = card.querySelector('[data-ref="event_card_image"]');

        return {
          title: titleElement ? titleElement.innerText : '',
          date: dateElement ? dateElement.innerText : '',
          location: locationElement ? locationElement.innerText : '',
          link: linkElement ? linkElement.href : '',
          imageURL: imageElement ? imageElement.getAttribute('src') : ''
        };
      });
    });

    return eventData;
  } finally {
    await browser.close();
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 400);
    });
  });
}