import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./css/briefbg-sec.css";
import { memo, useEffect, useState } from "react";
import BgCarousel from "./bgcarousel";
// Prefer static imports so bundlers optimize & hash correctly
import slide1 from "../assets/homepage/about-image-1.png";
import slide2 from "../assets/homepage/events-2.jpg";
import slide3 from "../assets/homepage/events-3.jpg";
import slide4 from "../assets/homepage/events-4.jpg";
import ribbon from "../assets/aboutpage/briefbg-ribbon.png";
// --- tiny in-memory cache (per tab) to avoid refetches ---
let _bgCache = null;
let _bgCacheAt = 0;
const BG_TTL = 5 * 60 * 1000; // 5 min
const slides = [
    { image: slide1 },
    { image: slide2 },
    { image: slide3 },
    { image: slide4 },
];
const BriefBg = memo(() => {
    const [background, setBackground] = useState("Loading...");
    useEffect(() => {
        const now = Date.now();
        if (_bgCache && now - _bgCacheAt < BG_TTL) {
            setBackground(_bgCache);
            return;
        }
        const ctrl = new AbortController();
        fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`, { signal: ctrl.signal })
            .then((res) => {
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
            .then((data) => {
            const text = (typeof data.background === "string" && data.background.trim()) ||
                "No background content found.";
            _bgCache = text;
            _bgCacheAt = Date.now();
            setBackground(text);
        })
            .catch((err) => {
            if (err?.name !== "AbortError") {
                console.error("Error fetching background:", err);
                setBackground("Failed to load background.");
            }
        });
        return () => ctrl.abort();
    }, []);
    return (_jsxs("div", { className: "briefbg-sec", children: [_jsx("div", { className: "briefbg-carousel-bg", children: _jsx("img", { src: ribbon, alt: "Brief Background Carousel Background", loading: "lazy", decoding: "async" }) }), _jsx("div", { className: "bg-carousel-container", children: _jsx(BgCarousel, { slides: slides, autoSlide: true, autoSlideInterval: 5000 }) }), _jsxs("div", { className: "briefbg-sec-content", children: [_jsx("h1", { className: "briefbg-header", children: "Brief Background" }), _jsx("p", { className: "briefbg-description", children: background })] }), _jsx("hr", { className: "briefbg-line" })] }));
});
export default BriefBg;
