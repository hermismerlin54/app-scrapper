import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Book } from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Languages, 
  Plus, 
  Download, 
  MoreVertical, 
  Trash2, 
  Star, 
  Pin,
  Edit3,
  X,
  Check
} from 'lucide-react';
import { BookRepository } from '../../repositories/DataRepository';

export default function LibraryScreen() {
  const navigate = useNavigate();
  const books = useLiveQuery(async () => {
    const allBooks = await db.books.toArray();
    return allBooks.sort((a, b) => {
      // Pin to top logic
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then sort by last opened
      return b.lastOpenedAt - a.lastOpenedAt;
    });
  });

  if (!books) return null;

  return (
    <div className="px-6 pt-8 pb-32">
      <section className="mb-10">
        <h2 className="text-4xl font-bold mb-4 font-serif">Library</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <FilterChip label="All Books" active />
          <FilterChip label="Favorites" />
          <FilterChip label="Offline Only" />
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        {books.map((book, idx) => (
          <BookCard key={book.id || idx} book={book} onClick={() => navigate(`/reader/${book.id}`)} />
        ))}

        <div 
          onClick={() => navigate('/scraper')}
          className="border-2 border-dashed border-stone-300 rounded-xl aspect-[2/3] flex flex-col items-center justify-center gap-3 hover:bg-stone-50 transition-colors group cursor-pointer"
        >
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="text-stone-400" />
          </div>
          <p className="text-xs font-bold text-stone-500">Scrape URL</p>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
      active 
        ? "bg-primary text-white" 
        : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
    }`}>
      {label}
    </span>
  );
}

interface BookCardProps {
  book: Book;
  onClick: () => void;
  key?: any;
}

function BookCard({ book, onClick }: BookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(book.title);
  const [editCover, setEditCover] = useState(book.coverUrl || '');
  const menuRef = useRef<HTMLDivElement>(null);

  // Mock progress
  const progress = Math.floor(Math.random() * 100);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (book.id && window.confirm(`Delete "${book.title}"?`)) {
      await BookRepository.delete(book.id);
    }
    setShowMenu(false);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (book.id) {
      await BookRepository.toggleFavorite(book.id, !!book.isFavorite);
    }
    setShowMenu(false);
  };

  const handleTogglePinned = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (book.id) {
      await BookRepository.togglePinned(book.id, !!book.isPinned);
    }
    setShowMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(book.title);
    setEditCover(book.coverUrl || '');
    setShowEditModal(true);
    setShowMenu(false);
  };

  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (book.id) {
      await BookRepository.update(book.id, {
        title: editTitle,
        coverUrl: editCover
      });
    }
    setShowEditModal(false);
  };

  return (
    <div className="group relative cursor-pointer" onClick={onClick}>
      <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-xl shadow-md bg-stone-100 transition-transform group-hover:-translate-y-2">
        {book.coverUrl ? (
          <img 
            className="w-full h-full object-cover" 
            src={book.coverUrl} 
            alt={book.title}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container-high text-primary/40 uppercase font-bold text-center p-4">
            {book.title}
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {book.sourceType === 'scraped' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">Scraped</span>
          )}
          {book.isPinned && (
             <div className="bg-primary text-white p-1 rounded shadow-sm">
                <Pin size={10} className="fill-current" />
             </div>
          )}
          {book.isFavorite && (
              <div className="bg-amber-400 text-white p-1 rounded shadow-sm">
                 <Star size={10} className="fill-current" />
              </div>
          )}
        </div>

        {/* More Options Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-black/70"
        >
          <MoreVertical size={16} />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div 
            ref={menuRef}
            className="absolute top-10 right-2 w-32 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-20 text-stone-700 overflow-hidden"
          >
            <button 
              onClick={handleTogglePinned}
              className="w-full px-3 py-2 text-left text-[11px] font-bold flex items-center gap-2 hover:bg-stone-50 active:bg-stone-100"
            >
              <Pin size={14} className={book.isPinned ? "text-primary fill-current" : ""} />
              {book.isPinned ? 'Unpin' : 'Pin to Top'}
            </button>
            <button 
              onClick={handleToggleFavorite}
              className="w-full px-3 py-2 text-left text-[11px] font-bold flex items-center gap-2 hover:bg-stone-50 active:bg-stone-100"
            >
              <Star size={14} className={book.isFavorite ? "text-amber-500 fill-current" : ""} />
              {book.isFavorite ? 'Unfavorite' : 'Favorite'}
            </button>
            <button 
              onClick={handleEdit}
              className="w-full px-3 py-2 text-left text-[11px] font-bold flex items-center gap-2 hover:bg-stone-50 active:bg-stone-100"
            >
              <Edit3 size={14} />
              Edit Details
            </button>
            <div className="h-px bg-stone-100 mx-2" />
            <button 
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-[11px] font-bold flex items-center gap-2 hover:bg-red-50 text-red-600 active:bg-red-100"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
        
        <div className="absolute bottom-2 right-2 bg-primary/90 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          <Languages size={14} />
        </div>
      </div>
      
      <h3 className="font-bold text-md leading-tight mb-1 line-clamp-2">{book.title}</h3>
      <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-2">{book.author || 'Anonymous'}</p>
      
      <div className="space-y-1.5">
        <div className="h-1 w-full bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between text-[9px] font-bold text-stone-400">
          <span>{progress}% READ</span>
          <span>Active</span>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          onClick={(e) => { e.stopPropagation(); setShowEditModal(false); }}
        >
          <div 
            className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 pt-8 pb-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-serif">Edit Novel</h2>
                <button onClick={() => setShowEditModal(false)} className="text-stone-400">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={saveChanges} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 ml-1">Title</label>
                  <input 
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all"
                    placeholder="Enter novel title..."
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 ml-1">Cover Image URL</label>
                  <input 
                    value={editCover}
                    onChange={(e) => setEditCover(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none transition-all font-mono"
                    placeholder="https://example.com/cover.jpg"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 text-sm font-bold text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Check size={18} />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
            <div className="h-2 bg-primary/10 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
