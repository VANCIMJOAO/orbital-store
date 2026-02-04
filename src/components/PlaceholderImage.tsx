"use client";

interface PlaceholderImageProps {
  text?: string;
  className?: string;
}

export default function PlaceholderImage({ text = "ORBITAL ROXA", className = "" }: PlaceholderImageProps) {
  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-[#111111] to-[#0A0A0A] flex items-center justify-center ${className}`}>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(#1A1A1A 1px, transparent 1px),
            linear-gradient(90deg, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Gradient accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#A855F7]/20 rounded-full blur-[60px]" />

      {/* Text */}
      <div className="relative z-10 text-center">
        <span className="font-display text-2xl text-[#A855F7]/50 tracking-wider">
          {text}
        </span>
      </div>

      {/* Corner markers */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-[#A855F7]/30" />
      <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-[#A855F7]/30" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-[#A855F7]/30" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-[#A855F7]/30" />
    </div>
  );
}
