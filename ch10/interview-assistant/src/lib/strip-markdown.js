// Function to strip markdown formatting
export function stripMarkdown(text) {
  if (!text) return '';

  text = text.replace(/\*\*(.*?)\*\*/g, '$1');
  text = text.replace(/\*(.*?)\*/g, '$1');
  text = text.replace(/__(.*?)__/g, '$1');
  text = text.replace(/_(.*?)_/g, '$1');
  text = text.replace(/#{1,6}\s(.*?)(\n|$)/g, '$1$2');
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`(.*?)`/g, '$1');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*>\s+/gm, '');
  text = text.replace(/^\s*[-*_]{3,}\s*$/gm, '');
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');

  return text;
}
