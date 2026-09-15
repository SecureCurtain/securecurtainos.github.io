// jb7572_2026-09-02: Rich Interactive CLI Arguments & Switches Explorer
// Shows switches, power recipes, GUI alternatives, and pro tips after a command fulfills.

import React, { useState } from 'react';
import { CommandGuide, CommandSwitch, CommandRecipe } from '../../services/cliAssistantService';
import { 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  CornerDownLeft, 
  Copy, 
  Check, 
  ExternalLink, 
  Lightbulb, 
  Sparkles,
  Terminal,
  Zap,
  Bookmark
} from 'lucide-react';

interface CliCommandAssistantCardProps {
  guide: CommandGuide;
  onApplyCommand: (command: string, autoRun?: boolean) => void;
  defaultExpanded?: boolean;
}

export const CliCommandAssistantCard: React.FC<CliCommandAssistantCardProps> = ({
  guide,
  onApplyCommand,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getBadgeStyle = (badge?: CommandSwitch['badge']) => {
    switch (badge) {
      case 'RECOMMENDED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'POPULAR':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'SAFETY':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'DIAGNOSTIC':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'ADVANCED':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      default:
        return 'bg-zinc-700/30 text-zinc-300 border-zinc-600/40';
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-indigo-500/30 bg-gradient-to-br from-[#0c0d14] via-[#10121d] to-[#0a0b10] shadow-xl overflow-hidden font-mono text-xs">
      {/* Header Bar */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2.5 bg-indigo-950/30 hover:bg-indigo-950/50 border-b border-indigo-900/30 flex items-center justify-between cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-indigo-200">
              Pro Tips & Switches for "{guide.name}"
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#181a28] text-indigo-300 border border-indigo-800/40">
              {guide.category}
            </span>
            <span className="text-[10px] text-zinc-400 hidden sm:inline">
              • {guide.switches.length} switches available
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="text-[11px] text-indigo-300 hover:text-indigo-100 flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-900/40 transition-colors"
          >
            <span>{isExpanded ? 'Hide Details' : 'Explore Switches'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="p-3.5 space-y-3.5">
          {/* Summary & Syntax Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded bg-[#090a0f] border border-zinc-800/80 text-zinc-300">
            <div className="space-y-0.5">
              <div className="text-[11px] font-semibold text-zinc-200">{guide.title}</div>
              <div className="text-[11px] text-zinc-400 leading-normal">{guide.summary}</div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 bg-[#141622] px-2 py-1 rounded border border-indigo-900/40">
              <span className="text-[10px] text-indigo-400 font-semibold">SYNTAX:</span>
              <code className="text-zinc-200 text-[11px]">{guide.syntax}</code>
            </div>
          </div>

          {/* Available Switches & Arguments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                Arguments & Switches (with Plain Explanations)
              </span>
              <span className="text-[10px] text-zinc-400">Click any switch to load or run in prompt</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {guide.switches.map((sw, idx) => {
                const targetCmd = sw.example || `${guide.name} ${sw.flag.split(' ')[0]}`;
                return (
                  <div
                    key={idx}
                    onClick={() => onApplyCommand(targetCmd, false)}
                    className="p-3 rounded-lg bg-[#0d0f19] hover:bg-[#131726] border border-zinc-800/90 hover:border-indigo-500/60 transition-all cursor-pointer group flex flex-col justify-between shadow-sm"
                  >
                    <div className="space-y-2">
                      {/* Flag Pill & Meaning */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <code className="px-2 py-0.5 rounded bg-indigo-950/80 text-amber-300 font-bold border border-indigo-700/60 text-xs font-mono group-hover:text-amber-200 transition-colors">
                            {sw.flag}
                          </code>
                          {sw.meaning && (
                            <span className="text-[10px] font-medium text-amber-200/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 font-mono">
                              Means: "{sw.meaning}"
                            </span>
                          )}
                        </div>
                        {sw.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${getBadgeStyle(sw.badge)}`}>
                            {sw.badge}
                          </span>
                        )}
                      </div>

                      {/* What it does */}
                      <div className="text-[11px] text-zinc-200 font-sans leading-relaxed">
                        <span className="text-indigo-400 font-semibold mr-1 font-mono">What it does:</span>
                        {sw.whatItDoes || sw.description}
                      </div>

                      {/* Plain-English Explanation */}
                      {sw.plainExplanation && (
                        <div className="text-[11px] text-zinc-300 bg-[#080911] p-2 rounded border border-indigo-950/70 font-sans leading-relaxed">
                          <span className="text-emerald-400 font-semibold mr-1 font-mono">Plain explanation:</span>
                          "{sw.plainExplanation}"
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 truncate max-w-[170px] font-mono">
                        $ {targetCmd}
                      </span>
                      <div className="flex items-center gap-1.5 opacity-85 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyCommand(targetCmd, false);
                          }}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors flex items-center gap-1 font-medium cursor-pointer"
                          title="Fill into input prompt"
                        >
                          <CornerDownLeft className="w-2.5 h-2.5 text-indigo-400" />
                          <span>Fill</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApplyCommand(targetCmd, true);
                          }}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                          title="Run command immediately"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Run</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-World Power Recipes */}
          {guide.recipes && guide.recipes.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
                Real-World Power Recipes & Workflows
              </div>
              <div className="space-y-1.5">
                {guide.recipes.map((rc, idx) => (
                  <div 
                    key={idx}
                    className="p-2 rounded bg-[#0a0b10] border border-zinc-800 flex items-center justify-between gap-3 text-[11px]"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-zinc-200 mr-2">{rc.title}:</span>
                      <code className="text-emerald-300 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/40 mr-2">
                        {rc.command}
                      </code>
                      <span className="text-zinc-400 hidden lg:inline text-[10px]">{rc.description}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleCopy(rc.command, e)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Copy recipe"
                      >
                        {copiedCmd === rc.command ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyCommand(rc.command, false)}
                        className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1 text-[10px]"
                        title="Load into CLI prompt"
                      >
                        <CornerDownLeft className="w-3 h-3 text-indigo-400" />
                        <span>Try</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyCommand(rc.command, true)}
                        className="px-2 py-0.5 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1 text-[10px]"
                        title="Execute recipe immediately"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prefer GUI? Bridge & Pro Tips Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 text-[11px]">
            {guide.guiAlternative ? (
              <div className="p-2.5 rounded bg-gradient-to-r from-blue-950/20 to-[#0f1320] border border-blue-900/30 text-zinc-300 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-300 font-semibold text-[10px] uppercase tracking-wider">
                  <ExternalLink className="w-3 h-3" />
                  <span>Prefer GUI Interface?</span>
                </div>
                <div className="text-zinc-200 font-medium">{guide.guiAlternative.name}</div>
                <div className="text-[10px] text-zinc-400">Location: {guide.guiAlternative.location}</div>
                <div className="text-[10px] text-blue-200/80">{guide.guiAlternative.description}</div>
              </div>
            ) : (
              <div className="p-2.5 rounded bg-[#090a0f] border border-zinc-800 text-zinc-400 text-[10px] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Microkernel native CLI command optimized for high-throughput headless shell execution.</span>
              </div>
            )}

            {guide.proTips && guide.proTips.length > 0 && (
              <div className="p-2.5 rounded bg-amber-950/15 border border-amber-900/30 text-zinc-300 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-[10px] uppercase tracking-wider">
                  <Lightbulb className="w-3 h-3" />
                  <span>CLI Pro Tip</span>
                </div>
                <p className="text-[10px] text-amber-200/90 leading-relaxed">
                  {guide.proTips[0]}
                </p>
                {guide.seeAlso && guide.seeAlso.length > 0 && (
                  <div className="text-[9px] text-zinc-400 pt-0.5 flex flex-wrap items-center gap-1">
                    <span>Related:</span>
                    {guide.seeAlso.slice(0, 4).map(c => (
                      <button
                        key={c}
                        onClick={() => onApplyCommand(c, false)}
                        className="px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 hover:text-white"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
