import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import path from 'path';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getAbsoluteRAGIndexPath() {
  const indexPath = process.env.RAG_INDEX_PATH;

  if (!indexPath) {
    throw new Error('RAG_INDEX_PATH environment variable is not set');
  }
  const resolvedPath = indexPath.startsWith('~')
    ? path.join(process.env.HOME || '', indexPath.slice(2))
    : path.resolve(indexPath);
  console.log('Resolved RAG index path:', resolvedPath);

  return resolvedPath;
}
