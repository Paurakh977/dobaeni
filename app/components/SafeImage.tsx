'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function SafeImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#16161A] to-[#0C0C0F] text-[#3a3a40] ${className ?? ''}`}
        aria-label={alt}
      >
        <ImageOff size={22} strokeWidth={1.25} />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}
