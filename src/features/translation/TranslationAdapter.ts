import { TranslationConfig } from '../../types';

export abstract class TranslationAdapter {
  abstract translateBatch(texts: string[], config: TranslationConfig): Promise<string[]>;
  abstract translateChunk(text: string, config: TranslationConfig): Promise<string>;
  abstract testConnection(config: TranslationConfig): Promise<boolean>;
}
