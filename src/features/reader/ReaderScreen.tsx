import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { SessionRepository, ChunkRepository } from '../../repositories/DataRepository';
import { Book, Chapter, Chunk } from '../../types';
import { 
  ChevronLeft, 
  Settings, 
  Type, 
  Languages, 
  Bookmark, 
  Maximize2,
  ChevronRight,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ReaderScreen() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const id = Number(bookId);

  const book = useLiveQuery(() => db.books.get(id), [id]);
  const session = useLiveQuery(() => SessionRepository.getByBookId(id), [id]);
  const chapters = useLiveQuery(() => db.chapters.where({ bookId: id }).sortBy('index'), [id]);
  
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('sepia');
  
  const currentChapter = chapters?.[currentChapterIndex];
  const chunks = useLiveQuery(() => 
    currentChapter ? db.chunks.where({ chapterId: currentChapter.id }).sortBy('index') : Promise.resolve([])
  , [currentChapter]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync session with state
  useEffect(() => {
    if (session) {
      setCurrentChapterIndex(session.currentChapterIndex);
    }
  }, [session]);

  const toggleControls = () => setShowControls(!showControls);

  const saveProgress = async (chunkIndex: number) => {
    await SessionRepository.update(id, {
      currentChapterIndex,
      currentChunkIndex: chunkIndex,
      lastReadAt: Date.now()
    });
  };

  const themes = {
    light: "bg-white text-stone-900",
    sepia: "bg-[#f4ecd8] text-[#5b4636]",
    dark: "bg-stone-950 text-stone-300"
  };

  if (!book || !chapters) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex flex-col transition-colors duration-500 ${themes[theme]}`}>
      {/* Top Bar */}
      <AnimatePresence>
        {showControls && (
          <motion.header 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="h-16 flex items-center justify-between px-6 bg-transparent backdrop-blur-md border-b border-black/5 z-10"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-sm font-bold line-clamp-1">{book.title}</h1>
                <p className="text-[10px] uppercase tracking-widest opacity-60">
                  Chapter {currentChapterIndex + 1}: {currentChapter?.title || 'Untitled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-black/5 rounded-full"><Bookmark size={20} /></button>
              <button className="p-2 hover:bg-black/5 rounded-full"><List size={20} /></button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Reading Surface */}
      <main 
        ref={containerRef}
        onClick={toggleControls}
        className="flex-grow overflow-y-auto custom-scrollbar px-6 py-12 md:px-[20%] lg:px-[25%]"
      >
        <div className="max-w-prose mx-auto">
          {chunks && chunks.length > 0 ? (
            chunks.map((chunk, idx) => (
              <ChunkView 
                key={chunk.id} 
                chunk={chunk} 
                fontSize={fontSize} 
                onVisible={() => saveProgress(idx)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40 py-20">
              <BookOpen size={64} className="animate-pulse" />
              <p className="font-serif italic">This chapter is still in the void...</p>
              <button 
                 onClick={() => navigate('/scraper')}
                 className="text-xs font-bold underline text-primary"
              >
                Go to Scraper
              </button>
            </div>
          )}
          
          {/* Navigation */}
          <div className="mt-20 pb-20 flex justify-between items-center border-t border-black/10 pt-10">
            <button 
              disabled={currentChapterIndex === 0}
              onClick={(e) => { e.stopPropagation(); setCurrentChapterIndex(prev => prev - 1); }}
              className="flex items-center gap-2 font-bold text-sm opacity-60 hover:opacity-100 disabled:opacity-20"
            >
              <ChevronLeft size={20} /> Previous
            </button>
            <span className="text-xs font-serif italic">End of Chapter</span>
            <button 
              disabled={currentChapterIndex === chapters.length - 1}
              onClick={(e) => { e.stopPropagation(); setCurrentChapterIndex(prev => prev + 1); }}
              className="flex items-center gap-2 font-bold text-sm opacity-60 hover:opacity-100 disabled:opacity-20"
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.footer 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] shadow-2xl p-2 z-10"
          >
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-1">
                <ControlOption icon={<Type size={18} />} onClick={() => setFontSize(f => Math.min(f + 2, 32))} />
                <ControlOption icon={<span className="text-xs font-bold">-</span>} onClick={() => setFontSize(f => Math.max(f - 2, 12))} />
              </div>

              <div className="h-8 w-px bg-white/20 mx-2"></div>

              <div className="flex items-center gap-2">
                <ThemeDot color="bg-white" active={theme === 'light'} onClick={() => setTheme('light')} />
                <ThemeDot color="bg-[#f4ecd8]" active={theme === 'sepia'} onClick={() => setTheme('sepia')} />
                <ThemeDot color="bg-stone-900" active={theme === 'dark'} onClick={() => setTheme('dark')} />
              </div>

              <div className="h-8 w-px bg-white/20 mx-2"></div>

              <div className="flex items-center gap-1">
                <ControlOption icon={<Languages size={18} />} />
                <ControlOption icon={<Settings size={18} />} onClick={() => navigate('/settings')} />
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ChunkViewProps {
  chunk: Chunk;
  fontSize: number;
  onVisible: () => void;
  key?: any;
}

function ChunkView({ chunk, fontSize, onVisible }: ChunkViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onVisible();
      }
    }, { threshold: 0.5 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mb-8 last:mb-0">
      <p 
        className="font-serif leading-[1.8] text-justify transition-all duration-300"
        style={{ fontSize: `${fontSize}px` }}
      >
        {chunk.translatedText || chunk.originalText}
      </p>
    </div>
  );
}

function ControlOption({ icon, onClick }: { icon: any; onClick?: () => void }) {
  return (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-on-surface transition-colors"
    >
      {icon}
    </button>
  );
}

function ThemeDot({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-all ${color} ${active ? 'border-primary ring-2 ring-primary/20 scale-110' : 'border-transparent'}`} 
    />
  );
}

function BookOpen(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}
