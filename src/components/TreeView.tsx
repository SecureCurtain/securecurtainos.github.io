// jb7572_2026-08-24: Interactive Hierarchical OS Tree View Component
import React, { useState, useEffect } from 'react';
import { TreeNode } from '../types';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Terminal, 
  Cpu, 
  FileCheck
} from 'lucide-react';

interface TreeViewProps {
  node: TreeNode;
  selectedFileId: string | null;
  onSelectFile: (node: TreeNode) => void;
  onAddCustomFile: (parentPath: string) => void;
  onDeleteFile?: (id: string) => void;
  depth?: number;
  searchQuery?: string;
}

// jb7572_2026-08-24: Tree View Node Component with search highlighting & deep nesting
export const TreeView: React.FC<TreeViewProps> = ({
  node,
  selectedFileId,
  onSelectFile,
  onAddCustomFile,
  onDeleteFile,
  depth = 0,
  searchQuery = ''
}) => {
  const isFolder = node.type === 'folder';
  const cleanQuery = searchQuery.trim().toLowerCase();

  // jb7572_2026-08-24: Match search query recursively through tree hierarchy
  const hasMatchingDescendant = (n: TreeNode): boolean => {
    if (!cleanQuery) return true;
    if (n.name.toLowerCase().includes(cleanQuery) || n.path.toLowerCase().includes(cleanQuery)) {
      return true;
    }
    if (n.children) {
      return n.children.some(child => hasMatchingDescendant(child));
    }
    return false;
  };

  const isVisible = hasMatchingDescendant(node);
  const [isOpen, setIsOpen] = useState(true);

  // jb7572_2026-08-24: Auto-expand folder nodes on active search query
  useEffect(() => {
    if (cleanQuery) {
      setIsOpen(true);
    }
  }, [cleanQuery]);

  if (!isVisible) return null;

  const isSelected = selectedFileId === node.id;

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleNodeClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(node);
    }
  };

  // jb7572_2026-08-24: Extension-to-icon styling mapper
  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.asm') || filename.endsWith('.s') || filename.endsWith('.nasm')) {
      return <Cpu className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
    if (filename.endsWith('.h')) {
      return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    if (filename.endsWith('.c')) {
      return <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
    }
    if (filename.endsWith('.py')) {
      return <Terminal className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (filename.endsWith('.ld')) {
      return <FileCheck className="w-3.5 h-3.5 text-pink-400 shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-[#737373] shrink-0" />;
  };

  // jb7572_2026-08-24: Render highlighted matching string in tree node label
  const renderHighlightedName = (name: string) => {

    if (!cleanQuery) return name;
    const lower = name.toLowerCase();
    const idx = lower.indexOf(cleanQuery);
    if (idx === -1) return name;

    const before = name.substring(0, idx);
    const match = name.substring(idx, idx + cleanQuery.length);
    const after = name.substring(idx + cleanQuery.length);

    return (
      <>
        {before}
        <span className="bg-[#c4b5fd]/30 text-[#f5f3ff] font-bold rounded-xs px-0.5 underline decoration-[#c4b5fd]">
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <div className="select-none text-xs font-mono">
      <div
        id={`tree-node-${node.id}`}
        onClick={handleNodeClick}
        style={{ paddingLeft: `${depth * 1.1 + 0.35}rem` }}
        className={`group flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer transition-colors ${
          isSelected
            ? 'bg-[#1e1e1e] text-[#c4b5fd] font-semibold border-l-2 border-[#c4b5fd]'
            : 'hover:bg-[#141414] text-[#a3a3a3] hover:text-[#e5e5e5]'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          {isFolder ? (
            <button
              onClick={toggleOpen}
              className="p-0.5 hover:bg-[#262626] rounded text-[#737373] hover:text-[#d4d4d4]"
              aria-label={isOpen ? 'Collapse folder' : 'Expand folder'}
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}

          {isFolder ? (
            isOpen ? (
              <FolderOpen className="w-3.5 h-3.5 text-[#d4d4d4] shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-[#737373] shrink-0" />
            )
          ) : (
            getFileIcon(node.name)
          )}

          <span className="truncate tracking-tight">{renderHighlightedName(node.name)}</span>

          {node.isCustom && (
            <span className="ml-1 px-1.5 py-0.2 text-[9px] uppercase tracking-wider font-sans font-bold bg-[#1e1e1e] text-[#c4b5fd] border border-[#333] rounded">
              Placed
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddCustomFile(node.path);
              }}
              title="Add file to this directory"
              className="p-1 hover:bg-[#262626] text-[#c4b5fd] rounded"
            >
              <Plus className="w-3 h-3" />
            </button>
          )}

          {node.isCustom && onDeleteFile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(node.id);
              }}
              title="Remove file"
              className="p-1 hover:bg-[#262626] text-rose-400 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {isFolder && isOpen && node.children && node.children.length > 0 && (
        <div className="border-l border-[#222] ml-3.5 my-0.5">
          {node.children.map((child) => (
            <TreeView
              key={child.id}
              node={child}
              selectedFileId={selectedFileId}
              onSelectFile={onSelectFile}
              onAddCustomFile={onAddCustomFile}
              onDeleteFile={onDeleteFile}
              depth={depth + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}

      {isFolder && isOpen && (!node.children || node.children.length === 0) && (
        <div
          style={{ paddingLeft: `${(depth + 1) * 1.1 + 1}rem` }}
          className="py-1 text-[11px] text-[#525252] italic font-mono"
        >
          (empty directory)
        </div>
      )}
    </div>
  );
};
