"use client";

import React, { useEffect, useRef, useState } from "react";

export function Reveal({ children, delayMs = 0 }: { children: React.ReactNode; delayMs?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShow(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transition: "transform 520ms cubic-bezier(.2,.8,.2,1), opacity 520ms cubic-bezier(.2,.8,.2,1)",
        transform: show ? "translateY(0px)" : "translateY(10px)",
        opacity: show ? 1 : 0,
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}
