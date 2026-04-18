import { GoogleGenAI } from "@google/genai";
import { TranslationAdapter } from "./TranslationAdapter";
import { TranslationConfig } from "../../types";

export class GeminiAdapter extends TranslationAdapter {
  private getClient(config: TranslationConfig) {
    // For AI Studio, we use process.env.GEMINI_API_KEY
    // But if the user provides a custom key in their config, we respect it
    const apiKey = config.apiKey || (process.env.GEMINI_API_KEY as string);
    return new GoogleGenAI({ apiKey });
  }

  async translateChunk(text: string, config: TranslationConfig): Promise<string> {
    const ai = this.getClient(config);
    const systemInstruction = config.systemPrompt || "You are a professional novel translator. Translate accurately while preserving the author's style and tone.";
    
    const response = await ai.models.generateContent({
      model: config.modelName || "gemini-3-flash-preview",
      contents: `Target Language: ${config.targetLanguage}\n\nText to translate:\n${text}`,
      config: {
        systemInstruction,
      },
    });

    return response.text || "";
  }

  async translateBatch(texts: string[], config: TranslationConfig): Promise<string[]> {
    // Gemini handles text well, we can batch them or loop. 
    // For now, let's loop to ensure chunks are mapped correctly, 
    // or use a more sophisticated batching prompt.
    // Given the "batch size" in config, we could combine them into one request with JSON schema.
    
    const results: string[] = [];
    for (const text of texts) {
      results.push(await this.translateChunk(text, config));
    }
    return results;
  }

  async testConnection(config: TranslationConfig): Promise<boolean> {
    try {
      const ai = this.getClient(config);
      await ai.models.generateContent({
        model: config.modelName || "gemini-3-flash-preview",
        contents: "Hi",
      });
      return true;
    } catch (e) {
      console.error("Gemini Test Connection Failed", e);
      return false;
    }
  }
}
