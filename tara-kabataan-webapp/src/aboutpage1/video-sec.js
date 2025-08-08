import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo, useEffect, useRef, useState, lazy, Suspense } from "react";
import "./css/video-sec.css";
// Lazy-load the player for smaller initial bundle
const ReactPlayer = lazy(() => import("react-player/lazy"));
const FB_VIDEO_URL = "https://www.facebook.com/TaraKabataanMNL/videos/330160250091186";
const VideoSec = memo(() => {
    const containerRef = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (!containerRef.current || typeof IntersectionObserver === "undefined") {
            setVisible(true); // Fallback if no IO support
            return;
        }
        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisible(true);
                obs.disconnect();
            }
        }, { root: null, rootMargin: "200px", threshold: 0.01 });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);
    return (_jsxs("div", { className: "about-video-sec", children: [_jsx("div", { className: "about-video-description", children: _jsx("h1", { children: "Let\u2019s take a walk down memory lane to revisit where it all began" }) }), _jsx("div", { className: "about-video-container", ref: containerRef, children: _jsx("div", { className: "custom-video-frame", children: visible ? (_jsx(Suspense, { fallback: _jsx("div", { style: { width: "100%", paddingTop: "56.25%" } }), children: _jsx(ReactPlayer, { url: FB_VIDEO_URL, controls: true, width: "100%", height: "100%", playsinline: true, onError: (e) => console.error("Video load error:", e) }) })) : (_jsx("div", { style: { width: "100%", paddingTop: "56.25%" } })) }) })] }));
});
export default VideoSec;
