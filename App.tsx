import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { ResultView } from './components/ResultView';
import { BookmarksList } from './components/BookmarksList';
import { generateSummaryScript, generateSpeechFromText } from './services/gemini';
import { fetchArticleFromUrl } from './utils/scraper';
import { saveBookmark, removeBookmark, getBookmarks } from './utils/storage';
import { AppState, SummaryTone, VoiceName, Bookmark } from './types';
import { Sparkles, Loader2, AlertCircle, Globe, ArrowRight, Check, X } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';

// --- UI Helpers ---

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-app-border/10 animate-pulse rounded-sm ${className}`} />
);

const ShimmerOverlay: React.FC = () => (
  <div className="absolute inset-0 bg-app-input/90 z-10 p-6 flex flex-col gap-4 backdrop-blur-[1px]">
    <div className="flex items-center gap-3 text-app-accent-text mb-2">
      <Loader2 className="animate-spin" size={20} />
      <span className="font-bold uppercase tracking-wider text-sm">Extracting Content...</span>
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
    <Skeleton className="h-4 w-full" />
  </div>
);

const LoadingView: React.FC<{ appState: AppState; script: string }> = ({ appState, script }) => {
  const isAudioStep = appState === AppState.GENERATING_AUDIO;
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* Progress Indicator */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
        <div className={`flex items-center gap-3 px-4 py-2 border-2 transition-all ${
            !isAudioStep
                ? 'border-app-accent text-app-accent-text bg-app-surface' 
                : 'border-app-border bg-app-input text-app-text'
        }`}>
            {!isAudioStep ? (
                <Loader2 className="animate-spin" size={18}/>
            ) : (
                <Check size={18} strokeWidth={3} />
            )}
            <span className="font-bold uppercase tracking-wider text-sm">
                {!isAudioStep ? 'Drafting Script' : 'Script Ready'}
            </span>
        </div>

        <div className={`w-0.5 h-6 md:w-8 md:h-0.5 ${isAudioStep ? 'bg-app-accent' : 'bg-app-muted'}`}></div>

        <div className={`flex items-center gap-3 px-4 py-2 border-2 transition-all ${
            isAudioStep
                ? 'border-app-accent text-app-accent-text bg-app-surface' 
                : 'border-app-muted text-app-muted bg-app-bg'
        }`}>
            {isAudioStep && <Loader2 className="animate-spin" size={18}/>}
            <span className="font-bold uppercase tracking-wider text-sm">Synthesizing Audio</span>
        </div>
      </div>

      {/* Audio Player Skeleton (Only visible when generating audio) */}
      {isAudioStep && (
        <div className="bg-app-surface border-2 border-app-border p-6 flex flex-col md:flex-row items-center gap-6 animate-pulse">
            <div className="h-16 w-16 rounded-full bg-app-border/10 flex-shrink-0"></div>
            <div className="flex-grow w-full space-y-3">
                <div className="h-6 w-1/3 bg-app-border/10 rounded-sm"></div>
                <div className="h-10 w-full bg-app-border/10 rounded-sm"></div>
                <div className="flex justify-between">
                    <div className="h-3 w-10 bg-app-border/10 rounded-sm"></div>
                    <div className="h-3 w-10 bg-app-border/10 rounded-sm"></div>
                </div>
            </div>
        </div>
      )}

      {/* Script Card Skeleton/Preview */}
      <div className="bg-app-input p-6 md:p-8 border-2 border-app-border">
        <div className="flex justify-between items-center mb-6 border-b-2 border-app-border pb-4">
          <h2 className="text-2xl font-serif font-bold text-app-text uppercase tracking-wider">Transcript</h2>
          {isAudioStep && <div className="text-xs font-mono text-app-muted uppercase">READING...</div>}
        </div>
        
        {isAudioStep ? (
          // Real text preview
          <div className="prose prose-invert max-w-none">
             <p className="text-xl leading-relaxed text-app-text font-serif whitespace-pre-wrap animate-in fade-in duration-1000">
                {script}
             </p>
          </div>
        ) : (
          // Skeleton lines
          <div className="space-y-4 opacity-60">
             <Skeleton className="h-5 w-full" />
             <Skeleton className="h-5 w-11/12" />
             <Skeleton className="h-5 w-full" />
             <Skeleton className="h-5 w-4/5" />
             <div className="h-6" /> {/* Spacer */}
             <Skeleton className="h-5 w-full" />
             <Skeleton className="h-5 w-10/12" />
             <Skeleton className="h-5 w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

const AppContent: React.FC = () => {
  const [text, setText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  
  // Initialize voice from localStorage
  const [voice, setVoice] = useState<VoiceName>(() => {
    try {
      const saved = localStorage.getItem('gistfm_voice');
      if (saved && Object.values(VoiceName).includes(saved as VoiceName)) {
        return saved as VoiceName;
      }
    } catch (e) {
      console.warn("Failed to load voice preference", e);
    }
    return VoiceName.Fenrir;
  });

  // Persist voice preference
  useEffect(() => {
    localStorage.setItem('gistfm_voice', voice);
  }, [voice]);

  const [tone, setTone] = useState<SummaryTone>(SummaryTone.PROFESSIONAL);
  const [script, setScript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Bookmarks State
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [currentBookmarkId, setCurrentBookmarkId] = useState<string | null>(null);

  useEffect(() => {
    // Load bookmarks on mount
    setBookmarks(getBookmarks());
  }, []);

  const refreshBookmarks = () => {
    setBookmarks(getBookmarks());
  };

  const handleFetchUrl = async () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;

    // Validate URL format before fetching
    let urlToValidate = trimmedUrl;
    // Leniently add protocol if missing for validation purposes
    if (!/^https?:\/\//i.test(urlToValidate)) {
      urlToValidate = 'https://' + urlToValidate;
    }

    try {
      const parsed = new URL(urlToValidate);
      // Basic check for TLD or hostname validity (must have at least one dot)
      if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
         throw new Error("Invalid hostname");
      }
    } catch (e) {
      setAppState(AppState.ERROR);
      setErrorMsg("Please enter a valid URL format (e.g., example.com or https://example.com)");
      return;
    }
    
    setAppState(AppState.FETCHING_URL);
    setErrorMsg('');
    
    try {
      const articleText = await fetchArticleFromUrl(urlInput);
      setText(articleText);
      setUrlInput(''); // Clear URL input on success
      setAppState(AppState.IDLE);
    } catch (e: any) {
      setAppState(AppState.ERROR);
      setErrorMsg(e.message);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    try {
      setErrorMsg('');
      setAppState(AppState.SUMMARIZING);
      setCurrentBookmarkId(null); // Reset bookmark association for new generation
      setScript(''); // Clear previous script
      
      // Step 1: Generate Script
      const generatedScript = await generateSummaryScript(text, tone);
      setScript(generatedScript);

      setAppState(AppState.GENERATING_AUDIO);

      // Step 2: Generate Audio
      const generatedAudioUrl = await generateSpeechFromText(generatedScript, voice);
      setAudioUrl(generatedAudioUrl);
      
      setAppState(AppState.PLAYING);
    } catch (e: any) {
      console.error("Generation Error:", e);
      setAppState(AppState.ERROR);
      
      let message = "An unexpected error occurred. Please try again.";
      const errStr = (e.toString() || "").toLowerCase();
      const errMsg = (e.message || "").toLowerCase();

      if (errMsg.includes('api key') || errStr.includes('api key')) {
        message = "Configuration Error: Valid API Key not found. Please check your environment settings.";
      } else if (errMsg.includes('429') || errMsg.includes('quota') || errStr.includes('429')) {
        message = "Usage Limit Exceeded: You're sending requests too fast. Please wait a minute and try again.";
      } else if (errMsg.includes('503') || errMsg.includes('overloaded') || errStr.includes('503')) {
        message = "Service Unavailable: The AI model is currently overloaded. Please try again shortly.";
      } else if (errMsg.includes('safety') || errMsg.includes('blocked') || errStr.includes('safety')) {
        message = "Content Safety Warning: The AI model blocked this content due to safety guidelines.";
      } else if (errMsg.includes('recitation')) {
        message = "Copyright Flag: The content looks like a recitation of copyrighted material and was blocked.";
      } else if (errMsg.includes('network') || errMsg.includes('fetch') || errStr.includes('network')) {
        message = "Network Error: Unable to connect to Google Gemini. Please check your internet connection.";
      } else if (e.message) {
        message = e.message;
      }

      setErrorMsg(message);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setScript('');
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setText('');
    setErrorMsg('');
    setUrlInput('');
    setCurrentBookmarkId(null);
  };

  const handleToggleBookmarksView = () => {
     setShowBookmarks(!showBookmarks);
  };

  const handleLoadBookmark = (b: Bookmark) => {
    setScript(b.script);
    setTone(b.tone);
    setVoice(b.voice);
    setAudioUrl(null); // Audio is not persisted
    setCurrentBookmarkId(b.id);
    
    // Switch view
    setShowBookmarks(false);
    setAppState(AppState.PLAYING);
  };

  const handleDeleteBookmark = (id: string) => {
    removeBookmark(id);
    refreshBookmarks();
    if (currentBookmarkId === id) {
        setCurrentBookmarkId(null);
    }
  };

  const handleToggleCurrentBookmark = () => {
      if (currentBookmarkId) {
          // It is already bookmarked, so remove it
          removeBookmark(currentBookmarkId);
          setCurrentBookmarkId(null);
      } else {
          // Add new bookmark
          const newBookmark: Bookmark = {
              id: crypto.randomUUID(),
              createdAt: Date.now(),
              script: script,
              tone: tone,
              voice: voice,
              preview: script.substring(0, 150)
          };
          saveBookmark(newBookmark);
          setCurrentBookmarkId(newBookmark.id);
      }
      refreshBookmarks();
  };

  const isLoading = appState === AppState.SUMMARIZING || appState === AppState.GENERATING_AUDIO || appState === AppState.FETCHING_URL;
  const isProcessing = appState === AppState.SUMMARIZING || appState === AppState.GENERATING_AUDIO;

  return (
    <div className="min-h-screen bg-app-bg text-app-text pb-12 transition-colors duration-300">
      <Header onToggleBookmarks={handleToggleBookmarksView} showBookmarks={showBookmarks} />

      <main className="max-w-4xl mx-auto px-4 md:px-8 mt-12">
        
        {/* Error Banner */}
        {appState === AppState.ERROR && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 flex items-start justify-between gap-3 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 flex-shrink-0" size={24} strokeWidth={2.5} />
                <div>
                   <h3 className="font-black uppercase tracking-wider text-sm mb-1">Error</h3>
                   <p className="font-medium">{errorMsg}</p>
                </div>
            </div>
            <button 
                onClick={() => {
                    setAppState(AppState.IDLE);
                    setErrorMsg('');
                }} 
                className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 p-1.5 rounded-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Dismiss error"
            >
                <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {showBookmarks ? (
            <BookmarksList 
                bookmarks={bookmarks} 
                onLoad={handleLoadBookmark} 
                onDelete={handleDeleteBookmark}
                onClose={() => setShowBookmarks(false)}
            />
        ) : (
            <>
                {/* Input Phase */}
                {!isProcessing && appState !== AppState.PLAYING ? (
                <>
                    <div className="text-center mb-12 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-app-text tracking-tighter uppercase transition-colors">
                        Listen to your news.
                    </h2>
                    <p className="text-xl text-app-muted font-medium max-w-2xl mx-auto transition-colors">
                        Paste an article below or import from a URL, and we'll summarize it into a podcast-style audio clip.
                    </p>
                    </div>

                    <Controls 
                        voice={voice} 
                        setVoice={setVoice} 
                        tone={tone} 
                        setTone={setTone} 
                        disabled={isLoading} 
                    />

                    {/* URL Input Section */}
                    <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2 text-app-accent-text font-bold text-sm uppercase tracking-wider transition-colors">
                        <Globe size={20} strokeWidth={2.5} />
                        <span>Import from URL</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-0 border-2 border-app-border focus-within:border-app-accent transition-colors">
                        <input
                        type="url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://example.com/article"
                        disabled={isLoading}
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                        className="flex-grow bg-app-input text-app-text px-4 py-3 font-mono text-base outline-none placeholder:text-app-muted disabled:opacity-50 transition-colors"
                        />
                        <button
                        onClick={handleFetchUrl}
                        disabled={!urlInput.trim() || isLoading}
                        className="bg-app-surface hover:bg-app-surface-hover text-app-text disabled:text-app-muted font-bold uppercase tracking-wide px-6 py-3 border-t-2 md:border-t-0 md:border-l-2 border-app-border transition-colors flex items-center justify-center gap-2 whitespace-nowrap min-w-[160px]"
                        >
                        {appState === AppState.FETCHING_URL ? (
                            <>
                            <Loader2 className="animate-spin" size={18} />
                            Retrieving...
                            </>
                        ) : (
                            <>
                            <span>Fetch Text</span>
                            <ArrowRight size={18} strokeWidth={3} />
                            </>
                        )}
                        </button>
                    </div>
                    </div>

                    <div className="relative">
                        <div className="flex items-center justify-between mb-2 transition-colors">
                            <div className="flex items-center gap-2 text-app-accent-text font-bold text-sm uppercase tracking-wider">
                                <span>Or Paste Text</span>
                            </div>
                            {text.length > 0 && (
                                <span className="text-[10px] font-mono text-app-muted bg-app-surface px-2 py-0.5 rounded-sm border border-app-border/20">
                                    {text.length} chars
                                </span>
                            )}
                        </div>
                        
                        <div className="relative">
                            {appState === AppState.FETCHING_URL && <ShimmerOverlay />}
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="PASTE THE FULL TEXT OF A NEWS ARTICLE HERE..."
                                disabled={isLoading}
                                className="w-full h-64 p-6 bg-app-input border-2 border-app-border text-app-text text-lg font-mono leading-relaxed focus:border-app-accent focus:ring-0 outline-none resize-none placeholder:text-app-muted transition-colors disabled:opacity-50 disabled:border-app-muted"
                            />
                            
                            <div className="absolute bottom-6 right-6 left-6 md:left-auto flex flex-col items-center md:items-end gap-2 z-20">
                                <button
                                onClick={handleGenerate}
                                disabled={!text.trim() || isLoading}
                                className="w-full md:w-auto flex items-center justify-center gap-3 bg-app-accent hover:brightness-110 disabled:bg-app-surface disabled:text-app-muted disabled:border-app-muted text-black border-2 border-app-accent font-black uppercase tracking-wide py-4 px-8 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] shadow-app-border hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all min-w-[240px]"
                                >
                                    <Sparkles size={20} strokeWidth={2.5} />
                                    <span>Generate Audio</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {text && (
                        <div className="mt-4 p-4 border-l-4 border-app-accent bg-app-surface border-y border-r border-app-border/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-app-muted mb-2">Article Preview</h4>
                                <p className="text-sm font-serif text-app-text opacity-75 italic leading-relaxed">
                                "{text.length > 200 ? text.slice(0, 200).trim() + '...' : text}"
                                </p>
                        </div>
                    )}
                    
                    {!isProcessing && (
                        <p className="mt-8 text-center text-xs font-mono text-app-muted uppercase tracking-widest transition-colors">
                        Powered by Gemini 2.5 Flash & TTS models
                        </p>
                    )}
                </>
                ) : isProcessing ? (
                   /* Processing Phase - Skeleton View */
                   <LoadingView appState={appState} script={script} />
                ) : (
                /* Result Phase */
                <ResultView 
                    script={script} 
                    audioUrl={audioUrl} 
                    onReset={handleReset} 
                    onToggleBookmark={handleToggleCurrentBookmark}
                    isBookmarked={!!currentBookmarkId}
                />
                )}
            </>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;