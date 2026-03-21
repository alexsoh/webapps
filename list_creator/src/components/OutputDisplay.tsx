import { useState, useCallback } from 'react';

interface OutputDisplayProps {
  output: string;
  formatName: string;
}

export default function OutputDisplay({ output, formatName }: OutputDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = output;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [output]);

  if (!output) {
    return (
      <div className="flex items-center justify-center h-48 border border-[--color-border] rounded bg-[--color-bg-secondary] text-[--color-text-muted] text-sm">
        Enter CSV data above to see output
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[--color-text-secondary]">
          {formatName} Output
        </span>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            copied
              ? 'bg-[--color-success]/20 text-[--color-success] border border-[--color-success]/40'
              : 'bg-[--color-bg-tertiary] text-[--color-text-secondary] hover:text-[--color-text-primary] border border-[--color-border] hover:border-[--color-text-muted]'
          }`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 rounded border border-[--color-border] bg-[--color-bg-secondary] overflow-auto max-h-96 font-mono text-sm text-[--color-syntax-orange] leading-relaxed whitespace-pre-wrap break-words">
        {output}
      </pre>
    </div>
  );
}
