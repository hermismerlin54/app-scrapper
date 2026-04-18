
export interface ExtractedChapter {
  title: string;
  content: string;
  nextUrl?: string;
}

export class SmartExtractor {
  static cleanHtml(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 1. Remove obvious junk
    doc.querySelectorAll('script, style, iframe, ads, nav, footer, header, .ads, .sidebar, .comments').forEach(el => el.remove());
    
    // 2. Intelligent Content Detection
    let bestContainer: Element | null = null;
    let maxParagraphs = 0;

    // A. Priority Selectors (Common in novel sites)
    const prioritySelectors = [
      '#chr-content', 
      '.chapter-content', 
      '.entry-content', 
      '.read-content', 
      '.reader-content',
      '.novel-content',
      '#novel-content',
      '.post-content',
      'article'
    ];

    for (const selector of prioritySelectors) {
      const el = doc.querySelector(selector);
      if (el) {
        const textLen = (el as HTMLElement).innerText?.length || el.textContent?.length || 0;
        if (textLen > 200) {
          bestContainer = el;
          break;
        }
      }
    }

    if (!bestContainer) {
      doc.querySelectorAll('div, section, main').forEach((el) => {
        const pCount = el.querySelectorAll('p').length;
        if (pCount > maxParagraphs) {
          maxParagraphs = pCount;
          bestContainer = el;
        }
      });
    }

    if (!bestContainer || (maxParagraphs < 3 && !prioritySelectors.some(s => doc.querySelector(s)))) {
      let maxTextLen = 0;
      doc.querySelectorAll('div, article').forEach((el) => {
        const textLen = (el as HTMLElement).innerText?.length || el.textContent?.length || 0;
        // Skip containers that are too link-heavy (likely nav/footer)
        const linkCount = el.querySelectorAll('a').length;
        if (linkCount > 10 && textLen < 2000) return;

        if (textLen > maxTextLen) {
          maxTextLen = textLen;
          bestContainer = el;
        }
      });
    }

    if (!bestContainer) return '';

    const text = (bestContainer as HTMLElement).innerText || bestContainer.textContent || '';
    
    // Check for anti-bot messages
    const botPatterns = [
      'enable javascript and cookies',
      'checking your browser',
      'attention required',
      'verify you are human',
      'ddos-guard',
      'cloudflare',
      'just a moment',
      'sucuri',
      'incident id',
      'pardon our interruption',
      'access to this page has been denied',
      'robot check'
    ];
    
    const lowerText = text.toLowerCase();
    if (botPatterns.some(p => lowerText.includes(p))) {
      throw new Error("Bot Protection Detected: Site requires JavaScript challenge or cookies.");
    }

    // Minimum meaningful content length
    if (text.trim().length < 100) {
      // Possibly a navigation/placeholder page
      return ''; 
    }

    // Final cleanup of the chosen container
    bestContainer.querySelectorAll('a').forEach((a) => {
      const text = a.textContent?.toLowerCase() || '';
      if (text.includes('next') || text.includes('previous') || text.includes('chapter')) {
        a.remove();
      }
    });

    // Remove empty elements
    bestContainer.querySelectorAll('*').forEach((el) => {
      if (el.textContent?.trim().length === 0 && el.children.length === 0) {
        el.remove();
      }
    });

    return (bestContainer as Element).innerHTML || '';
  }

  static findNextUrl(html: string, currentUrl: string): string | undefined {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let nextUrl: string | undefined;

    // 1. Look for explicit "Next" links
    const links = doc.querySelectorAll('a');
    for (const el of Array.from(links)) {
      const text = el.textContent?.toLowerCase() || '';
      const href = el.getAttribute('href');
      if (href && (text.includes('next') || text.includes('next chapter') || text === '>')) {
        try {
          nextUrl = new URL(href, currentUrl).toString();
          break;
        } catch {}
      }
    }

    if (nextUrl) return nextUrl;

    // 2. Try URL increment logic
    const pattern = /(.*chapter[-_])(\d+)(.*)/i;
    const match = currentUrl.match(pattern);
    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2]);
      const suffix = match[3];
      return `${prefix}${num + 1}${suffix}`;
    }

    return undefined;
  }

  static extractTitle(html: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Prefer h1, then first h2, then title tag
    const h1 = doc.querySelector('h1')?.textContent?.trim();
    if (h1 && h1.length < 200) return h1;
    
    const h2 = doc.querySelector('h2')?.textContent?.trim();
    if (h2 && h2.length < 200) return h2;

    return doc.title?.replace(/ - .*/, '').trim() || 'Untitled Novel';
  }
}
