import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import "./css/events-carousel.css";
const EventsCarousel = memo(({ slides, autoSlide = false, autoSlideInterval = 3000 }) => {
    const [curr, setCurr] = useState(0);
    const count = slides.length;
    const intervalRef = useRef(null);
    const hoveringRef = useRef(false);
    const rootRef = useRef(null);
    const prefersReducedMotion = typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // ---- navigation (stable) ----
    const goTo = useCallback((i) => {
        if (!count)
            return;
        const next = (i + count) % count;
        setCurr((prev) => (prev === next ? prev : next));
    }, [count]);
    const prev = useCallback(() => {
        if (count < 2)
            return;
        goTo(curr - 1);
    }, [curr, count, goTo]);
    const next = useCallback(() => {
        if (count < 2)
            return;
        goTo(curr + 1);
    }, [curr, count, goTo]);
    // ---- auto slide (pause on hover, stop when tab hidden) ----
    useEffect(() => {
        if (!autoSlide || prefersReducedMotion || count < 2)
            return;
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
        const handler = (e) => {
            const el = rootRef.current;
            if (!el)
                return;
            if (!el.contains(document.activeElement))
                return;
            if (e.key === "ArrowRight")
                next();
            else if (e.key === "ArrowLeft")
                prev();
        };
        window.addEventListener("keydown", handler, { passive: true });
        return () => window.removeEventListener("keydown", handler);
    }, [next, prev]);
    // ---- swipe support ----
    useEffect(() => {
        const el = rootRef.current;
        if (!el)
            return;
        let startX = 0;
        let dx = 0;
        const onStart = (e) => {
            startX = e.touches[0].clientX;
            dx = 0;
        };
        const onMove = (e) => {
            dx = e.touches[0].clientX - startX;
        };
        const onEnd = () => {
            if (Math.abs(dx) > 40)
                (dx < 0 ? next() : prev());
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
        if (count < 2)
            return;
        const nextIdx = (curr + 1) % count;
        const prevIdx = (curr - 1 + count) % count;
        [slides[nextIdx]?.image, slides[prevIdx]?.image]
            .filter(Boolean)
            .forEach((src) => {
            const i = new Image();
            i.src = src;
        });
    }, [curr, count, slides]);
    if (count === 0) {
        return (_jsx("div", { className: "overflow-hidden", ref: rootRef, role: "region", "aria-roledescription": "carousel", "aria-label": "Events carousel" }));
    }
    return (_jsxs("div", { className: "overflow-hidden", ref: rootRef, onMouseEnter: onMouseEnter, onMouseLeave: onMouseLeave, role: "region", "aria-roledescription": "carousel", "aria-label": "Events carousel", children: [_jsx("div", { className: "flex", style: {
                    transform: `translateX(-${curr * 100}%)`,
                    willChange: "transform", // GPU-friendly
                    transition: "transform 380ms ease", // smooth but snappy
                }, tabIndex: 0, "aria-live": "polite", children: slides.map((slide, index) => (_jsxs("div", { className: "carousel-slide", "aria-roledescription": "slide", "aria-label": `${index + 1} of ${count}`, children: [_jsx("img", { src: slide.image, alt: slide.title || `Slide ${index + 1}`, loading: "lazy", decoding: "async", draggable: false }), _jsx("div", { className: "description-overlay", children: _jsxs("div", { className: "description-content", children: [_jsx("span", { className: "description-category", children: slide.category }), _jsx("h2", { className: "description-title", children: slide.title }), _jsx("p", { className: "description-date", children: slide.date }), _jsxs("div", { className: "description-location", children: [_jsx("img", { src: "./src/assets/homepage/loc-pin.png", alt: "Location Pin" }), _jsx("p", { className: "description-location-pin", children: slide.location })] })] }) })] }, index))) }), _jsxs("div", { className: "absolute items-center", children: [_jsx("button", { onClick: prev, className: "p-1", "aria-label": "Previous slide", children: _jsx(ChevronLeft, { size: 30 }) }), _jsx("button", { onClick: next, className: "p-1", "aria-label": "Next slide", children: _jsx(ChevronRight, { size: 30 }) })] }), _jsx("div", { className: "bottom-4", role: "tablist", "aria-label": "Slide selectors", children: slides.map((_, i) => (_jsx("div", { className: `w-3 ${curr === i ? "p-2" : "bg-opacity-50"}`, role: "tab", "aria-selected": curr === i, onClick: () => setCurr(i) }, i))) })] }));
});
export default EventsCarousel;
