import React from 'react';
import { Bookmark } from '../types';
import { Trash2, ArrowRight, Calendar, FileText } from 'lucide-react';

interface BookmarksListProps {
  bookmarks: Bookmark[];
  onLoad: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const BookmarksList: React.FC<BookmarksListProps> = ({ bookmarks, onLoad, onDelete, onClose }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h2 className="text-3xl md:text-4xl font-black text-app-text tracking-tighter uppercase mb-2">Saved Summaries</h2>
           <p className="text-app-muted font-mono text-sm uppercase tracking-widest">Your personal archive</p>
        </div>
        <button 
           onClick={onClose}
           className="text-sm font-bold uppercase tracking-wide border-2 border-app-border px-4 py-2 hover:bg-app-surface-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
        >
          Close
        </button>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-app-muted/30 rounded-sm">
          <FileText size={48} className="mx-auto text-app-muted mb-4 opacity-50" />
          <p className="text-xl text-app-text font-bold uppercase tracking-wide">No bookmarks yet</p>
          <p className="text-app-muted mt-2">Generate a summary and click the star icon to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookmarks.map((bookmark) => (
            <div 
              key={bookmark.id} 
              className="group bg-app-input border-2 border-app-border p-6 hover:shadow-[4px_4px_0px_0px_var(--app-accent)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-app-border/20 pb-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-app-muted uppercase tracking-wider">
                    <Calendar size={14} />
                    <span>{new Date(bookmark.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className="text-xs font-bold bg-app-surface px-2 py-1 rounded-sm uppercase tracking-wide border border-app-border/50 text-app-text">
                    {bookmark.tone}
                  </span>
                </div>
                
                <p className="text-app-text font-serif line-clamp-4 mb-6 leading-relaxed">
                  {bookmark.preview}...
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 mt-auto">
                <button
                  onClick={() => onDelete(bookmark.id)}
                  className="text-app-muted hover:text-red-500 transition-colors p-2 -ml-2 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  aria-label="Delete bookmark"
                >
                  <Trash2 size={20} strokeWidth={2} />
                </button>
                
                <button
                  onClick={() => onLoad(bookmark)}
                  className="flex items-center gap-2 text-app-accent-text font-bold uppercase text-sm tracking-wide group-hover:underline underline-offset-4 decoration-2 decoration-app-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent rounded-sm px-1"
                >
                  <span>Read Script</span>
                  <ArrowRight size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};