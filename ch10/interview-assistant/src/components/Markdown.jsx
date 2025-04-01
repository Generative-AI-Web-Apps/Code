'use client';
import { MarkdownHooks } from 'react-markdown';
import rehypeStarryNight from 'rehype-starry-night'

export default function Markdown({ text }) {
  return (
    <div className="prose max-w-none">
      <MarkdownHooks>{text}</MarkdownHooks>
    </div>
  );
}
