import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState, memo } from "react";
import Marquee from "react-fast-marquee";
import "./css/welcome-sec.css";
import { Link } from "react-router-dom";
import flowersImg from "../assets/homepage/flowers.png";
import welcomeImg from "../assets/homepage/welcome.png";
import cowGifImg from "../assets/homepage/tk-cow-walking.gif";
import welcome1Img from "../assets/homepage/welcome1.png";
import topCloudImg from "../assets/homepage/top-cloud.png";
import logoLabelImg from "../assets/homepage/tk-logo-label.png";
import bulbImg from "../assets/homepage/bulb.png";
import botCloudImg from "../assets/homepage/bot-cloud.png";
const BASE = import.meta.env.VITE_API_BASE_URL;
// Memoized so the SVG doesn’t rerender every time
const Wave = memo(() => (_jsxs("div", { className: "wave-container", children: [_jsx("svg", { width: "100%", height: "auto", version: "1.1", xmlns: "http://www.w3.org/2000/svg", style: { fillRule: "evenodd", clipRule: "evenodd", strokeLinecap: "round", strokeLinejoin: "round" }, children: _jsx("path", { d: "M50,39 C200,10 400,70 600,39 C800,10 1000,70 1200,39 C1400,10 1600,70 1800,39", style: {
                    fill: "none",
                    stroke: "#F875AA",
                    strokeOpacity: 0.5,
                    strokeWidth: 2,
                    strokeDasharray: "280 550 160 600 260 350",
                }, children: _jsx("animate", { attributeName: "stroke-dashoffset", from: "-2200", to: "0", dur: "32s", repeatCount: "indefinite" }) }) }), _jsx("svg", { width: "100%", height: "auto", version: "1.1", xmlns: "http://www.w3.org/2000/svg", style: { fillRule: "evenodd", clipRule: "evenodd", strokeLinecap: "round", strokeLinejoin: "round" }, children: _jsx("path", { d: "M50,39 C200,10 400,70 600,39 C800,10 1000,70 1200,39 C1400,10 1600,70 1800,39", style: {
                    fill: "none",
                    stroke: "#0F82CA",
                    strokeOpacity: 0.5,
                    strokeWidth: 2,
                    strokeDasharray: "180 250 160 700 260 650",
                }, strokeDashoffset: "180", children: _jsx("animate", { attributeName: "stroke-dashoffset", from: "-2020", to: "180", dur: "32s", repeatCount: "indefinite" }) }) })] })));
function WelcomeSec() {
    const [overview, setOverview] = useState("Loading...");
    const prefersReducedMotion = typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Pre-build arrays once (no new arrays every render)
    const flowers = useMemo(() => Array.from({ length: 6 }), []);
    const spacer = useMemo(() => ({ width: "50px" }), []);
    useEffect(() => {
        const ctrl = new AbortController();
        (async () => {
            try {
                const res = await fetch(`${BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`, {
                    signal: ctrl.signal,
                });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const text = typeof data?.overview === "string" && data.overview.trim()
                    ? data.overview
                    : "No overview content found.";
                setOverview(text);
            }
            catch (err) {
                if (err?.name !== "AbortError") {
                    console.error("Error fetching overview:", err);
                    setOverview("Failed to load overview.");
                }
            }
        })();
        return () => ctrl.abort();
    }, []);
    return (_jsxs("div", { className: "welcome-sec", children: [_jsx("div", { className: "wave-container", children: _jsx(Wave, {}) }), _jsx("div", { className: "flower-container top-layer", children: _jsx(Marquee, { gradient: false, speed: 50, loop: 0, play: !prefersReducedMotion, children: _jsxs("div", { className: "flowers1", children: [flowers.map((_, i) => (_jsx("img", { src: flowersImg, alt: "Flower", loading: "lazy", decoding: "async", draggable: false }, `f1-${i}`))), _jsx("div", { style: spacer })] }) }) }), _jsx("div", { className: "flower-container bottom-layer", children: _jsx(Marquee, { gradient: false, speed: 90, loop: 0, direction: "left", play: !prefersReducedMotion, children: _jsxs("div", { className: "flowers2", children: [flowers.map((_, i) => (_jsx("img", { src: flowersImg, alt: "Flower", loading: "lazy", decoding: "async", draggable: false }, `f2-${i}`))), _jsx("div", { style: spacer })] }) }) }), _jsx("div", { className: "welcome1", children: _jsx("img", { src: welcomeImg, alt: "Welcome", decoding: "async", draggable: false }) }), _jsxs("div", { className: "cow", children: [_jsx("div", { className: "cow-shadow" }), _jsx("img", { src: cowGifImg, alt: "Cow", decoding: "async", draggable: false })] }), _jsx("div", { className: "welcome3", children: _jsx("img", { src: welcome1Img, alt: "Welcome 1", decoding: "async", draggable: false }) }), _jsxs("div", { className: "clouds-content-container", children: [_jsx("img", { src: topCloudImg, className: "top-cloud", alt: "Top Cloud", loading: "lazy", decoding: "async", draggable: false }), _jsx("div", { className: "content-section-main", children: _jsxs("div", { className: "content-grid", children: [_jsx("div", { className: "empty" }), _jsxs("div", { className: "whatsTK", children: [_jsx("h2", { children: "What is TARA KABATAAN?" }), _jsx("p", { children: overview })] }), _jsx("div", { className: "tk-logo", children: _jsx("img", { src: logoLabelImg, alt: "Tara Kabataan", loading: "lazy", decoding: "async", draggable: false }) }), _jsx("div", { className: "know-more", children: _jsxs(Link, { to: "/About", className: "nav-know-more", children: [_jsx("img", { src: bulbImg, alt: "Know More", loading: "lazy", decoding: "async", draggable: false }), "KNOW MORE"] }) }), _jsx("div", { className: "empty" }), _jsx("div", { className: "empty" })] }) }), _jsx("img", { src: botCloudImg, className: "bot-cloud", alt: "Bottom Cloud", loading: "lazy", decoding: "async", draggable: false })] })] }));
}
export default memo(WelcomeSec);
