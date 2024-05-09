const express = require('express');
const puppeteer = require('puppeteer');
const cron = require('node-cron');

const app = express();
const port = process.env.PORT || 3000;

async function takeScreenshot() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('https://antonio9hanania.github.io/daily-analysis-report/');
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
  console.log('Screenshot taken successfully');
}

// Schedule the screenshot task to run once a day at midnight
cron.schedule('0 0 * * *', takeScreenshot);

app.get('/', (req, res) => {
  res.send('Screenshot service is running');
});

app.get('/screenshot', async (req, res) => {
  await takeScreenshot();
  res.send('Screenshot taken successfully');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});