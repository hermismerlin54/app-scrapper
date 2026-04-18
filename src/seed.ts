/**
 * Seed data utility for Aura Reader to populate initial library state.
 */
import { BookRepository } from './repositories/DataRepository';

export async function seedDatabase() {
  const books = await BookRepository.getAll();
  if (books.length === 0) {
    console.log('Seeding initial library data...');
    await BookRepository.create({
      title: "The Philosophy of Stillness",
      author: "Marcus Aurelius",
      category: "Philosophy",
      sourceType: "scraped",
      createdAt: Date.now(),
      lastOpenedAt: Date.now(),
      totalChapters: 12,
      language: "en",
      coverUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPTokN1_mD4DWY90-ezlYO5UGH95eGz28gNfXQkti7yzbLLN2Osy3rq-prwyMZkWHOPl71UvgjKLGsDUJr0eFxwPxnRRHfeDiDwkZ3Jby-qHO_sNmFM5eOJqZPIUsGJPl1YQ3SFwZzpkSdBOccqvr73QiwFxbc8SoKUV9MUWDTgzWnwPTPVpdRYu064MgClql3dFVCycGnk8CVq1xaaIQ5_-SO7wBiCCONNCMHziIqydJg7h-2uYhDzzMI9dyPNXsuafcytbU3Kuc"
    });
    
    await BookRepository.create({
      title: "The Alchemist's Shadow",
      author: "H.P. Lovecraft",
      category: "Horror",
      sourceType: "imported",
      createdAt: Date.now(),
      lastOpenedAt: Date.now(),
      totalChapters: 8,
      language: "en"
    });
  }
}
