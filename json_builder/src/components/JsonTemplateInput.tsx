import { useState, useCallback, useEffect } from 'react';

interface JsonTemplateInputProps {
  value: string;
  onChange: (text: string) => void;
  parsedTemplate: Record<string, unknown> | null;
  parseError: string | null;
}

export default function JsonTemplateInput({
  value,
  onChange,
  parsedTemplate,
  parseError,
}: JsonTemplateInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFormat = useCallback(() => {
    if (parsedTemplate) {
      onChange(JSON.stringify(parsedTemplate, null, 2));
    }
  }, [parsedTemplate, onChange]);

  const [leafCount, setLeafCount] = useState(0);

  useEffect(() => {
    if (!parsedTemplate) {
      setLeafCount(0);
      return;
    }
    function countLeaves(obj: Record<string, unknown>): number {
      let count = 0;
      for (const val of Object.values(obj)) {
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          count += countLeaves(val as Record<string, unknown>);
        } else {
          count++;
        }
      }
      return count;
    }
    setLeafCount(countLeaves(parsedTemplate));
  }, [parsedTemplate]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[--color-text-secondary]">
          JSON Template
        </label>
        <div className="flex items-center gap-3">
          {parsedTemplate && (
            <button
              onClick={handleFormat}
              className="text-xs text-[--color-text-muted] hover:text-[--color-accent] transition-colors cursor-pointer"
            >
              Format
            </button>
          )}
          {value && (
            <span className={`text-xs flex items-center gap-1 ${
              parseError
                ? 'text-[--color-error]'
                : 'text-[--color-success]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                parseError ? 'bg-[--color-error]' : 'bg-[--color-success]'
              }`} />
              {parseError ? 'Invalid JSON' : `${leafCount} properties`}
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={10}
          spellCheck={false}
          className={`
            w-full bg-[--color-bg-secondary] border rounded-lg
            text-sm text-[--color-text-primary] font-mono px-3 py-2
            focus:outline-none resize-y placeholder:text-[--color-text-muted]
            ${isFocused
              ? 'border-[--color-border-focus]'
              : parseError && value
                ? 'border-[--color-error]/50'
                : 'border-[--color-border]'}
          `}
          placeholder={`{
  "name": "",
  "age": "",
  "store_provider_link": {
    "store_id": "",
    "service_provider": ""
  }
}`}
        />
      </div>

      {parseError && value && (
        <p className="text-xs text-[--color-error] -mt-1 px-1">
          {parseError}
        </p>
      )}
    </div>
  );
}
