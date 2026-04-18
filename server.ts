import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

// Simple in-memory cookie cache for the proxy
const cookieCache: Record<string, string> = {};

// API Proxy for Scraper to bypass CORS
app.post('/api/proxy/fetch', async (req, res) => {
  try {
    const { url, headers: customHeaders } = req.body || {};
    
    if (!url || typeof url !== 'string' || url === 'undefined' || url === 'null') {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Malformed URL format' });
    }
    
    const domain = targetUrl.hostname;
    const existingCookies = cookieCache[domain] || '';

    // Advanced Header Profiles
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    ];
    
    const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

    const performRequest = async (shouldSimulateFresh = false) => {
      const currentCookies = shouldSimulateFresh ? '' : existingCookies;
      
      return await axios.get(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Connection': 'keep-alive',
          'Cookie': currentCookies,
          ...customHeaders
        },
        timeout: 30000,
        validateStatus: (status) => status < 500,
        transformResponse: [(data) => data]
      });
    };

    let response = await performRequest();

    // If we get a soft-block (challenge) and we were using cookies, try once with fresh session
    const checkIsBlock = (data: any) => {
      if (typeof data !== 'string') return false;
      const lower = data.toLowerCase();
      return lower.includes('cloudflare-style') || 
             lower.includes('id="cf-wrapper"') ||
             lower.includes('checking your browser') ||
             lower.includes('verify you are human');
    };

    if (checkIsBlock(response.data) && existingCookies) {
      console.log(`Soft block detected for ${domain}. Retrying with fresh session...`);
      response = await performRequest(true);
    }

    // Capture cookies
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const combined = setCookie.map(c => c.split(';')[0]).join('; ');
      cookieCache[domain] = (cookieCache[domain] ? cookieCache[domain] + '; ' : '') + combined;
    }

    const body = response.data;
    if (checkIsBlock(body)) {
      return res.status(403).json({ error: 'Automated request discovery blocked by target (Cloudflare Challenge). Automated bypass is limited.' });
    }

    process.stdout.write(`Proxy: ${response.status} | ${body.length} bytes | ${url}\n`);
    res.send(body);
    } catch (error: any) {
      console.error('Proxy Error:', error.message);
      res.status(error.response?.status || 500).json({ 
        error: error.message,
        details: error.response?.data
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aura Reader Server running at http://localhost:${PORT}`);
  });
}

startServer();
