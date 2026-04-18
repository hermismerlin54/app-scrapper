import Dexie, { type Table } from 'dexie';
import { 
  Book, 
  Chapter, 
  Chunk, 
  ReadingSession, 
  Annotation, 
  ScraperConfig 
} from './types';

export class AuraDatabase extends Dexie {
  books!: Table<Book>;
  chapters!: Table<Chapter>;
  chunks!: Table<Chunk>;
  sessions!: Table<ReadingSession>;
  annotations!: Table<Annotation>;
  scraperConfigs!: Table<ScraperConfig>;

  constructor() {
    super('AuraReaderDB');
    this.version(1).stores({
      books: '++id, title, author, category, sourceType, createdAt, lastOpenedAt',
      chapters: '++id, bookId, index, isDownloaded',
      chunks: '++id, chapterId, index, isCached',
      sessions: '++id, bookId',
      annotations: '++id, chunkId, type',
      scraperConfigs: '++id, siteKey',
    });
  }
}

export const db = new AuraDatabase();
