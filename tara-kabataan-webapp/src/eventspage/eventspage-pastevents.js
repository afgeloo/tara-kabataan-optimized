import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/eventspage/eventspage-pastevents.tsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./css/eventpage-pastevents.css";
import locationIconeventspage from "../assets/eventspage/Location-eventspage.png";
import searchIconEventspage from "../assets/eventspage/Search-icon-events.png";
// Grab the shared Cache, Types, and Image Utility!
import { _globalEventsCache, getSafeImageUrl } from "./eventspage-rsvp";
/* ---------- local helpers ---------- */
const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? "";
const formatDatePast = (dateStr) => {
    const t = Date.parse(dateStr);
    if (Number.isNaN(t))
        return "Invalid Date";
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(t));
};
const convertTo12HourFormat = (time) => {
    if (!time)
        return "";
    const [h, m] = time.split(":");
    let hour = parseInt(h || "0", 10);
    const minute = (m ?? "00").padEnd(2, "0").slice(0, 2);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
};
const getMonthName = (dateStr) => new Date(dateStr).toLocaleString("default", { month: "long" });
const getYearStr = (dateStr) => String(new Date(dateStr).getFullYear());
export default function PastEvents() {
    const navigate = useNavigate();
    // --- SMART FILTER LOGIC ---
    // This automatically marks events as "completed" if their end time has passed, 
    // keeping the UI perfect even if the DB hasn't been updated yet!
    const getCompletedEvents = useCallback((rawEvents) => {
        const now = Date.now();
        return rawEvents.filter((event) => {
            const t = Date.parse(event.event_date);
            if (Number.isNaN(t))
                return false;
            const [eh, em] = (event.event_end_time || "00:00").split(":").map(Number);
            const end = new Date(t).setHours(eh || 0, em || 0, 0, 0);
            let status = (event.event_status || "").toLowerCase();
            if ((status === "upcoming" || status === "ongoing") && now > end) {
                status = "completed";
            }
            return status === "completed";
        });
    }, []);
    // 1. Zero-Latency Initialization: Check if we already have the cache!
    const [events, setEvents] = useState(() => {
        return _globalEventsCache ? getCompletedEvents(_globalEventsCache) : [];
    });
    // filters
    const [searchTerm, setSearchTerm] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [category, setCategory] = useState("");
    const [showAll, setShowAll] = useState(false);
    // debounce search input
    const [searchInput, setSearchInput] = useState("");
    const debounceRef = useRef(null);
    const onSearchChange = useCallback((val) => {
        setSearchInput(val);
        if (debounceRef.current)
            window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            setSearchTerm(val);
        }, 250);
    }, []);
    // 2. Fallback Fetch: Only runs if the user landed directly on this page without hitting the homepage
    useEffect(() => {
        if (_globalEventsCache)
            return; // Cache is hot, skip network request!
        let mounted = true;
        fetch(`${API_BASE}/events.php`, { headers: { Accept: "application/json" } })
            .then(res => res.json())
            .then(data => {
            if (!mounted)
                return;
            const arr = Array.isArray(data) ? data : [];
            setEvents(getCompletedEvents(arr));
        })
            .catch(err => console.error("Failed to load past events:", err));
        return () => {
            mounted = false;
            if (debounceRef.current)
                window.clearTimeout(debounceRef.current);
        };
    }, [getCompletedEvents]);
    /* ---------- derived options ---------- */
    const currentYear = new Date().getFullYear();
    const earliestYear = useMemo(() => {
        if (!events.length)
            return currentYear;
        let min = currentYear;
        for (const e of events) {
            const t = Date.parse(e.event_date);
            if (!Number.isNaN(t)) {
                const y = new Date(t).getFullYear();
                if (y < min)
                    min = y;
            }
        }
        return min;
    }, [events, currentYear]);
    const yearOptions = useMemo(() => {
        const out = [];
        for (let y = earliestYear; y <= currentYear; y++)
            out.push(String(y));
        return out;
    }, [earliestYear, currentYear]);
    const monthOptions = useMemo(() => [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ], []);
    const categoryOptions = useMemo(() => ["Kalusugan", "Kalikasan", "Karunungan", "Kultura", "Kasarian"], []);
    /* ---------- filtering ---------- */
    const filteredEvents = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return events.filter((event) => {
            const matchesSearch = !q ||
                event.event_title.toLowerCase().includes(q) ||
                event.event_category.toLowerCase().includes(q) ||
                event.event_venue.toLowerCase().includes(q) ||
                formatDatePast(event.event_date).toLowerCase().includes(q);
            const matchesMonth = !month || getMonthName(event.event_date) === month;
            const matchesYear = !year || getYearStr(event.event_date) === year;
            const matchesCategory = !category || event.event_category === category;
            return matchesSearch && matchesMonth && matchesYear && matchesCategory;
        });
    }, [events, searchTerm, month, year, category]);
    const displayedEvents = useMemo(() => (showAll ? filteredEvents : filteredEvents.slice(0, 3)), [filteredEvents, showAll]);
    return (_jsxs("div", { className: "past-events-container", children: [_jsxs("div", { className: "past-events-header", children: [_jsx("h1", { className: "past-events-title", children: "Past Events" }), _jsxs("div", { className: "search-wrapper", children: [_jsx("img", { src: searchIconEventspage, alt: "Search", className: "search-icon-eventspage" }), _jsx("input", { type: "text", className: "search-input-eventspage", placeholder: "Search events", value: searchInput, onChange: (e) => onSearchChange(e.target.value) }), _jsxs("select", { className: "search-dropdown", value: month, onChange: (e) => setMonth(e.target.value), children: [_jsx("option", { value: "", children: "Month" }), monthOptions.map((m) => (_jsx("option", { value: m, children: m }, m)))] }), _jsxs("select", { className: "search-dropdown", value: year, onChange: (e) => setYear(e.target.value), children: [_jsx("option", { value: "", children: "Year" }), yearOptions.map((y) => (_jsx("option", { value: y, children: y }, y)))] }), _jsxs("select", { className: "search-dropdown", value: category, onChange: (e) => setCategory(e.target.value), children: [_jsx("option", { value: "", children: "Category" }), categoryOptions.map((cat) => (_jsx("option", { value: cat, children: cat }, cat)))] })] }), _jsx("div", { className: "custom-divider-pastevents" })] }), _jsx("div", { className: "past-events-list", children: _jsx("div", { className: `past-events-box transition-wrapper ${showAll ? "expanded" : "collapsed"}`, children: displayedEvents.map((event, index) => (_jsxs("div", { className: "past-event-item", children: [_jsxs("div", { className: "past-event-date", children: [_jsxs("div", { className: "past-event-date-day", children: [formatDatePast(event.event_date), ","] }), _jsx("p", { className: "past-event-date-weekday", children: new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long" }) })] }), _jsx("div", { className: "past-event-details", children: _jsx("div", { className: "past-event-card", onClick: () => navigate(`/events/${event.event_id}?from=past`), style: { cursor: "pointer" }, children: _jsxs("div", { className: "past-event-card-content", children: [_jsxs("div", { className: "past-event-card-text", children: [_jsxs("p", { className: "past-event-time", children: [convertTo12HourFormat(event.event_start_time), " - ", convertTo12HourFormat(event.event_end_time)] }), _jsx("p", { className: "past-event-title", children: event.event_title }), _jsx("p", { className: "past-event-category", children: event.event_category }), _jsxs("p", { className: "past-event-location", children: [_jsx("img", { src: locationIconeventspage, alt: "Location", className: "locationevent-icon" }), event.event_venue] }), _jsxs("p", { className: "past-event-guests", children: ["\uD83D\uDC65 ", event.event_going || 0, " guests"] })] }), _jsx("img", { src: getSafeImageUrl(event.event_image), alt: event.event_title, className: "past-event-image", loading: "lazy", decoding: "async" })] }) }) })] }, index))) }) }), _jsx("button", { className: `see-more-button ${showAll ? "see-less" : ""}`, onClick: () => setShowAll(!showAll), children: showAll ? "See Less" : "See More" })] }));
}
