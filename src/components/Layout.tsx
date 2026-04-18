import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Library, 
  Bolt, 
  Languages, 
  Settings, 
  Search,
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isReaderPage = location.pathname.startsWith('/reader');

  if (isReaderPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top App Bar */}
      <header className="w-full top-0 sticky z-40 bg-stone-200/20 backdrop-blur-xl shadow-sm">
        <div className="relative flex items-center justify-center px-6 py-4 max-w-5xl mx-auto">
          <h1 className="text-xl font-bold text-primary tracking-tight font-serif">Aura Reader</h1>
          
          <div className="absolute right-6 max-w-[200px] hidden md:block">
            <div className="relative flex items-center bg-stone-200/40 rounded-full px-4 py-2 focus-within:ring-1 ring-primary/20">
              <Search size={16} className="text-stone-500 mr-2" />
              <input 
                className="bg-transparent border-none focus:ring-0 w-full text-xs placeholder:text-stone-500" 
                placeholder="Search..." 
                type="text"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto pb-32">
        {children}
      </main>

      {/* FAB - Global Quick Action */}
      <button className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 z-50">
        <Zap size={28} />
      </button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pt-4 pb-8 bg-white/90 backdrop-blur-2xl border-t border-stone-100 rounded-t-[2.5rem]">
        <NavButton to="/" icon={<Library size={24} />} label="Library" />
        <NavButton to="/scraper" icon={<Bolt size={24} />} label="Scraper" />
        <NavButton to="/translation" icon={<Languages size={24} />} label="Translate" />
        <NavButton to="/settings" icon={<Settings size={24} />} label="Settings" />
      </nav>
    </div>
  );
}

function NavButton({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex flex-col items-center transition-all duration-300",
        isActive ? "text-primary" : "text-stone-400 hover:text-primary/70"
      )}
    >
      <div className={cn(
        "flex flex-col items-center",
        to === useLocation().pathname && "bg-primary/5 rounded-full px-4 py-1"
      )}>
        {icon}
        <span className="text-[10px] font-bold mt-1 uppercase tracking-tight">{label}</span>
      </div>
    </NavLink>
  );
}
