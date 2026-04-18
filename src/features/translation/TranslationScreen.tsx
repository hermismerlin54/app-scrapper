import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { translationService } from './TranslationService';
import { TranslationConfig } from '../../types';
import { Languages, Sparkles, Edit, RefreshCcw } from 'lucide-react';

export default function TranslationScreen() {
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [mode, setMode] = useState<'batch' | 'live'>('batch');

  const books = useLiveQuery(() => db.books.toArray());
  const selectedBook = useLiveQuery(() => selectedBookId ? db.books.get(selectedBookId) : undefined, [selectedBookId]);

  const handleTranslate = async () => {
    if (!selectedBookId) return;
    setIsTranslating(true);

    const config: TranslationConfig = {
      apiEndpoint: '',
      apiKey: '',
      modelName: 'gemini-3-flash-preview',
      systemPrompt: 'Translate this novel content accurately.',
      targetLanguage: 'Spanish',
      batchSize: 3,
      apiType: 'openai'
    };

    try {
      await translationService.translateBook(selectedBookId, config, (current, total) => {
        setProgress({ current, total });
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="md:col-span-9 bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-stone-400 uppercase">Target Novel</span>
              <select 
                className="text-sm font-bold bg-transparent border-none p-0 focus:ring-0"
                value={selectedBookId || ''}
                onChange={(e) => setSelectedBookId(Number(e.target.value))}
              >
                <option value="">Select a book...</option>
                {books?.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-primary uppercase">Target Language</span>
              <select className="text-sm font-bold text-primary bg-transparent border-none p-0 focus:ring-0">
                <option>Spanish (Castilian)</option>
                <option>Arabic (Modern Standard)</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 animate-pulse">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">
                {isTranslating ? 'Translator Busy' : 'Isolate Worker Ready'}
              </span>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 bg-stone-900 rounded-2xl p-1 flex">
          <button 
            onClick={() => setMode('batch')}
            className={`flex-1 text-[10px] font-bold py-2 rounded-xl transition-all ${mode === 'batch' ? 'bg-primary text-white' : 'text-stone-500'}`}
          >
            BATCH MODE
          </button>
          <button 
            onClick={() => setMode('live')}
            className={`flex-1 text-[10px] font-bold py-2 rounded-xl transition-all ${mode === 'live' ? 'bg-primary text-white' : 'text-stone-500'}`}
          >
            LIVE EDIT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-320px)]">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-stone-500 uppercase">Source manuscript</span>
            <span className="text-[10px] font-mono text-stone-400">{selectedBook?.title || 'No book selected'}</span>
          </div>
          <div className="flex-grow bg-white border border-stone-200 rounded-[2rem] p-8 shadow-inner overflow-y-auto custom-scrollbar">
            {isTranslating ? (
               <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-400">
                <RefreshCcw className="animate-spin" size={48} />
                <p className="font-bold text-sm">Processing Chapters... {progress.current}/{progress.total}</p>
                <div className="w-full max-w-xs h-1 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                </div>
               </div>
            ) : (
              <div className="space-y-4 opacity-40">
                <p className="text-lg leading-[1.8] font-serif italic">Select a book and click "Bulk Translate" to process all chapters using Gemini AI.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-primary uppercase">Translation Preview</span>
            <span className="text-[10px] font-bold text-emerald-600">60FPS RENDER READY</span>
          </div>
          <div className="flex-grow bg-stone-50 border border-stone-200 rounded-[2rem] p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between">
            <div className="space-y-8">
               <p className="text-lg leading-[1.8] opacity-60 font-serif">Translated content will appear here in real-time as the background worker processes batches.</p>
            </div>

            <div className="pt-4 border-t border-stone-100 flex justify-end">
              <button 
                onClick={handleTranslate}
                disabled={!selectedBookId || isTranslating}
                className="bg-primary text-white px-8 py-3 rounded-full font-bold text-sm flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <Languages size={18} />
                Bulk Translate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
