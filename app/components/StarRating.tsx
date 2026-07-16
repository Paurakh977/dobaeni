import { Star } from 'lucide-react';

export function StarRating({
  value,
  size = 13,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <div className={`flex items-center gap-0.5 ${className ?? ''}`} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={i <= rounded ? 'fill-[#DFBA73] text-[#DFBA73]' : 'text-[#3a3a40]'}
        />
      ))}
    </div>
  );
}
