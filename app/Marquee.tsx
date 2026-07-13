const TAGS = [
  "Old Money",
  "Clean Girl",
  "Y2K",
  "Streetwear",
  "Coquette",
  "Minimalist",
  "Korean",
  "Cottagecore",
  "Vintage",
  "Office Wear",
];

export default function Marquee() {
  const row = [...TAGS, ...TAGS];

  return (
    <div
      className="relative py-5 overflow-hidden whitespace-nowrap border-y"
      style={{ backgroundColor: "#DFBA73", borderColor: "#08080a" }}
    >
      <div className="flex w-max animate-dobaeni-marquee">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center shrink-0">
            {row.map((tag, i) => (
              <span
                key={`${copy}-${i}`}
                className="flex items-center gap-6 px-6 font-display italic text-2xl md:text-4xl text-[#08080a]"
              >
                {tag}
                <span className="w-1.5 h-1.5 rounded-full bg-[#08080a]/50" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}