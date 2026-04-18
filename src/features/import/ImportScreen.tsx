import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookRepository } from '../../repositories/DataRepository';
import { Upload, Book as BookIcon } from 'lucide-react';

export default function ImportScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = async () => {
    if (!title || !content) return;
    setIsProcessing(true);

    try {
      const bookId = await BookRepository.create({
        title,
        author: 'Imported',
        category: 'Manuscript',
        sourceType: 'imported',
        createdAt: Date.now(),
        lastOpenedAt: Date.now(),
        totalChapters: 1, // Simple import
        language: 'en'
      });
      navigate(`/reader/${bookId}`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="px-6 pt-8 pb-32">
      <div className="mb-10">
        <h2 className="text-3xl font-serif font-bold text-on-surface mb-2">Import Text</h2>
        <p className="text-on-surface-variant font-sans text-sm">Add your next reading masterpiece to your private library.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="relative bg-surface-container-low rounded-xl p-1 shadow-sm border border-outline-variant/15">
            <div className="flex items-center justify-between px-4 py-2 bg-surface-container-high/50 rounded-t-lg">
              <span className="font-sans text-[11px] uppercase tracking-widest text-on-surface-variant font-semibold">Manuscript Content</span>
            </div>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[500px] bg-transparent border-none focus:ring-0 p-6 font-serif text-lg leading-relaxed placeholder:text-outline resize-none focus:outline-none" 
              placeholder="Paste or type your text here..."
            />
          </div>

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-outline-variant/20 border-dashed rounded-xl cursor-pointer bg-surface-container-low hover:bg-surface-container transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload size={32} className="text-primary mb-2" />
                <p className="mb-1 text-sm text-on-surface font-sans font-medium">Or upload a <span className="text-primary">.txt file</span></p>
                <p className="text-xs text-on-surface-variant font-sans opacity-70">Limit 10MB per file</p>
              </div>
              <input accept=".txt" className="hidden" type="file" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setContent(ev.target?.result as string);
                  reader.readAsText(file);
                }
              }} />
            </label>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <div className="space-y-3">
            <label className="font-sans text-xs uppercase tracking-widest text-on-surface-variant font-bold px-1">Book Title</label>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-4 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/20 font-serif text-lg text-on-surface placeholder:text-outline/60" 
              placeholder="e.g., Meditations on the Digital Soul" 
              type="text"
            />
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSave}
              disabled={isProcessing}
              className="w-full bg-primary text-white py-5 rounded-full font-serif text-lg font-semibold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <BookIcon size={24} />
              {isProcessing ? 'Processing...' : 'Save Book'}
            </button>
            <p className="text-center mt-4 text-[11px] font-sans text-on-surface-variant italic">The curator's touch is final. This will be added to My Shelf.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
