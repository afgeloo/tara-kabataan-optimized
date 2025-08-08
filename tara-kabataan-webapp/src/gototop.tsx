import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import "./global-css/gototop.css";
import { IoIosArrowUp } from "react-icons/io";

const SCROLL_THRESHOLD = 300; // px

const GoToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  const rafId = useRef<number | null>(null);
  const prevVisible = useRef<boolean>(false);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const updateVisibility = useCallback(() => {
    const next = (typeof window !== "undefined" ? window.scrollY : 0) > SCROLL_THRESHOLD;
    if (next !== prevVisible.current) {
      prevVisible.current = next;
      setIsVisible(next);
    }
  }, []);

  const onScroll = useCallback(() => {
    if (rafId.current != null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      updateVisibility();
    });
  }, [updateVisibility]);

  const scrollToTop = useCallback(() => {
    const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";
    window.scrollTo({ top: 0, behavior });
  }, [prefersReducedMotion]);

  useEffect(() => {
    // initial sync (e.g., if user reloads mid-page)
    updateVisibility();

    // passive scroll listener + rAF throttle
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [onScroll, updateVisibility]);

  return (
    <div
      className={`go-to-top ${isVisible ? "show" : ""}`}
      onClick={scrollToTop}
      onKeyDown={(e) => e.key === "Enter" && scrollToTop()}
      role="button"
      aria-label="Go to top"
      aria-hidden={!isVisible}
      tabIndex={0}
      title="Go to top"
    >
      <IoIosArrowUp size={24} />
    </div>
  );
};

export default memo(GoToTop);
