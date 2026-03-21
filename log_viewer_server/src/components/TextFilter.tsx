import { useState, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  totalRows: number;
  filteredRows: number;
}

export default function TextFilter({ value, onChange, totalRows, filteredRows }: Props) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => onChange(local), 150);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const isFiltered = value.length > 0;

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-md">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[--color-text-muted]"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Filter rows..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-[--color-bg-tertiary] border border-[--color-border] rounded-lg text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-border-focus]"
        />
        {local && (
          <button
            onClick={() => { setLocal(''); onChange(''); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text-primary]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <span className="text-sm text-[--color-text-muted] whitespace-nowrap">
        {isFiltered
          ? `${filteredRows.toLocaleString()} of ${totalRows.toLocaleString()} rows`
          : `${totalRows.toLocaleString()} rows`}
      </span>
    </div>
  );
}
