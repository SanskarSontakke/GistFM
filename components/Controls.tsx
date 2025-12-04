import React from 'react';
import { VoiceName, SummaryTone } from '../types';
import { Mic, Sliders, ChevronDown, Circle, CircleDot } from 'lucide-react';

interface ControlsProps {
  voice: VoiceName;
  setVoice: (v: VoiceName) => void;
  tone: SummaryTone;
  setTone: (t: SummaryTone) => void;
  disabled: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ voice, setVoice, tone, setTone, disabled }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Voice Selection - Dropdown */}
      <div className="bg-app-input p-4 border-2 border-app-border flex flex-col justify-between transition-colors duration-300">
        <div>
          <label 
            htmlFor="voice-select" 
            className="flex items-center gap-2 mb-4 text-app-accent-text font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Mic size={20} strokeWidth={2.5} />
            <span>Narrator Voice</span>
          </label>
          
          <div className="relative group w-full">
            <select
              id="voice-select"
              value={voice}
              onChange={(e) => setVoice(e.target.value as VoiceName)}
              disabled={disabled}
              className="w-full appearance-none bg-app-bg border-2 border-app-border text-app-text px-4 py-3 pr-12 font-bold uppercase tracking-wide focus:border-app-accent focus:outline-none focus:ring-2 focus:ring-app-accent transition-colors disabled:opacity-50 cursor-pointer text-base hover:border-app-muted"
            >
              {Object.values(VoiceName).map((v) => (
                <option key={v} value={v} className="bg-app-bg text-app-text">
                  {v}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-app-text group-hover:text-app-accent transition-colors">
              <ChevronDown size={24} strokeWidth={2.5} />
            </div>
          </div>
        </div>
        
        <p className="mt-4 text-xs text-app-muted font-mono uppercase tracking-widest transition-colors" aria-hidden="true">
           Select the AI persona for your summary
        </p>
      </div>

      {/* Tone Selection - Radio Buttons */}
      <div 
        className="bg-app-input p-4 border-2 border-app-border flex flex-col justify-between transition-colors duration-300"
        role="radiogroup" 
        aria-labelledby="tone-group-label"
      >
        <div>
          <div 
            id="tone-group-label" 
            className="flex items-center gap-2 mb-4 text-app-accent-text font-bold text-sm uppercase tracking-wider transition-colors"
          >
            <Sliders size={20} strokeWidth={2.5} />
            <span>Summary Tone</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.values(SummaryTone).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={tone === t}
                onClick={() => setTone(t)}
                disabled={disabled}
                className={`px-3 py-3 text-xs md:text-sm font-bold border-2 transition-all uppercase flex items-center justify-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-app-accent ${
                  tone === t
                    ? 'bg-app-accent text-black border-app-accent'
                    : 'bg-app-bg text-app-text border-app-border hover:bg-app-surface-hover'
                } disabled:opacity-50 group`}
              >
                {tone === t ? (
                  <CircleDot size={18} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <Circle size={18} strokeWidth={2.5} className="text-app-muted group-hover:text-app-text transition-colors" aria-hidden="true" />
                )}
                <span>{t}</span>
              </button>
            ))}
          </div>
        </div>
        
        <p className="mt-4 text-xs text-app-muted font-mono uppercase tracking-widest transition-colors" aria-hidden="true">
           Choose the style of the script
        </p>
      </div>
    </div>
  );
};