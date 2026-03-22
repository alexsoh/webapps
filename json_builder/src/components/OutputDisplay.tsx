import { useState, useCallback } from 'react';

interface OutputDisplayProps {
  output: string;
  rowCount: number;
}

export default function OutputDisplay({ output, rowCount }: OutputDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-[--color-text-secondary] uppercase tracking-wide">
          Output
          <span className="ml-2 text-xs text-[--color-text-muted] normal-case font-normal">
            {rowCount} {rowCount === 1 ? 'object' : 'objects'}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       bg-[--color-bg-tertiary] hover:bg-[--color-bg-hover]
                       border border-[--color-border] rounded-md
                       text-[--color-text-secondary] hover:text-[--color-text-primary]
                       transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-[--color-success]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                       bg-[--color-accent] hover:bg-[--color-accent-hover]
                       rounded-md text-white transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download JSON
          </button>
        </div>
      </div>

      <div className="relative bg-[--color-bg-secondary] border border-[--color-border] rounded-lg overflow-hidden">
        <pre className="p-4 text-sm font-mono text-[--color-text-primary] overflow-auto max-h-[500px] whitespace-pre">
          {output}
        </pre>
      </div>
    </div>
  );
}
