import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./css/events-sec.css";
import EventsCarousel from "./events-carousel";
import { Link } from "react-router-dom";
import { memo, useEffect, useMemo, useState } from "react";
import calendarImg from "../assets/homepage/calendar.png";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp-v2.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
// BULLETPROOF S3 HELPER
const getSafeImageUrl = (url) => {
    if (!url)
        return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("//"))
        return url;
    let cleanPath = url.startsWith("/") ? url.substring(1) : url;
    if (cleanPath.startsWith("tara-kabataan-webapp/uploads/")) {
        cleanPath = cleanPath.replace("tara-kabataan-webapp/uploads/", "");
    }
    else if (cleanPath.startsWith("tara-kabataan-optimized/tara-kabataan-webapp/uploads/")) {
        cleanPath = cleanPath.replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "");
    }
    if (!cleanPath.includes("/")) {
        cleanPath = `events-images/${cleanPath}`;
    }
    return `${IMAGE_BASE}/${cleanPath}`;
};
const EventsSec = memo(() => {
    // ZERO LATENCY FIX: Pull from cache immediately
    const [slides, setSlides] = useState(() => {
        const cached = localStorage.getItem("tk_homepage_events");
        return cached ? JSON.parse(cached) : [];
    });
    const dateFmt = useMemo(() => new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }), []);
    useEffect(() => {
        const ctrl = new AbortController();
        (async () => {
            try {
                const res = await fetch(`${BASE_URL}/events.php`, { signal: ctrl.signal });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const data = (await res.json());
                if (!Array.isArray(data))
                    return;
                const processed = data
                    .map((e) => {
                    const ts = Date.parse(e.event_date ?? "");
                    if (Number.isNaN(ts))
                        return null;
                    return {
                        ts,
                        slide: {
                            image: getSafeImageUrl(e.event_image),
                            category: e.event_category ?? "",
                            title: e.event_title ?? "",
                            date: dateFmt.format(ts),
                            location: e.event_venue ?? "",
                        },
                    };
                })
                    .filter((x) => !!x && !!x.slide.image)
                    .sort((a, b) => b.ts - a.ts)
                    .slice(0, 5)
                    .map((x) => x.slide);
                // Update screen and save to cache
                setSlides(processed);
                localStorage.setItem("tk_homepage_events", JSON.stringify(processed));
            }
            catch (err) {
                if (err?.name === "AbortError")
                    return;
                console.error("Failed to fetch events:", err);
            }
        })();
        return () => ctrl.abort();
    }, [dateFmt]);
    if (slides.length === 0)
        return null;
    return (_jsx("div", { className: "events-sec", children: _jsx("div", { className: "events-sec-content", children: _jsxs("div", { className: "carousel-container", children: [_jsx("h1", { className: "events-header", children: "EVENTS" }), _jsx(EventsCarousel, { slides: slides, autoSlide: true, autoSlideInterval: 5000 }), _jsx("div", { className: "events-sec-nav", children: _jsxs(Link, { to: "/Events", className: "nav-events", children: [_jsx("img", { src: calendarImg, alt: "Calendar Icon" }), "SEE MORE"] }) })] }) }) }));
});
export default EventsSec;
