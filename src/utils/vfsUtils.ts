// jb7572_2026-08-25: Virtual File System (VFS) Tree Navigation & Search Utilities

import { TreeNode } from '../types';

export type FindQuery = string | { query: string; by?: 'id' | 'path' | 'name' };

export function findTreeNode(node: TreeNode, target: FindQuery): TreeNode | null {
  if (!node) return null;

  if (typeof target === 'string') {
    if (node.id === target || node.path === target || node.name === target) {
      return node;
    }
  } else {
    const { query, by = 'path' } = target;
    if (by === 'id' && node.id === query) return node;
    if (by === 'path' && node.path === query) return node;
    if (by === 'name' && node.name === query) return node;
    if (node.id === query || node.path === query || node.name === query) return node;
  }

  if (node.children) {
    for (const child of node.children) {
      const found = findTreeNode(child, target);
      if (found) return found;
    }
  }
  return null;
}

export function getAllTreeNodes(node: TreeNode): TreeNode[] {
  const result: TreeNode[] = [node];
  if (node.children) {
    for (const child of node.children) {
      result.push(...getAllTreeNodes(child));
    }
  }
  return result;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
