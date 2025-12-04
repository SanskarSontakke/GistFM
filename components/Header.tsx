import React from 'react';
import { Radio, Sun, Moon, Bookmark } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onToggleBookmarks: () => void;
  showBookmarks: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleBookmarks, showBookmarks }) => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="w-full py-6 px-4 md:px-8 border-b-2 border-app-border bg-app-bg sticky top-0 z-10 transition-colors duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <button 
          onClick={onToggleBookmarks} 
          disabled={!showBookmarks && false /* Always clickable if we implement home logic differently, but for now it acts as 'Home' if active */}
          className="flex items-center gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent rounded-sm"
        >
          <div className="bg-app-accent p-2 rounded-none border-2 border-app-border text-black group-hover:scale-105 transition-transform">
            <Radio size={24} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-app-text tracking-tight uppercase group-hover:text-app-accent-text transition-colors">GistFM</h1>
            <p className="text-sm text-app-accent-text font-bold tracking-wider hidden sm:block">PERSONALIZED NEWS SUMMARIES</p>
          </div>
        </button>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onToggleBookmarks}
            className={`p-2 border-2 transition-all duration-300 ${showBookmarks ? 'bg-app-accent border-app-accent text-black' : 'border-app-border text-app-text hover:bg-app-surface'}`}
            aria-label={showBookmarks ? "Back to Home" : "View Bookmarks"}
          >
             <Bookmark size={24} strokeWidth={2.5} fill={showBookmarks ? "currentColor" : "none"} />
          </button>
          
          <button 
            onClick={toggleTheme}
            className="p-2 border-2 border-app-border text-app-text hover:bg-app-surface transition-colors"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun size={24} strokeWidth={2.5} /> : <Moon size={24} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </header>
  );
};