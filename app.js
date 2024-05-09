const express = require('express');
const puppeteer = require('puppeteer');
const cron = require('node-cron');
const dotenv = require('dotenv');
const twilio = require('twilio');
const { GoogleAuth } = require('google-auth-library');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function takeScreenshot() {
  const auth = new GoogleAuth({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    scopes: ['https://www.googleapis.com/auth/userinfo.email'],
  });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set up authentication
  await page.setExtraHTTPHeaders({
    'Authorization': `Bearer ${(await auth.getAccessToken()).token}`,
  });

  await page.goto('https://antonio9hanania.github.io/daily-analysis-report/');
  await page.setViewport({ width: 1200, height: 800 });
  const screenshotBuffer = await page.screenshot({ fullPage: true });

  await browser.close();

  // Send screenshot to WhatsApp group
  try {
    await client.messages.create({
      from: `whatsapp:${process.env.WHATSAPP_FROM_NUMBER}`,
      to: `whatsapp:${process.env.WHATSAPP_TO_NUMBER}`,
      body: 'Daily Screenshot',
      mediaUrl: `data:image/png;base64,${screenshotBuffer.toString('base64')}`,
    });
    console.log('Screenshot sent to WhatsApp group');
  } catch (error) {
    console.error('Failed to send screenshot to WhatsApp group:', error.message);
  }
}

// Schedule the screenshot task to run daily at 11:00
cron.schedule('0 11 * * *', takeScreenshot);

app.get('/screenshot', async (req, res) => {
  const token = req.query.token;

  if (token !== process.env.SCREENSHOT_TOKEN) {
    res.status(401).send('Unauthorized');
    return;
  }

  await takeScreenshot();
  res.send('Screenshot captured and sent');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});