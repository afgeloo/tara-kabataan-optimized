import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import "./css/events-carousel.css";

interface Slide {
  image: string;
  category: string;
  title: string;
  date: string;
  location: string;
}

interface CarouselProps {
  slides: Slide[];
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

const EventsCarousel: React.FC<CarouselProps> = memo(
  ({ slides, autoSlide = false, autoSlideInterval = 3000 }) => {
    const [curr, setCurr] = useState(0);

    const count = slides.length;
    const intervalRef = useRef<number | null>(null);
    const hoveringRef = useRef(false);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- navigation (stable) ----
    const goTo = useCallback(
      (i: number) => {
        if (!count) return;
        const next = (i + count) % count;
        setCurr((prev) => (prev === next ? prev : next));
      },
      [count]
    );

    const prev = useCallback(() => {
      if (count < 2) return;
      goTo(curr - 1);
    }, [curr, count, goTo]);

    const next = useCallback(() => {
      if (count < 2) return;
      goTo(curr + 1);
    }, [curr, count, goTo]);

    // ---- auto slide (pause on hover, stop when tab hidden) ----
    useEffect(() => {
      if (!autoSlide || prefersReducedMotion || count < 2) return;

      const start = () => {
        stop();
        intervalRef.current = window.setInterval(() => {
          if (!hoveringRef.current && document.visibilityState === "visible") {
            // use functional update to avoid stale curr
            setCurr((c) => ((c + 1) % count));
          }
        }, autoSlideInterval);
      };

      const stop = () => {
        if (intervalRef.current != null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      start();
      const onVis = () => (document.visibilityState === "visible" ? start() : stop());
      document.addEventListener("visibilitychange", onVis);

      return () => {
        stop();
        document.removeEventListener("visibilitychange", onVis);
      };
    }, [autoSlide, autoSlideInterval, prefersReducedMotion, count]);

    // ---- hover pause handlers ----
    const onMouseEnter = useCallback(() => {
      hoveringRef.current = true;
    }, []);
    const onMouseLeave = useCallback(() => {
      hoveringRef.current = false;
    }, []);

    // ---- keyboard arrows when focused inside ----
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        const el = rootRef.current;
        if (!el) return;
        if (!el.contains(document.activeElement)) return;
        if (e.key === "ArrowRight") next();
        else if (e.key === "ArrowLeft") prev();
      };
      window.addEventListener("keydown", handler, { passive: true });
      return () => window.removeEventListener("keydown", handler);
    }, [next, prev]);

    // ---- swipe support ----
    useEffect(() => {
      const el = rootRef.current;
      if (!el) return;
      let startX = 0;
      let dx = 0;
      const onStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
        dx = 0;
      };
      const onMove = (e: TouchEvent) => {
        dx = e.touches[0].clientX - startX;
      };
      const onEnd = () => {
        if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
      };
      el.addEventListener("touchstart", onStart, { passive: true });
      el.addEventListener("touchmove", onMove, { passive: true });
      el.addEventListener("touchend", onEnd);
      return () => {
        el.removeEventListener("touchstart", onStart);
        el.removeEventListener("touchmove", onMove);
        el.removeEventListener("touchend", onEnd);
      };
    }, [next, prev]);

    // ---- preload neighbor images ----
    useEffect(() => {
      if (count < 2) return;
      const nextIdx = (curr + 1) % count;
      const prevIdx = (curr - 1 + count) % count;
      [slides[nextIdx]?.image, slides[prevIdx]?.image]
        .filter(Boolean)
        .forEach((src) => {
          const i = new Image();
          i.src = src as string;
        });
    }, [curr, count, slides]);

    if (count === 0) {
      return (
        <div
          className="overflow-hidden"
          ref={rootRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Events carousel"
        />
      );
    }

    return (
      <div
        className="overflow-hidden"
        ref={rootRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        role="region"
        aria-roledescription="carousel"
        aria-label="Events carousel"
      >
        <div
          className="flex"
          style={{
            transform: `translateX(-${curr * 100}%)`,
            willChange: "transform",            // GPU-friendly
            transition: "transform 380ms ease", // smooth but snappy
          }}
          tabIndex={0}
          aria-live="polite"
        >
          {slides.map((slide, index) => (
            <div key={index} className="carousel-slide" aria-roledescription="slide" aria-label={`${index + 1} of ${count}`}>
              <img
                src={slide.image}
                alt={slide.title || `Slide ${index + 1}`}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              <div className="description-overlay">
                <div className="description-content">
                  <span className="description-category">{slide.category}</span>
                  <h2 className="description-title">{slide.title}</h2>
                  <p className="description-date">{slide.date}</p>
                  <div className="description-location">
                    <img src="./src/assets/homepage/loc-pin.png" alt="Location Pin" />
                    <p className="description-location-pin">{slide.location}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute items-center">
          <button onClick={prev} className="p-1" aria-label="Previous slide">
            <ChevronLeft size={30} />
          </button>
          <button onClick={next} className="p-1" aria-label="Next slide">
            <ChevronRight size={30} />
          </button>
        </div>

        <div className="bottom-4" role="tablist" aria-label="Slide selectors">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-3 ${curr === i ? "p-2" : "bg-opacity-50"}`}
              role="tab"
              aria-selected={curr === i}
              onClick={() => setCurr(i)}
            />
          ))}
        </div>
      </div>
    );
  }
);

export default EventsCarousel;
