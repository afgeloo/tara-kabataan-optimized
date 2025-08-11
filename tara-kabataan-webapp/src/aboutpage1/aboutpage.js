import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/about/AboutPage.tsx (or wherever this file lives)
import React, { lazy, memo, Suspense, useEffect } from "react";
import Header from "../footer/../header"; // keep Header immediate for fast paint
import Footer from "../footer";
// Lazy chunks (same default exports you already have)
const BriefBg = lazy(() => import("./briefbg-sec"));
const VideoSec = lazy(() => import("./video-sec"));
const CoreValue = lazy(() => import("./coreval-sec"));
const MissionVision = lazy(() => import("./missionvision"));
const Council = lazy(() => import("./council"));
const AboutAdvocacies = lazy(() => import("./advocacies-sec"));
/** Mounts children only when near/in viewport (no CSS class changes needed). */
function InViewMount({ children, rootMargin = "200px", minHeight = 200, }) {
    const [show, setShow] = React.useState(false);
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (show)
            return; // already mounted
        const node = ref.current;
        if (!node || typeof IntersectionObserver === "undefined") {
            setShow(true);
            return;
        }
        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setShow(true);
                obs.disconnect();
            }
        }, { root: null, rootMargin, threshold: 0.01 });
        obs.observe(node);
        return () => obs.disconnect();
    }, [show, rootMargin]);
    return (_jsx("div", { ref: ref, style: !show ? { minHeight } : undefined, children: show ? children : null }));
}
/** Light skeleton to hold space while a chunk streams in */
function Skeleton({ h = 300 }) {
    return (_jsx("div", { "aria-hidden": "true", style: {
            minHeight: h,
            background: "linear-gradient(90deg, #f2f2f2 25%, #e9e9e9 37%, #f2f2f2 63%)",
            backgroundSize: "400% 100%",
            animation: "shimmer 1.2s ease-in-out infinite",
            borderRadius: 8,
        } }));
}
/* Add a keyframes rule globally once (optional). If you already have one, remove this. */
const style = document.createElement("style");
style.innerHTML = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;
if (typeof document !== "undefined" && !document.getElementById("shimmer-keyframes")) {
    style.id = "shimmer-keyframes";
    document.head.appendChild(style);
}
const AboutPage = memo(() => {
    // Idle prefetch of below-the-fold chunks so they load instantly when scrolled
    useEffect(() => {
        const warm = () => {
            import("./video-sec");
            import("./coreval-sec");
            import("./missionvision");
            import("./council");
            import("./advocacies-sec");
        };
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(warm, { timeout: 1500 });
        }
        else {
            setTimeout(warm, 0);
        }
    }, []);
    return (_jsxs("div", { className: "about-page", children: [_jsx(Header, {}), _jsx(Suspense, { fallback: _jsx(Skeleton, { h: 420 }), children: _jsx(BriefBg, {}) }), _jsx(InViewMount, { minHeight: 420, children: _jsx(Suspense, { fallback: _jsx(Skeleton, { h: 420 }), children: _jsx(VideoSec, {}) }) }), _jsx(InViewMount, { minHeight: 360, children: _jsx(Suspense, { fallback: _jsx(Skeleton, { h: 360 }), children: _jsx(CoreValue, {}) }) }), _jsx(InViewMount, { minHeight: 320, children: _jsx(Suspense, { fallback: _jsx(Skeleton, { h: 320 }), children: _jsx(MissionVision, {}) }) }), _jsx(InViewMount, { minHeight: 580, children: _jsx(Suspense, { fallback: _jsx(Skeleton, { h: 580 }), children: _jsx(Council, {}) }) }), _jsx(InViewMount, { minHeight: 560, children: _jsx(Suspense, { fallback: _jsx(Skeleton, { h: 560 }), children: _jsx(AboutAdvocacies, {}) }) }), _jsx(Footer, {})] }));
});
export default AboutPage;
