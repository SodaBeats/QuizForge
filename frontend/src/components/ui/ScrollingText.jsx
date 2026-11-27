// src/components/ui/ScrollingText.jsx
import { useRef, useState } from "react";

// Shows one line of text. If it's too long, it slides on hover so the full text can be read.
export function ScrollingText({ text, className = "", onClick }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleMouseEnter = () => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const overflow = textEl.scrollWidth - container.clientWidth;
    if (overflow > 0) {
      // ~40px per second, minimum 0.6s
      setDuration(Math.max(0.6, overflow / 40));
      setOffset(-overflow - 4);
    }
  };

  const handleMouseLeave = () => {
    setDuration(0.3);
    setOffset(0);
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap ${className}`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={text}
    >
      <span
        ref={textRef}
        className="inline-block motion-reduce:!transition-none"
        style={{
          transform: `translateX(${offset}px)`,
          transition: `transform ${duration}s linear`,
        }}
      >
        {text}
      </span>
    </div>
  );
}
