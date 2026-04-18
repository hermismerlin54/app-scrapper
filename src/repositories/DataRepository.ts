import { db } from '../db';
import { Book, ReadingSession } from '../types';

export const BookRepository = {
  async getAll() {
    return await db.books.toArray();
  },

  async getById(id: number) {
    return await db.books.get(id);
  },

  async create(book: Omit<Book, 'id'>) {
    const id = await db.books.add(book as Book);
    // Create initial session
    await db.sessions.add({
      bookId: id,
      currentChapterIndex: 0,
      currentChunkIndex: 0,
      scrollOffset: 0,
      activeLanguage: book.language
    });
    return id;
  },

  async updateLastOpened(id: number) {
    await db.books.update(id, { lastOpenedAt: Date.now() });
  },

  async toggleFavorite(id: number, currentStatus: boolean) {
    await db.books.update(id, { isFavorite: !currentStatus });
  },

  async togglePinned(id: number, currentStatus: boolean) {
    await db.books.update(id, { isPinned: !currentStatus });
  },

  async update(id: number, update: Partial<Book>) {
    await db.books.update(id, update);
  },

  async delete(id: number) {
    return await db.transaction('rw', [db.books, db.chapters, db.chunks, db.sessions, db.annotations], async () => {
      const chapters = await db.chapters.where({ bookId: id }).toArray();
      const chapterIds = chapters.map(c => c.id!).filter((id): id is number => id !== undefined);
      
      if (chapterIds.length > 0) {
        const chunks = await db.chunks.where('chapterId').anyOf(chapterIds).toArray();
        const chunkIds = chunks.map(c => c.id!).filter((id): id is number => id !== undefined);
        
        if (chunkIds.length > 0) {
          // Delete annotations linked to chunks
          await db.annotations.where('chunkId').anyOf(chunkIds).delete();
          // Delete chunks
          await db.chunks.where('chapterId').anyOf(chapterIds).delete();
        }
      }
      
      // Delete chapters
      await db.chapters.where({ bookId: id }).delete();
      // Delete session
      await db.sessions.where({ bookId: id }).delete();
      // Finally delete the book
      await db.books.delete(id);
    });
  }
};

export const SessionRepository = {
  async getByBookId(bookId: number) {
    return await db.sessions.where({ bookId }).first();
  },

  async update(bookId: number, update: Partial<ReadingSession>) {
    const session = await this.getByBookId(bookId);
    if (session?.id) {
      await db.sessions.update(session.id, update);
    }
  }
};

export const ChapterRepository = {
  async getChaptersForBook(bookId: number) {
    return await db.chapters.where({ bookId }).sortBy('index');
  },

  async getChapterById(id: number) {
    return await db.chapters.get(id);
  }
};

export const ChunkRepository = {
  async getChunksForChapter(chapterId: number) {
    return await db.chunks.where({ chapterId }).sortBy('index');
  }
};
