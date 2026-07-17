'use client';

import { Bookmark } from 'lucide-react';
import SafeImage from './SafeImage';

type BoardCollagePreviewProps = {
  images?: string[];
  name: string;
};

export default function BoardCollagePreview({ images, name }: BoardCollagePreviewProps) {
  const urls = images?.filter(Boolean) || [];

  if (urls.length === 0) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-4 text-center transition-all duration-500 group-hover:border-[#DFBA73]/30">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.02] border border-white/[0.04] transition-colors duration-500 group-hover:bg-[#DFBA73]/[0.03] group-hover:border-[#DFBA73]/20">
          <Bookmark size={20} className="text-[#52525B] transition-colors duration-500 group-hover:text-[#DFBA73]" />
        </div>
        <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.2em] text-[#52525B] transition-colors duration-500 group-hover:text-[#8E8E93]">Empty Board</p>
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]">
        <SafeImage
          src={urls[0]}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    );
  }

  if (urls.length === 2) {
    return (
      <div className="grid h-full w-full grid-cols-2 gap-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]">
        <div className="overflow-hidden relative h-full w-full">
          <SafeImage
            src={urls[0]}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
        </div>
        <div className="overflow-hidden relative h-full w-full">
          <SafeImage
            src={urls[1]}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
        </div>
      </div>
    );
  }

  if (urls.length === 3) {
    return (
      <div className="flex h-full w-full gap-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]">
        <div className="w-[58%] h-full overflow-hidden relative">
          <SafeImage
            src={urls[0]}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
        </div>
        <div className="flex w-[42%] flex-col gap-1 h-full overflow-hidden">
          <div className="h-[50%] overflow-hidden relative">
            <SafeImage
              src={urls[1]}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
            />
          </div>
          <div className="h-[50%] overflow-hidden relative">
            <SafeImage
              src={urls[2]}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0E0E12]">
      {urls.slice(0, 4).map((url, i) => (
        <div key={i} className="overflow-hidden relative h-full w-full">
          <SafeImage
            src={url}
            alt={`${name} preview ${i + 1}`}
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
