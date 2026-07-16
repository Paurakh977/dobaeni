'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

export function StarInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            strokeWidth={1.5}
            className={
              active >= i
                ? 'fill-[#DFBA73] text-[#DFBA73]'
                : 'text-[#3a3a40] transition-colors hover:text-[#DFBA73]'
            }
          />
        </button>
      ))}
    </div>
  );
}
