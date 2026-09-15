// jb7572_2026-09-02: Interactive CLI Mistyped Command Suggestion Component
// Prompts the user with closest choices, one-click execution, and keyboard hints.

import React from 'react';
import { FuzzyMatchResult } from '../../services/cliAssistantService';
import { HelpCircle, Play, CornerDownLeft, Sparkles, ArrowRight } from 'lucide-react';

interface CliMistypedSuggestionCardProps {
  suggestion: FuzzyMatchResult;
  onRunSuggestion: (command: string) => void;
  onFillSuggestion: (command: string) => void;
}

export const CliMistypedSuggestionCard: React.FC<CliMistypedSuggestionCardProps> = ({
  suggestion,
  onRunSuggestion,
  onFillSuggestion,
}) => {
  if (!suggestion.bestMatch) return null;

  const alternatives = (suggestion.alternatives || [])
    .filter(alt => alt.toLowerCase() !== suggestion.bestMatch?.toLowerCase())
    .slice(0, 3);

  return (
    <div className="mt-2.5 p-3 rounded-lg bg-gradient-to-r from-amber-950/40 via-[#181208] to-[#121212] border border-amber-500/40 shadow-lg text-xs font-mono">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-amber-300 font-semibold">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
          <span>CLI Spelling Assistant:</span>
          <span className="text-[#a3a3a3] font-normal">Command not recognized</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
          {suggestion.confidence} Confidence Match
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d0d0d]/80 p-2.5 rounded border border-amber-500/20">
        <div>
          <div className="text-stone-300 flex items-center gap-1.5">
            <span>Did you mean</span>
            <code className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-sm">
              {suggestion.bestMatch}
            </code>
            <span className="text-stone-400">instead of</span>
            <span className="line-through text-rose-400/80">"{suggestion.original}"</span>?
          </div>
          {suggestion.explanation && (
            <p className="text-[11px] text-stone-400 mt-1">
              {suggestion.explanation}
            </p>
          )}
        </div>

        {/* Quick Execution Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onFillSuggestion(suggestion.bestMatch!)}
            className="px-2.5 py-1.5 rounded bg-[#222] hover:bg-[#2e2e2e] text-[#ccc] hover:text-white border border-[#333] transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title={`Fill "${suggestion.bestMatch}" into input prompt`}
          >
            <CornerDownLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Fill</span>
          </button>
          <button
            onClick={() => onRunSuggestion(suggestion.bestMatch!)}
            className="px-3 py-1.5 rounded bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-bold transition-all shadow flex items-center gap-1.5 text-xs cursor-pointer"
            title={`Execute "${suggestion.bestMatch}" immediately`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run "{suggestion.bestMatch}"</span>
          </button>
        </div>
      </div>

      {/* Alternative choices if close */}
      {alternatives.length > 0 && (
        <div className="mt-2 pt-2 border-t border-amber-900/30 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
          <span className="text-stone-400">Other similar choices:</span>
          {alternatives.map(alt => (
            <button
              key={alt}
              onClick={() => onFillSuggestion(alt)}
              className="px-2 py-0.5 rounded bg-[#1e1a14] hover:bg-[#2b251d] text-amber-200 border border-amber-600/30 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{alt}</span>
              <ArrowRight className="w-2.5 h-2.5 text-amber-400/70" />
            </button>
          ))}
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      <div className="mt-2 text-[10px] text-stone-400 flex items-center gap-1">
        <span className="font-semibold text-amber-400/80">Pro Tip:</span>
        <span>Press <kbd className="px-1 py-0.2 bg-[#222] text-amber-300 rounded border border-[#333]">Tab</kbd> in the prompt to automatically complete "{suggestion.bestMatch}".</span>
      </div>
    </div>
  );
};
