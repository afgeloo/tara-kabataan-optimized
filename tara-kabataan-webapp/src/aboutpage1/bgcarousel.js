import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, memo, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "react-feather";
import "./css/bgcarousel.css";
const SWIPE_THRESHOLD = 40; // px
const BgCarousel = memo(({ slides, autoSlide = false, autoSlideInterval = 3000 }) => {
    const length = useMemo(() => slides.length, [slides]);
    const [curr, setCurr] = useState(0);
    const [paused, setPaused] = useState(false);
    const touchStartX = useRef(null);
    // Keep index valid if slides change
    useEffect(() => {
        if (curr >= length)
            setCurr(0);
    }, [length, curr]);
    const prev = useCallback(() => {
        if (length <= 1)
            return;
        setCurr((i) => (i === 0 ? length - 1 : i - 1));
    }, [length]);
    const next = useCallback(() => {
        if (length <= 1)
            return;
        setCurr((i) => (i === length - 1 ? 0 : i + 1));
    }, [length]);
    // Auto-slide with pause on hover/tab hidden
    useEffect(() => {
        if (!autoSlide || length <= 1)
            return;
        const interval = setInterval(() => {
            if (!paused && document.visibilityState === "visible")
                next();
        }, autoSlideInterval);
        return () => clearInterval(interval);
    }, [autoSlide, autoSlideInterval, paused, next, length]);
    // Touch swipe
    const onTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
        if (touchStartX.current === null)
            return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) < SWIPE_THRESHOLD)
            return;
        dx > 0 ? prev() : next();
    };
    // Keyboard navigation
    const onKeyDown = (e) => {
        if (e.key === "ArrowLeft")
            prev();
        else if (e.key === "ArrowRight")
            next();
    };
    if (length === 0)
        return null;
    return (_jsxs("div", { className: "bg-overflow-hidden", onMouseEnter: () => setPaused(true), onMouseLeave: () => setPaused(false), onTouchStart: onTouchStart, onTouchEnd: onTouchEnd, onKeyDown: onKeyDown, tabIndex: 0, children: [_jsx("div", { className: "bg-flex", style: { transform: `translateX(-${curr * 100}%)` }, children: slides.map((slide, index) => (_jsxs("div", { className: "bg-carousel-slide", style: { width: `${100 / length}%` }, children: [_jsx("img", { src: slide.image, alt: `Slide ${index + 1}`, loading: "lazy", decoding: "async", draggable: false }), _jsx("div", { className: "bg-description-overlay", children: _jsx("div", { className: "bg-description-content" }) })] }, index))) }), _jsxs("div", { className: "bg-absolute bg-items-center", children: [_jsx("button", { onClick: prev, className: "bg-p-1", type: "button", children: _jsx(ChevronLeft, { size: 30 }) }), _jsx("button", { onClick: next, className: "bg-p-1", type: "button", children: _jsx(ChevronRight, { size: 30 }) })] }), _jsx("div", { className: "bg-bottom-4", children: slides.map((_, i) => (_jsx("div", { className: `bg-w-3 ${curr === i ? "bg-p-2" : "bg-opacity-50"}`, onClick: () => setCurr(i) }, i))) })] }));
});
export default BgCarousel;
