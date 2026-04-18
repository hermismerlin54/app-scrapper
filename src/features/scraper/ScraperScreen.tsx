import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scraperService, ScrapingEvent } from './ScraperService';
import { 
  Terminal, 
  Bolt, 
  Trash2, 
  Filter, 
  Play, 
  BookOpen, 
  Pause, 
  ChevronRight,
  Clock,
  Activity,
  Globe
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ScraperScreen() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [numChapters, setNumChapters] = useState(50);
  const [cpm, setCpm] = useState(5);
  const [siteType, setSiteType] = useState('generic');
  
  const [logs, setLogs] = useState<{ message: string; status?: string; id: number }[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [stats, setStats] = useState({
    current: 0,
    total: 0,
    speed: 0,
    eta: 0,
    lastResponse: 'Idle'
  });
  const [lastBookId, setLastBookId] = useState<number | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (message: string, status?: string) => {
    setLogs(prev => [...prev, { message, status, id: Date.now() + Math.random() }]);
  };

  const startScraping = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || !trimmedUrl.startsWith('http')) {
      addLog('Error: Please provide a valid URL starting with http:// or https://', 'error');
      return;
    }
    
    if (trimmedUrl.includes('SECURITY BLOCK') || (trimmedUrl.includes('error') && trimmedUrl.length > 100)) {
      addLog('Error: It looks like you pasted an error message into the URL field. Please use the original novel URL.', 'error');
      return;
    }

    setIsExtracting(true);
    setLogs([{ message: 'Engine Initializing...', status: 'info', id: Date.now() }]);
    setStats(s => ({ ...s, current: 0, total: numChapters, speed: 0, eta: 0 }));
    
    await scraperService.scrapeNovel(trimmedUrl, numChapters, cpm, (ev: ScrapingEvent) => {
      switch (ev.type) {
        case 'log':
          addLog(ev.message, ev.status);
          if (ev.status === 'error') setStats(s => ({ ...s, lastResponse: 'Block/Error' }));
          else setStats(s => ({ ...s, lastResponse: '200 OK' }));
          break;
        case 'progress':
          setStats(s => ({ 
            ...s, 
            current: ev.current, 
            total: ev.total,
            speed: ev.speed || 0,
            eta: ev.remainingTime || 0,
            lastResponse: 'Receiving'
          }));
          break;
        case 'complete':
          addLog('Extraction complete! Data synced to library.', 'success');
          setIsExtracting(false);
          setLastBookId(ev.bookId);
          setStats(s => ({ ...s, lastResponse: 'Idle' }));
          break;
      }
    });
  };

  return (
    <div className="p-6 bg-[#0a0a0b] min-h-screen text-stone-400 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-stone-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Bolt className="text-amber-500" fill="currentColor" />
              Web Novel Scraper Panel
            </h1>
            <p className="text-xs uppercase tracking-widest text-stone-600 mt-1">Advanced Reading Engine // Module v4.1</p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-stone-900 rounded-lg border border-stone-800">
              <div className={cn("w-2 h-2 rounded-full", isExtracting ? "bg-amber-500 animate-pulse" : "bg-stone-700")} />
              <span className="text-[10px] font-bold uppercase">{isExtracting ? 'Engine Active' : 'System Ready'}</span>
            </div>
            {lastBookId && (
               <button 
                onClick={() => navigate(`/reader/${lastBookId}`)}
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
              >
                <BookOpen size={14} /> Open in Reader
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column - Controls */}
          <aside className="lg:col-span-4 space-y-4">
            
            {/* Section 1: URL Input */}
            <div className="bg-stone-900/50 border border-stone-800/50 p-5 rounded-2xl">
              <label className="text-[10px] font-bold text-stone-600 uppercase mb-3 block tracking-tighter">Section 1 — URL Input</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-3 text-stone-600" />
                <input 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste Chapter 1 URL..."
                  className="w-full bg-black border border-stone-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-stone-200 focus:ring-1 ring-amber-500/50 transition-all outline-none"
                />
              </div>
              <p className="text-[9px] text-stone-600 italic mt-2">Example: https://novelbin.com/b/my-novel/chapter-1</p>
            </div>

            {/* Section 2 & 3: Chapter Range & Rate Limit */}
            <div className="bg-stone-900/50 border border-stone-800/50 p-5 rounded-2xl grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-stone-600 uppercase block tracking-tighter">Chapter Range</label>
                <input 
                  type="number" 
                  value={numChapters}
                  onChange={(e) => setNumChapters(Number(e.target.value))}
                  className="w-full bg-black border border-stone-800 rounded-xl py-2 px-3 text-sm text-stone-200 outline-none focus:border-stone-600"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-stone-600 uppercase block tracking-tighter">Rate Limit (CPM)</label>
                <input 
                  type="number" 
                  value={cpm}
                  onChange={(e) => setCpm(Number(e.target.value))}
                  className="w-full bg-black border border-stone-800 rounded-xl py-2 px-3 text-sm text-stone-200 outline-none focus:border-stone-600"
                />
              </div>
              <div className="col-span-2 pt-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-stone-600 uppercase">
                  <span>Calculated Delay:</span>
                  <span className="text-amber-500/80">{(60 / cpm).toFixed(1)}s / chapter</span>
                </div>
              </div>
            </div>

            {/* Section 4: Website Type */}
            <div className="bg-stone-900/50 border border-stone-800/50 p-5 rounded-2xl space-y-3">
              <label className="text-[10px] font-bold text-stone-600 uppercase block tracking-tighter">Section 4 — Website Type</label>
              <select 
                value={siteType}
                onChange={(e) => setSiteType(e.target.value)}
                className="w-full bg-black border border-stone-800 rounded-xl py-2.5 px-4 text-sm text-stone-200 outline-none appearance-none cursor-pointer"
              >
                <option value="novelbin">NovelBin</option>
                <option value="webnovel">Webnovel</option>
                <option value="generic">Generic Web Novel Site (Auto)</option>
              </select>
            </div>

            {/* Section 5: Start Button */}
            <button 
              onClick={startScraping}
              disabled={isExtracting}
              className={cn(
                "w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-sm tracking-tight transition-all active:scale-[0.98] shadow-xl",
                isExtracting 
                  ? "bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700" 
                  : "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/10"
              )}
            >
              {isExtracting ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              {isExtracting ? "PAUSE EXTRACTION" : "START SCRAPING"}
            </button>

            {/* Mini Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
               <div className="flex items-center gap-2 mb-1">
                  <Activity size={10} className="text-stone-600" />
                  <span className="text-[9px] font-bold text-stone-600 uppercase">Efficiency</span>
               </div>
                <p className="text-lg font-mono text-stone-300">{stats.speed}<span className="text-xs ml-1 opacity-50">CPM</span></p>
              </div>
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-xl">
               <div className="flex items-center gap-2 mb-1">
                  <Clock size={10} className="text-stone-600" />
                  <span className="text-[9px] font-bold text-stone-600 uppercase">Wait Time</span>
               </div>
                <p className="text-lg font-mono text-stone-300">{Math.floor(stats.eta / 60)}m<span className="text-xs ml-1 opacity-50">{stats.eta % 60}s</span></p>
              </div>
            </div>

          </aside>

          {/* Right Column - Console & Status */}
          <main className="lg:col-span-8 space-y-4">
            
            {/* Section 6: Scraping Status Panel */}
            <div className="bg-stone-900/30 border border-stone-800/30 rounded-2xl overflow-hidden flex flex-col h-[550px]">
              
              {/* Toolbar */}
              <div className="px-6 py-4 bg-stone-900/50 border-b border-stone-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Terminal size={14} className="text-amber-500" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-white uppercase">CONSOLE::LOGS</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-[10px] font-mono text-stone-500 flex items-center gap-2 mr-4">
                      STATUS: <span className={cn(
                        stats.lastResponse.includes('OK') ? "text-emerald-500" : 
                        stats.lastResponse.includes('Error') ? "text-red-500" : "text-amber-500"
                      )}>{stats.lastResponse}</span>
                   </div>
                   <button onClick={() => setLogs([])} className="p-1.5 hover:bg-stone-800 rounded transition-colors text-stone-600 hover:text-stone-300">
                    <Trash2 size={14} />
                   </button>
                   <button className="p-1.5 hover:bg-stone-800 rounded transition-colors text-stone-600">
                    <Filter size={14} />
                   </button>
                </div>
              </div>

              {/* Log Window */}
              <div className="flex-grow overflow-y-auto p-6 font-mono text-[12px] space-y-1.5 custom-scrollbar">
                {logs.length === 0 && (
                  <div className="h-full flex items-center justify-center opacity-10 pointer-events-none">
                    <Bolt size={120} />
                  </div>
                )}
                {logs.map((log, idx) => (
                  <div key={log.id} className="flex gap-4 group">
                    <span className="text-stone-800 w-8 select-none">{String(idx + 1).padStart(3, '0')}</span>
                    <span className={cn(
                      "font-bold uppercase",
                      log.status === 'info' ? "text-stone-600" :
                      log.status === 'success' ? "text-emerald-600" :
                      log.status === 'warning' ? "text-amber-500" :
                      log.status === 'error' ? "text-red-600" : "text-amber-600"
                    )}>
                      {log.status || 'system'}
                    </span>
                    <span className={cn("flex-grow", log.status === 'error' ? 'text-red-400/80 font-bold' : 'text-stone-400')}>{log.message}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>

              {/* Status Bar */}
              <div className="p-6 bg-black/40 border-t border-stone-800">
                <div className="flex justify-between items-end mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <h3 className="text-[11px] font-bold text-white uppercase tracking-tight">Deployment Progress</h3>
                       <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded font-mono">RC-1</span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-medium">Synced: {stats.current} / {stats.total} Chapters Extracted</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-mono text-white font-bold">{stats.total > 0 ? ((stats.current / stats.total) * 100).toFixed(1) : '0.0'}%</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden flex p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-300 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                    style={{ width: `${stats.total > 0 ? (stats.current / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

            </div>

            {/* Advanced Options Bar */}
            <div className="bg-stone-900/20 border border-stone-800/50 p-4 rounded-xl flex justify-between items-center text-[10px] font-bold uppercase tracking-widest px-8">
              <span className="text-stone-600">Advanced Nodes:</span>
              <div className="flex gap-6">
                <button className="text-stone-500 hover:text-amber-500 transition-colors">Skip Broken</button>
                <div className="w-px h-3 bg-stone-800 self-center"></div>
                <button className="text-stone-500 hover:text-amber-500 transition-colors">Manual Pattern</button>
                <div className="w-px h-3 bg-stone-800 self-center"></div>
                <button className="text-stone-500 hover:text-amber-500 transition-colors">Preview Node</button>
              </div>
            </div>

          </main>
        </div>

      </div>
    </div>
  );
}
