// jb7572_2026-08-24: Modal File Viewer for inspecting source code and architectural metadata
import React from 'react';
import { TreeNode } from '../types';
import { FileCode, X, Copy, Check, Info } from 'lucide-react';

interface FileViewerModalProps {
  node: TreeNode | null;
  onClose: () => void;
}

// jb7572_2026-08-24: File Viewer Modal component with copy and description banner
export const FileViewerModal: React.FC<FileViewerModalProps> = ({ node, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!node || node.type === 'folder') return null;

  // jb7572_2026-08-24: Clipboard copy for modal viewer
  const handleCopy = () => {
    if (node.content) {
      navigator.clipboard.writeText(node.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0f0f0f] rounded-xl border border-[#222] shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* jb7572_2026-08-24: Modal Header with filename and path */}
        <div className="px-6 py-4 border-b border-[#222] flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-4 h-4 text-[#c4b5fd]" />
            <div>
              <h3 className="font-semibold font-mono text-[#e5e5e5] text-xs">
                {node.name}
              </h3>
              <p className="text-[10px] font-mono text-[#737373]">
                {node.path}
              </p>
            </div>
          </div>


          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 text-xs font-mono font-semibold bg-[#1a1a1a] hover:bg-[#262626] text-[#c4b5fd] border border-[#333] rounded flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#1f1f1f] rounded text-[#737373] hover:text-[#e5e5e5]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Description Banner if available */}
        {node.description && (
          <div className="px-6 py-2.5 bg-[#080808] border-b border-[#222] flex items-center gap-2 text-xs text-[#a3a3a3]">
            <Info className="w-4 h-4 shrink-0 text-[#c4b5fd]" />
            <span className="text-[11px]">{node.description}</span>
          </div>
        )}

        {/* Code Content */}
        <div className="p-6 overflow-y-auto font-mono text-xs bg-[#050505] text-[#d4d4d4] leading-relaxed flex-1">
          {node.content ? (
            <pre>{node.content}</pre>
          ) : (
            <div className="text-[#525252] italic py-8 text-center">
              (Empty file created at {node.path})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
