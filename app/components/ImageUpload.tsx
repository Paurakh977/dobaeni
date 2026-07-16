'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import SafeImage from './SafeImage';

type Props = {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  label?: string;
  previewClass?: string;
};

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  label = 'Add image',
  previewClass = 'aspect-[4/5] w-28',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urls = multiple
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === 'string' && value
      ? [value]
      : [];

  async function handleFiles(files: FileList) {
    setError(null);
    const list = Array.from(files);
    if (!multiple) list.length = Math.min(list.length, 1);
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        uploaded.push(data.url);
      }
      if (multiple) onChange([...urls, ...uploaded]);
      else onChange(uploaded[0] ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function remove(idx: number) {
    if (multiple) onChange(urls.filter((_, i) => i !== idx));
    else onChange('');
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <div className="flex flex-wrap gap-3">
        {urls.map((u, i) => (
          <div
            key={`${u}-${i}`}
            className={`relative ${previewClass} overflow-hidden rounded-xl border border-white/[0.08]`}
          >
            <SafeImage src={u} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute right-1 top-1 z-10 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/90"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {busy ? (
          <div
            className={`${previewClass} flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02]`}
          >
            <Loader2 className="animate-spin text-[#DFBA73]" size={20} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`${previewClass} flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.02] text-[#52525B] transition-colors hover:border-[#DFBA73]/40 hover:text-[#DFBA73]`}
          >
            <ImagePlus size={18} />
            <span className="px-1 text-center text-[9px] font-mono uppercase tracking-wider">
              {label}
            </span>
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
