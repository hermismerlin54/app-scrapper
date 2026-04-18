import { GeminiAdapter } from './GeminiAdapter';
import { TranslationConfig, Chunk } from '../../types';
import { db } from '../../db';

export class TranslationService {
  private adapter = new GeminiAdapter();

  async translateBook(bookId: number, config: TranslationConfig, onProgress?: (current: number, total: number) => void) {
    const chapters = await db.chapters.where({ bookId }).toArray();
    let processed = 0;
    const totalChapters = chapters.length;

    for (const chapter of chapters) {
      const chunks = await db.chunks.where({ chapterId: chapter.id }).toArray();
      
      // Batch processing based on config
      for (let i = 0; i < chunks.length; i += config.batchSize) {
        const batch = chunks.slice(i, i + config.batchSize);
        const texts = batch.map(c => c.originalText);
        
        try {
          const translatedTexts = await this.adapter.translateBatch(texts, config);
          
          await db.transaction('rw', db.chunks, async () => {
            for (let j = 0; j < batch.length; j++) {
              await db.chunks.update(batch[j].id!, {
                translatedText: translatedTexts[j],
                isCached: true
              });
            }
          });
        } catch (error) {
          console.error(`Failed to translate batch starting at chunk ${i}`, error);
        }
      }
      
      processed++;
      if (onProgress) onProgress(processed, totalChapters);
    }
  }

  async translateChunk(chunkId: number, config: TranslationConfig): Promise<string> {
    const chunk = await db.chunks.get(chunkId);
    if (!chunk) throw new Error("Chunk not found");
    
    if (chunk.translatedText) return chunk.translatedText;

    const translated = await this.adapter.translateChunk(chunk.originalText, config);
    await db.chunks.update(chunkId, { translatedText: translated });
    return translated;
  }
}

export const translationService = new TranslationService();
