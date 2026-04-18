import { NovelSiteAdapter, ChapterMeta } from '../NovelSiteAdapter';

export class RoyalRoadAdapter extends NovelSiteAdapter {
  get siteKey() {
    return 'royalroad.com';
  }

  canHandle(url: string): boolean {
    return url.includes('royalroad.com');
  }

  async fetchChapterList(novelUrl: string): Promise<ChapterMeta[]> {
    const html = await this.fetchWithProxy(novelUrl);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const chapters: ChapterMeta[] = [];

    const rows = doc.querySelectorAll('#chapters tbody tr');
    rows.forEach((el, i) => {
      const link = el.querySelector('td:first-child a') as HTMLAnchorElement;
      if (link) {
        const title = link.textContent?.trim() || '';
        const href = link.getAttribute('href');
        const url = href ? 'https://www.royalroad.com' + href : '';
        if (title && url) {
          chapters.push({ index: i, title, url });
        }
      }
    });

    return chapters;
  }

  async fetchChapterContent(chapterUrl: string): Promise<string> {
    const html = await this.fetchWithProxy(chapterUrl);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const contentElement = doc.querySelector('.chapter-content');
    const content = contentElement?.innerHTML || '';
    
    return content.trim();
  }
}
