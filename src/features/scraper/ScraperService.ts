import { SmartExtractor } from './SmartExtractor';
import { BookRepository } from '../../repositories/DataRepository';
import { db } from '../../db';

export type ScrapingEvent = 
  | { type: 'log', message: string, status?: 'info' | 'error' | 'success' | 'warning' }
  | { type: 'progress', current: number, total: number, speed?: number, remainingTime?: number }
  | { type: 'complete', bookId: number };

export class ScraperService {
  private async fetchWithProxy(url: string, headers?: Record<string, string>): Promise<string> {
    const response = await fetch('/api/proxy/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, headers })
    });
    
    let text = '';
    try {
      text = await response.text();
    } catch (e) {
      // Body already read or other fetch error
    }

    if (!response.ok) {
      let errorMsg = `Proxy error: ${response.status}`;
      if (text && text.trim() && text.trim() !== 'undefined' && text.trim() !== 'null') {
        try {
          const errData = JSON.parse(text);
          errorMsg = errData.error || errorMsg;
        } catch (pe) {
          // Not JSON or malformed
        }
      }
      throw new Error(errorMsg);
    }
    
    return text || '';
  }

  async scrapeNovel(
    startUrl: string, 
    maxChapters: number, 
    chaptersPerMinute: number,
    onEvent: (ev: ScrapingEvent) => void
  ) {
    let currentUrl = startUrl;
    let previousUrl = 'https://www.google.com/';
    let chaptersProcessed = 0;
    let baseDelay = (60 / chaptersPerMinute) * 1000;
    const startTime = Date.now();
    let consecutiveBlocks = 0;

    try {
      onEvent({ type: 'log', message: 'Initializing Advanced Extraction Engine...', status: 'info' });
      
      // Initial fetch to get book title
      if (!currentUrl || !currentUrl.startsWith('http')) {
        throw new Error(`Invalid or missing start URL: ${currentUrl}`);
      }

      // 1. Session Handshake (Automated Cookie Warmup)
      try {
        const rootUrl = new URL(currentUrl).origin;
        onEvent({ type: 'log', message: `Performing secure handshake with ${rootUrl}...`, status: 'info' });
        await this.fetchWithProxy(rootUrl, { 'Referer': 'https://www.google.com/' });
        await new Promise(r => setTimeout(r, 2000));
      } catch (e) {
        onEvent({ type: 'log', message: 'Handshake warning: Preliminary session setup failed. Proceeding with caution.', status: 'warning' });
      }

      // Detect difficult sites
      const isDifficultSite = currentUrl.includes('novelbin.com') || currentUrl.includes('novelcool.com');
      if (isDifficultSite && chaptersPerMinute > 15) {
        onEvent({ type: 'log', message: 'Throttling CPM for target domain security limits...', status: 'warning' });
        baseDelay = 4000; 
      }
      
      const firstHtml = await this.fetchWithProxy(currentUrl, { 'Referer': 'https://www.google.com/' });
      const firstTitle = SmartExtractor.extractTitle(firstHtml);
      
      const bookId = await BookRepository.create({
        title: firstTitle || "Extracted Novel",
        category: "Web Novel",
        sourceType: "scraped",
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
        totalChapters: maxChapters,
        language: "en"
      });

      onEvent({ type: 'log', message: `Manifest Created: ${firstTitle}`, status: 'info' });

      for (let i = 0; i < maxChapters; i++) {
        if (!currentUrl || !currentUrl.startsWith('http')) {
          onEvent({ type: 'log', message: 'No valid chapter links detected or reached end of book. Stopping.', status: 'info' });
          break;
        }

        onEvent({ type: 'log', message: `Requesting Chapter ${i + 1}: ${currentUrl}`, status: 'info' });
        
        try {
          let html = "";
          let retryCount = 0;
          const maxRetries = 2; // Increased retries

          while (retryCount <= maxRetries) {
            try {
              html = await this.fetchWithProxy(currentUrl, { 'Referer': previousUrl });
              SmartExtractor.cleanHtml(html); // Test for block errors
              consecutiveBlocks = 0; // Reset on success
              break; 
            } catch (err: any) {
              const botBlock = err.message.includes('Bot Protection') || err.message.includes('blocked by target');
              if (botBlock && retryCount < maxRetries) {
                const backoffTime = 20000 * (retryCount + 1); // Increased backoff
                onEvent({ type: 'log', message: `Security Challenge: Recalibrating request profile. Pausing for ${backoffTime/1000}s...`, status: 'warning' });
                await new Promise(r => setTimeout(r, backoffTime));
                retryCount++;
                continue;
              } else {
                throw err;
              }
            }
          }
          
          const title = SmartExtractor.extractTitle(html);
          const content = SmartExtractor.cleanHtml(html);
          const nextUrl = SmartExtractor.findNextUrl(html, currentUrl);

          if (!content) {
            onEvent({ type: 'log', message: `Chapter ${i + 1} extraction failed. Container not found. Skipping.`, status: 'error' });
            currentUrl = nextUrl || "";
            continue;
          }

          await db.transaction('rw', [db.chapters, db.chunks], async () => {
            const chapterId = await db.chapters.add({
              bookId,
              index: i,
              title: title || `Chapter ${i + 1}`,
              sourceUrl: currentUrl,
              isDownloaded: true,
              isTranslated: false
            });

            // Split content into chunks
            const textContent = content.replace(/<[^>]*>/g, ' ');
            const chunkSize = 1500;
            for (let j = 0; j < textContent.length; j += chunkSize) {
              await db.chunks.add({
                chapterId,
                index: Math.floor(j / chunkSize),
                originalText: textContent.substring(j, j + chunkSize),
                isCached: true
              });
            }
          });

          chaptersProcessed++;
          
          // Speed and ETA calculation
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = chaptersProcessed / (elapsed / 60);
          const remaining = maxChapters - chaptersProcessed;
          const eta = speed > 0 ? (remaining / speed) * 60 : 0;

          onEvent({ 
            type: 'progress', 
            current: chaptersProcessed, 
            total: maxChapters,
            speed: Math.round(speed * 10) / 10,
            remainingTime: Math.round(eta)
          });

          if (chaptersProcessed >= maxChapters) break;

          previousUrl = currentUrl;
          currentUrl = nextUrl || "";
          
          // Anti-block delay with jitter
          const multiplier = isDifficultSite ? 1.5 : 1.0;
          const jitter = (Math.random() * 4000) - 2000; // Higher jitter
          const finalDelay = Math.max(1000, (baseDelay * multiplier) + jitter);
          await new Promise(r => setTimeout(r, finalDelay));

        } catch (err: any) {
          const isBotBlock = err.message.includes('Bot Protection') || err.message.includes('blocked by target');
          
          onEvent({ 
            type: 'log', 
            message: `${isBotBlock ? 'SECURITY BLOCK' : 'Server error'} at ${currentUrl}: ${err.message}`, 
            status: 'error' 
          });

          if (isBotBlock) {
             consecutiveBlocks++;
             if (consecutiveBlocks >= 2) { // Allow one retry before giving up
                onEvent({ type: 'log', message: "Site security is preventing automated extraction. Try reducing CPM to < 3 or wait 10 minutes.", status: 'error' });
                break; 
             }
          }

          if (err.response?.status === 404) {
            onEvent({ type: 'log', message: 'Fatal 404 detected. Stopping book.', status: 'error' });
            break;
          }
          await new Promise(r => setTimeout(r, 10000));
        }
      }

      onEvent({ type: 'complete', bookId });
    } catch (e: any) {
      onEvent({ type: 'log', message: `Critical Failure: ${e.message}`, status: 'error' });
    }
  }
}

export const scraperService = new ScraperService();
