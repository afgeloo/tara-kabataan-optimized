import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./css/events-sec.css";
import EventsCarousel from "./events-carousel";
import { Link } from "react-router-dom";
import { memo, useEffect, useMemo, useState } from "react";
import calendarImg from "../assets/homepage/calendar.png";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// safer join for `${BASE_URL}${path}` even if one has/hasn't a slash
const joinUrl = (base, path) => {
    if (!path)
        return base;
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${b}${p}`;
};
const EventsSec = memo(() => {
    const [slides, setSlides] = useState([]);
    // Build a single date formatter instance (faster than calling toLocaleDateString repeatedly)
    const dateFmt = useMemo(() => new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }), []);
    useEffect(() => {
        const ctrl = new AbortController();
        (async () => {
            try {
                const res = await fetch(`${BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/events.php`, { signal: ctrl.signal });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const data = (await res.json());
                if (!Array.isArray(data)) {
                    console.warn("Events API did not return an array.");
                    return;
                }
                // transform once, filter invalid dates/images, then sort+slice
                const processed = data
                    .map((e) => {
                    const ts = Date.parse(e.event_date ?? "");
                    if (Number.isNaN(ts))
                        return null;
                    const img = e.event_image ? joinUrl(BASE_URL, e.event_image) : "";
                    return {
                        ts,
                        slide: {
                            image: img,
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
                setSlides(processed);
            }
            catch (err) {
                if (err?.name === "AbortError")
                    return; // unmount/refresh
                console.error("Failed to fetch events:", err);
            }
        })();
        return () => ctrl.abort();
    }, [dateFmt]);
    if (slides.length === 0)
        return null;
    return (_jsx("div", { className: "events-sec", children: _jsx("div", { className: "events-sec-content", children: _jsxs("div", { className: "carousel-container", children: [_jsx("h1", { className: "events-header", children: "EVENTS" }), slides.length > 0 && (_jsx(EventsCarousel, { slides: slides, autoSlide: true, autoSlideInterval: 5000 })), _jsx("div", { className: "events-sec-nav", children: _jsxs(Link, { to: "/Events", className: "nav-events", children: [_jsx("img", { src: calendarImg, alt: "Calendar Icon" }), "SEE MORE"] }) })] }) }) }));
});
export default EventsSec;
