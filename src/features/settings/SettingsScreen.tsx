import React from 'react';
import { Settings as SettingsIcon, MemoryStick, Shield, Database, ChevronRight, Trash2, Lock } from 'lucide-react';

export default function SettingsScreen() {
  return (
    <div className="max-w-5xl mx-auto p-6 mt-6 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3 space-y-2">
          <nav className="space-y-1">
            <SidebarItem icon={<SettingsIcon size={18} />} label="Appearance" active />
            <SidebarItem icon={<MemoryStick size={18} />} label="Engine Logic" />
            <SidebarItem icon={<Shield size={18} />} label="API Keys" />
          </nav>
        </aside>

        <div className="lg:col-span-9 space-y-12">
          <section className="space-y-6">
            <Header label="Engine Core" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingCard title="Max Chunk Size" value="1000 Chars" description="The atomic unit for translation and rendering efficiency.">
                <input type="range" min="500" max="2000" step="100" defaultValue="1000" className="w-full accent-primary h-1 bg-stone-200 rounded-full appearance-none" />
              </SettingCard>
              <SettingCard title="Parallel Isolates" value="4 Workers" description="Number of concurrent background workers for translation.">
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-stone-100 rounded-lg text-xs font-bold">Low</button>
                  <button className="flex-1 py-2 bg-primary text-white rounded-lg text-xs font-bold">Balanced</button>
                  <button className="flex-1 py-2 bg-stone-100 rounded-lg text-xs font-bold">Ultra</button>
                </div>
              </SettingCard>
            </div>
          </section>

          <section className="space-y-6">
            <Header label="AI & Secure Storage" />
            <div className="bg-white border border-stone-100 p-6 rounded-3xl shadow-sm space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Provider API Key</label>
                  <span className="text-[9px] font-bold text-safe-green flex items-center gap-1">
                    <Lock size={10} /> Encrypted in SecureStorage
                  </span>
                </div>
                <div className="flex gap-2">
                  <input type="password" spellCheck={false} className="flex-1 bg-stone-50 border-stone-200 border rounded-xl py-3 px-4 font-mono text-xs focus:ring-1 ring-primary" value="sk-••••••••••••••••" readOnly />
                  <button className="bg-primary text-white px-6 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity uppercase tracking-widest">Verify</button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <Header label="Database & Assets" />
            <div className="bg-white border border-stone-200 rounded-[2rem] overflow-hidden shadow-sm">
              <div className="divide-y divide-stone-100">
                <ListItem icon={<Database size={20} />} title="Vacuum Database" subtitle="Current Size: 14.2 MB • Optimize SQLite" />
                <ListItem icon={<Trash2 size={20} className="text-error-red" />} title="Full System Purge" subtitle="Wipe Drift DB & Secure Store" danger />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
      active ? "bg-primary text-white shadow-md" : "text-stone-500 hover:bg-stone-100"
    }`}>
      {icon} {label}
    </button>
  );
}

function Header({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 px-1">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">{label}</h2>
      <div className="h-px flex-grow bg-stone-200"></div>
    </div>
  );
}

function SettingCard({ title, value, description, children }: { title: string; value: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/60 backdrop-blur-md border border-stone-200 p-6 rounded-2xl space-y-3 hover:bg-white transition-all shadow-sm">
      <div className="flex justify-between items-center">
        <h4 className="font-bold text-sm">{title}</h4>
        <span className="font-mono text-xs font-bold text-primary">{value}</span>
      </div>
      {children}
      <p className="text-[9px] text-stone-400 leading-relaxed italic">{description}</p>
    </div>
  );
}

function ListItem({ icon, title, subtitle, danger = false }: { icon: any; title: string; subtitle: string; danger?: boolean }) {
  return (
    <div className={`px-6 py-5 flex items-center justify-between hover:bg-stone-50 cursor-pointer transition-colors group ${danger ? 'hover:bg-red-50' : ''}`}>
      <div className="flex gap-4 items-center">
        <span className={danger ? '' : 'text-stone-400 group-hover:text-primary transition-colors'}>{icon}</span>
        <div>
          <p className={`font-bold text-sm ${danger ? 'text-error-red' : ''}`}>{title}</p>
          <p className={`text-[10px] uppercase tracking-tighter ${danger ? 'text-error-red opacity-50' : 'text-stone-400'}`}>{subtitle}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-stone-300" />
    </div>
  );
}
