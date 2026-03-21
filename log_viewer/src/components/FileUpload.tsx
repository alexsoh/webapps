import { useState, useCallback, type DragEvent } from 'react';

interface Props {
  onFileLoaded: (content: string, filename: string) => void;
  loading: boolean;
}

export default function FileUpload({ onFileLoaded, loading }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onFileLoaded(reader.result, file.name);
        }
      };
      reader.readAsText(file);
    },
    [onFileLoaded],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragging(false), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 border-2 border-dashed border-[--color-border] rounded-lg bg-[--color-bg-secondary]">
        <div className="flex items-center gap-3 text-[--color-text-muted]">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading file from server...
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
        dragging
          ? 'border-[--color-accent] bg-[--color-accent]/5'
          : 'border-[--color-border] bg-[--color-bg-secondary] hover:border-[--color-text-muted]'
      }`}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.json,.log';
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) handleFile(file);
        };
        input.click();
      }}
    >
      <svg className="w-10 h-10 text-[--color-text-muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <div className="text-center">
        <p className="text-[--color-text-primary] font-medium">
          Drop a log file here or click to browse
        </p>
        <p className="text-sm text-[--color-text-muted] mt-1">
          Supports NDJSON files from logproc (--save or --format json)
        </p>
      </div>
      <p className="text-xs text-[--color-text-muted] mt-2">
        Or use: <code className="font-mono bg-[--color-bg-tertiary] px-1.5 py-0.5 rounded">curl -F 'file=@logs.txt' http://localhost:3000/api/upload</code>
      </p>
    </div>
  );
}
