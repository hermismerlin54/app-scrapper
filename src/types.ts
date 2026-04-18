/**
 * Data Models for Aura Reader
 */

export type SourceType = 'imported' | 'scraped' | 'translated';
export type ThemeMode = 'light' | 'dark' | 'sepia';

export interface Book {
  id?: number;
  title: string;
  author?: string;
  coverUrl?: string;
  category: string;
  sourceType: SourceType;
  createdAt: number;
  lastOpenedAt: number;
  totalChapters: number;
  language: string;
  isFavorite?: boolean;
  isPinned?: boolean;
}

export interface Chapter {
  id?: number;
  bookId: number;
  index: number;
  title: string;
  sourceUrl?: string;
  isDownloaded: boolean;
  isTranslated: boolean;
}

export interface Chunk {
  id?: number;
  chapterId: number;
  index: number;
  originalText: string;
  modifiedText?: string;
  translatedText?: string;
  isCached: boolean;
}

export interface ReadingSession {
  id?: number;
  bookId: number;
  currentChapterIndex: number;
  currentChunkIndex: number;
  scrollOffset: number;
  activeLanguage: string;
  lastReadAt?: number;
}

export interface Annotation {
  id?: number;
  chunkId: number;
  type: 'highlight' | 'edit';
  content: string;
  startOffset: number;
  endOffset: number;
  color: string;
  createdAt: number;
}

export interface ScraperConfig {
  id?: number;
  siteKey: string;
  baseUrl: string;
  chapterListSelector: string;
  chapterTitleSelector: string;
  chapterContentSelector: string;
  paginationSelector: string;
  requestDelayMs: number;
}

export interface TranslationConfig {
  apiEndpoint: string;
  apiKey: string;
  modelName: string;
  systemPrompt: string;
  targetLanguage: string;
  batchSize: number;
  apiType: 'openai' | 'custom';
}
