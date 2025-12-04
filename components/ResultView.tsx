import React, { useRef, useState, useEffect } from 'react';
import { Download, RefreshCw, RotateCcw, RotateCw, ThumbsUp, ThumbsDown, Check, AudioLines, Play, Pause, FileText, Star, Volume2, Volume1, VolumeX, Copy } from 'lucide-react';

interface ResultViewProps {
  script: string;
  audioUrl: string | null;
  onReset: () => void;
  onToggleBookmark: () => void;
  isBookmarked: boolean;
}

export const ResultView: React.FC<ResultViewProps> = ({ script, audioUrl, onReset, onToggleBookmark, isBookmarked }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  
  // Volume State
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const prevVolumeRef = useRef(1);

  // Reset state when audioUrl changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = volume;
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime + seconds;
      audioRef.current.currentTime = newTime;
      // Optimistic update for UI responsiveness
      setCurrentTime(newTime);
    }
  };

  const handleSpeedChange = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      const restoredVolume = prevVolumeRef.current || 1;
      setVolume(restoredVolume);
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = restoredVolume;
    } else {
      prevVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFeedback = (isHelpful: boolean) => {
    const value = isHelpful ? 'yes' : 'no';
    setFeedback(value);
    console.log(`[Feedback] User found summary helpful? ${value.toUpperCase()}`);
  };
  
  const handleDownloadScript = () => {
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GistFM_Transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadFilename = `GistFM_${new Date().toISOString().slice(0, 10)}.wav`;
  
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* Audio Player Card - Only show if audioUrl exists */}
      {audioUrl ? (
        <div className="bg-app-surface border-2 border-app-border text-app-text p-6 flex flex-col md:flex-row items-start md:items-center gap-6 relative overflow-hidden transition-colors duration-300">
          {/* Subtle Background Glow when playing */}
          <div className={`absolute top-0 left-0 w-full h-full bg-app-accent/5 pointer-events-none transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}></div>

          {/* Large Play/Pause Button (Desktop) */}
          <div className="hidden md:flex relative flex-shrink-0 items-center justify-center">
            {isPlaying && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-app-accent opacity-50 animate-ping"></span>
            )}
            <button 
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause audio" : "Play audio"}
              className={`relative z-10 bg-app-accent p-3 rounded-full border-2 border-app-border flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] focus:outline-none focus-visible:ring-4 focus-visible:ring-app-text/20 ${isPlaying ? 'shadow-[0_0_15px_rgba(250,204,21,0.6)] scale-105' : 'shadow-none scale-100'}`}
            >
              {isPlaying ? (
                 <Pause size={40} className="text-black fill-current" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                 <Play size={40} className="text-black ml-1 fill-current" strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
          
          <div className="flex-grow w-full flex flex-col gap-4 relative z-10">
            
            {/* Top Row: Title + Controls */}
            <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2">
              <div className="flex items-center gap-3">
                 <div className="relative md:hidden flex items-center justify-center">
                    {isPlaying && (
                       <span className="absolute inline-flex h-full w-full rounded-full bg-app-accent opacity-50 animate-ping"></span>
                    )}
                    <button 
                        onClick={togglePlay}
                        aria-label={isPlaying ? "Pause audio" : "Play audio"}
                        className="relative z-10 p-2 bg-app-accent rounded-full text-black border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-app-text"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" aria-hidden="true" /> : <Play size={20} fill="currentColor" className="ml-0.5" aria-hidden="true" />}
                    </button>
                 </div>
                 
                 <h3 className="text-lg font-bold text-app-accent-text uppercase tracking-wide flex items-center gap-2 mr-2 transition-colors">
                    {isPlaying ? (
                        <span className="flex items-center gap-2">
                            <AudioLines size={18} className="animate-pulse" aria-hidden="true" />
                            Now Playing
                        </span>
                    ) : 'Audio Summary'}
                 </h3>
              </div>
              
              {/* Controls Toolbar */}
              <div className="flex items-center gap-3 ml-auto">
                 {/* Playback Controls Group */}
                 <div className="flex items-center gap-1.5" role="group" aria-label="Playback controls">
                    <button 
                      onClick={() => handleSkip(-10)} 
                      aria-label="Rewind 10 seconds"
                      className="border-2 border-app-border bg-app-bg hover:bg-app-surface-hover text-app-text hover:text-app-accent p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent" 
                    >
                        <RotateCcw size={16} strokeWidth={2.5} aria-hidden="true" />
                    </button>

                    <div className="flex border-2 border-app-border bg-app-bg divide-x-2 divide-app-border h-full" role="group" aria-label="Playback speed">
                        {[1, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => handleSpeedChange(rate)}
                            aria-label={`Set playback speed to ${rate}x`}
                            aria-pressed={playbackRate === rate}
                            className={`px-2 py-1 text-[10px] md:text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-app-accent ${
                              playbackRate === rate 
                                ? 'bg-app-accent text-black' 
                                : 'bg-app-bg text-app-text hover:bg-app-surface-hover'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                    </div>

                    <button 
                      onClick={() => handleSkip(10)} 
                      aria-label="Forward 10 seconds"
                      className="border-2 border-app-border bg-app-bg hover:bg-app-surface-hover text-app-text hover:text-app-accent p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent" 
                    >
                        <RotateCw size={16} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                 </div>

                 {/* Volume Control */}
                 <div className="flex items-center gap-2 px-2 border-2 border-transparent hover:border-app-border/20 rounded transition-all group/vol">
                    <button
                      onClick={toggleMute}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                      className="text-app-muted hover:text-app-text focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent rounded-sm"
                    >
                      <VolumeIcon size={20} />
                    </button>
                    <div className="relative w-20 h-6 flex items-center">
                        {/* Track */}
                        <div className="absolute w-full h-1.5 bg-app-muted/30 border border-app-border/20 rounded-full overflow-hidden pointer-events-none">
                            <div 
                                className="h-full bg-app-accent transition-all duration-100 ease-linear"
                                style={{ width: `${volume * 100}%` }}
                            ></div>
                        </div>
                        {/* Input */}
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={handleVolumeChange}
                            aria-label="Volume"
                            aria-valuemin={0}
                            aria-valuemax={1}
                            aria-valuenow={volume}
                            className="absolute w-full h-full opacity-0 cursor-pointer z-20 focus:opacity-10 focus:ring-2 focus:ring-app-accent focus:rounded-sm"
                        />
                         {/* Thumb */}
                         <div 
                            className="absolute h-3 w-3 bg-app-bg border-2 border-app-text rounded-full pointer-events-none z-10 transition-all duration-100 ease-linear group-hover/vol:scale-125"
                            style={{ 
                                left: `calc(${volume * 100}% - 6px)`
                            }}
                         ></div>
                    </div>
                 </div>

                 {/* Separator */}
                 <div className="w-px h-6 bg-app-muted mx-1 hidden sm:block" aria-hidden="true"></div>

                 {/* Download Actions */}
                 <div className="flex items-center gap-1.5 hidden sm:flex">
                    <a 
                      href={audioUrl} 
                      download={downloadFilename}
                      aria-label="Download Audio file (WAV)"
                      className="border-2 border-transparent hover:border-app-border hover:bg-app-surface-hover text-app-text hover:text-app-accent p-1.5 transition-all rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent" 
                    >
                        <Download size={20} strokeWidth={2.5} aria-hidden="true" />
                    </a>
                    <button
                      onClick={handleDownloadScript}
                      aria-label="Download Transcript file (TXT)"
                      className="border-2 border-transparent hover:border-app-border hover:bg-app-surface-hover text-app-text hover:text-app-accent p-1.5 transition-all rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent" 
                    >
                        <FileText size={20} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                    <button
                      onClick={onToggleBookmark}
                      aria-label={isBookmarked ? "Remove Bookmark" : "Bookmark this summary"}
                      className={`border-2 border-transparent hover:border-app-border hover:bg-app-surface-hover p-1.5 transition-all rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent ${isBookmarked ? 'text-app-accent' : 'text-app-text hover:text-app-accent'}`} 
                    >
                        <Star size={20} strokeWidth={isBookmarked ? 0 : 2.5} fill={isBookmarked ? "currentColor" : "none"} aria-hidden="true" />
                    </button>
                 </div>
              </div>
            </div>

            {/* Custom Progress Bar */}
            <div className="flex items-center gap-3 w-full group">
                <span className="text-xs font-mono text-app-muted min-w-[40px] text-right" aria-hidden="true">{formatTime(currentTime)}</span>
                
                <div className="relative flex-grow h-8 flex items-center">
                    {/* Visual Track */}
                    <div className="absolute w-full h-2 bg-app-muted/30 border border-app-border/20 rounded-full overflow-hidden pointer-events-none">
                        <div 
                            className="h-full bg-app-accent transition-all duration-100 ease-linear"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        ></div>
                    </div>
                    {/* Range Input (Invisible but interactive) */}
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        aria-label="Audio progress"
                        aria-valuemin={0}
                        aria-valuemax={duration || 0}
                        aria-valuenow={currentTime}
                        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                        className="absolute w-full h-full opacity-0 cursor-pointer z-20 focus:opacity-10 focus:ring-2 focus:ring-app-accent focus:rounded-sm"
                    />
                     {/* Thumb Indicator (Visual only) */}
                     <div 
                        className="absolute h-4 w-4 bg-app-bg border-2 border-app-text rounded-full pointer-events-none z-10 transition-all duration-100 ease-linear group-hover:scale-125"
                        style={{ 
                            left: `calc(${(currentTime / duration) * 100}% - 8px)`
                        }}
                     ></div>
                </div>

                <span className="text-xs font-mono text-app-muted min-w-[40px]" aria-hidden="true">{formatTime(duration)}</span>
            </div>

            {/* Hidden Native Audio Element */}
            <audio 
              ref={audioRef}
              src={audioUrl} 
              autoPlay 
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              className="hidden" 
            />
          </div>

          <div className="flex-shrink-0 w-full md:w-auto relative z-10 hidden md:flex flex-col gap-2">
             <a 
               href={audioUrl} 
               download={downloadFilename}
               className="flex items-center justify-center gap-2 bg-app-bg hover:bg-app-surface-hover text-app-text border-2 border-app-border px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
             >
               <Download size={16} strokeWidth={2.5} aria-hidden="true" />
               <span>Save Audio</span>
             </a>
             <button
               onClick={handleDownloadScript}
               className="flex items-center justify-center gap-2 bg-app-bg hover:bg-app-surface-hover text-app-text border-2 border-app-border px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
             >
               <FileText size={16} strokeWidth={2.5} aria-hidden="true" />
               <span>Save Text</span>
             </button>
             <button
               onClick={handleCopyScript}
               className="flex items-center justify-center gap-2 bg-app-bg hover:bg-app-surface-hover text-app-text border-2 border-app-border px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
             >
               {isCopied ? <Check size={16} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={16} strokeWidth={2.5} aria-hidden="true" />}
               <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
             </button>
             <button
               onClick={onToggleBookmark}
               className={`flex items-center justify-center gap-2 bg-app-bg hover:bg-app-surface-hover text-app-text border-2 border-app-border px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent ${isBookmarked ? 'border-app-accent' : ''}`}
             >
               <Star size={16} strokeWidth={isBookmarked ? 0 : 2.5} fill={isBookmarked ? "var(--app-accent)" : "none"} aria-hidden="true" />
               <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
             </button>
          </div>
        </div>
      ) : (
        /* Saved Bookmark View (No Audio) */
        <div className="bg-app-surface border-2 border-app-border p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-app-input border-2 border-app-border rounded-full">
                  <FileText size={32} className="text-app-muted" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-app-text uppercase tracking-wide">Archived Summary</h3>
                <p className="text-sm text-app-muted font-mono">Audio is not stored with bookmarks.</p>
              </div>
           </div>
           
           <div className="flex gap-2">
              <button
                 onClick={handleCopyScript}
                 className="flex items-center gap-2 bg-app-bg hover:bg-app-surface-hover text-app-text border-2 border-app-border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors"
               >
                 {isCopied ? <Check size={16} /> : <Copy size={16} />}
                 <span>Copy</span>
               </button>
              <button
                 onClick={handleDownloadScript}
                 className="flex items-center gap-2 bg-app-bg hover:bg-app-surface-hover text-app-text border-2 border-app-border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors"
               >
                 <FileText size={16} />
                 <span>Save Text</span>
               </button>
               <button
                 onClick={onToggleBookmark}
                 className="flex items-center gap-2 bg-app-bg hover:bg-app-surface-hover text-app-text border-2 border-app-border px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors text-app-accent border-app-accent"
               >
                 <Star size={16} fill="currentColor" strokeWidth={0} />
                 <span>Saved</span>
               </button>
           </div>
        </div>
      )}

      {/* Script Card */}
      <div className="bg-app-input p-6 md:p-8 border-2 border-app-border transition-colors duration-300">
        <div className="flex justify-between items-center mb-6 border-b-2 border-app-border pb-4">
          <h2 className="text-2xl font-serif font-bold text-app-text uppercase tracking-wider">Transcript</h2>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopyScript}
              className="flex items-center gap-2 text-app-text hover:text-app-accent text-sm font-bold uppercase tracking-wide transition-colors border border-transparent hover:border-app-border px-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent rounded-sm"
              aria-label="Copy Transcript"
            >
              {isCopied ? <Check size={16} strokeWidth={2.5} aria-hidden="true" /> : <Copy size={16} strokeWidth={2.5} aria-hidden="true" />}
              <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
            <button 
              onClick={handleDownloadScript}
              className="flex items-center gap-2 text-app-text hover:text-app-accent text-sm font-bold uppercase tracking-wide transition-colors border border-transparent hover:border-app-border px-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent rounded-sm"
              aria-label="Download Transcript"
            >
              <Download size={16} strokeWidth={2.5} aria-hidden="true" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button 
                onClick={onReset}
                className="flex items-center gap-2 text-app-accent-text hover:text-app-accent text-sm font-bold uppercase tracking-wide transition-colors border border-transparent hover:border-app-accent px-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent rounded-sm"
            >
                <RefreshCw size={16} strokeWidth={2.5} aria-hidden="true" />
                <span className="hidden sm:inline">Create Another</span>
            </button>
          </div>
        </div>
        <div className="prose prose-invert max-w-none mb-8">
          <p className="text-xl leading-relaxed text-app-text font-serif whitespace-pre-wrap">
            {script}
          </p>
        </div>

        {/* Feedback Section */}
        <div className="border-t-2 border-app-border/20 pt-6 mt-8">
            {!feedback ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm font-mono text-app-muted uppercase tracking-widest">
                        Was this summary helpful?
                    </p>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => handleFeedback(true)}
                            aria-label="Mark summary as helpful"
                            className="flex items-center gap-2 px-4 py-2 border-2 border-app-border hover:border-app-accent hover:text-app-accent-text text-app-text font-bold uppercase text-xs tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
                        >
                            <ThumbsUp size={16} strokeWidth={2.5} aria-hidden="true" />
                            Yes
                        </button>
                        <button 
                            onClick={() => handleFeedback(false)}
                            aria-label="Mark summary as not helpful"
                            className="flex items-center gap-2 px-4 py-2 border-2 border-app-border hover:border-app-muted hover:text-app-muted text-app-text font-bold uppercase text-xs tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
                        >
                            <ThumbsDown size={16} strokeWidth={2.5} aria-hidden="true" />
                            No
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center gap-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500" role="status">
                    <div className="bg-app-accent text-black rounded-full p-1 shadow-sm animate-in zoom-in duration-300 delay-75">
                         <Check size={18} strokeWidth={3} aria-hidden="true" />
                    </div>
                    <span className="font-bold uppercase tracking-widest text-sm text-app-accent-text animate-in slide-in-from-left-4 fade-in duration-500 delay-150">
                        Thanks for your feedback
                    </span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};