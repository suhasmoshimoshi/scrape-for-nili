const puppeteer = require('puppeteer');

(async () => {
  // Launch a headless browser
  const browser = await puppeteer.launch();

  // Open a new page
  const page = await browser.newPage();

  // Navigate to the website you want to scrape
  await page.goto('https://insider.in/all-events-in-bengaluru-weekend/parties');


  await autoScroll(page);

  // Wait for the div elements to load
  await page.waitForSelector('[data-ref="event_card"]');
  await page.waitForSelector('[data-ref="event_card_image"]');
  await page.waitForSelector('[data-ref="event_card_title"]');
  await page.waitForSelector('[data-ref="event_card_date_string"] p');
  await page.waitForSelector('[data-ref="event_card_location"]');

  // Extract data
  const eventData = await page.evaluate(() => {
    const eventCards = document.querySelectorAll('[data-ref="event_card"]');
    const eventData = [];

    eventCards.forEach(card => {
      const titleElement = card.querySelector('[data-ref="event_card_title"]');
      const dateElement = card.querySelector('[data-ref="event_card_date_string"] p');
      const locationElement = card.querySelector('[data-ref="event_card_location"]');
      const linkElement = card.querySelector('a');
      const imageElement = card.querySelector('[data-ref="event_card_image"]');

      const title = titleElement ? titleElement.innerText : '';
      const date = dateElement ? dateElement.innerText : '';
      const location = locationElement ? locationElement.innerText : '';
      const link = linkElement ? linkElement.href : '';
      const imageURL = imageElement ? imageElement.getAttribute('src') : '';

      eventData.push({
        title: title,
        date: date,
        location: location,
        link: link,
        imageURL: imageURL
      });
    });

    return eventData;
  });

  console.log(eventData);

  // Close the browser
  await browser.close();
})();

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
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
