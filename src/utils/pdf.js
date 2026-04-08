import puppeteer from 'puppeteer';
import { logger } from '../config/index.js';

let browserPromise = null;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
      ],
    });
  }
  return browserPromise;
}

/**
 * Render an HTML string to a PDF buffer.
 */
export async function htmlToPdf(html, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    return pdf;
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

// Cleanup on shutdown
process.on('SIGTERM', closeBrowser);
process.on('SIGINT', closeBrowser);
