
export interface ChapterMeta {
  index: number;
  title: string;
  url: string;
}

export abstract class NovelSiteAdapter {
  abstract get siteKey(): string;
  abstract canHandle(url: string): boolean;
  abstract fetchChapterList(novelUrl: string): Promise<ChapterMeta[]>;
  abstract fetchChapterContent(chapterUrl: string): Promise<string>;
  
  protected async fetchWithProxy(url: string, headers?: Record<string, string>): Promise<string> {
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

  get defaultHeaders(): Record<string, string> {
    return {};
  }

  get requestDelay(): number {
    return 1500;
  }
}
