import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { fetchEvents, formatDatePast, convertTo12HourFormat } from "./mockServer";
import "./css/eventpage-pastevents.css";
import locationIconeventspage from "../assets/eventspage/Location-eventspage.png";
import searchIconEventspage from "../assets/eventspage/Search-icon-events.png";
import { useNavigate } from "react-router-dom";
/* ---------- helpers ---------- */
const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? "";
const getFullImageUrl = (url) => {
    if (!url)
        return "";
    if (/^https?:\/\//i.test(url) || url.startsWith("//"))
        return url;
    return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
};
const getMonthName = (dateStr) => new Date(dateStr).toLocaleString("default", { month: "long" });
const getYearStr = (dateStr) => String(new Date(dateStr).getFullYear());
export default function PastEvents() {
    const navigate = useNavigate();
    // data
    const [events, setEvents] = useState([]);
    // filters
    const [searchTerm, setSearchTerm] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");
    const [category, setCategory] = useState("");
    const [showAll, setShowAll] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("ALL"); // kept for parity, not used in UI
    // debounce search input to avoid filtering on every keystroke
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
    // fetch + prefilter to completed
    useEffect(() => {
        let mounted = true;
        fetchEvents().then((data) => {
            if (!mounted)
                return;
            const arr = Array.isArray(data) ? data : [];
            const completedOnly = arr.filter((e) => (e.event_status || "").toLowerCase() === "completed");
            setEvents(completedOnly);
        });
        return () => {
            mounted = false;
            if (debounceRef.current)
                window.clearTimeout(debounceRef.current);
        };
    }, [selectedCategory]); // kept dependency to match your original behavior
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
    return (_jsxs("div", { className: "past-events-container", children: [_jsxs("div", { className: "past-events-header", children: [_jsx("h1", { className: "past-events-title", children: "Past Events" }), _jsxs("div", { className: "search-wrapper", children: [_jsx("img", { src: searchIconEventspage, alt: "Search", className: "search-icon-eventspage" }), _jsx("input", { type: "text", className: "search-input-eventspage", placeholder: "Search events", value: searchInput, onChange: (e) => onSearchChange(e.target.value) }), _jsxs("select", { className: "search-dropdown", value: month, onChange: (e) => setMonth(e.target.value), children: [_jsx("option", { value: "", children: "Month" }), monthOptions.map((m) => (_jsx("option", { value: m, children: m }, m)))] }), _jsxs("select", { className: "search-dropdown", value: year, onChange: (e) => setYear(e.target.value), children: [_jsx("option", { value: "", children: "Year" }), yearOptions.map((y) => (_jsx("option", { value: y, children: y }, y)))] }), _jsxs("select", { className: "search-dropdown", value: category, onChange: (e) => setCategory(e.target.value), children: [_jsx("option", { value: "", children: "Category" }), categoryOptions.map((cat) => (_jsx("option", { value: cat, children: cat }, cat)))] })] }), _jsx("div", { className: "custom-divider-pastevents" })] }), _jsx("div", { className: "past-events-list", children: _jsx("div", { className: `past-events-box transition-wrapper ${showAll ? "expanded" : "collapsed"}`, children: displayedEvents.map((event, index) => (_jsxs("div", { className: "past-event-item", children: [_jsxs("div", { className: "past-event-date", children: [_jsxs("div", { className: "past-event-date-day", children: [formatDatePast(event.event_date), ","] }), _jsx("p", { className: "past-event-date-weekday", children: new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long" }) })] }), _jsx("div", { className: "past-event-details", children: _jsx("div", { className: "past-event-card", onClick: () => navigate(`/events/${event.event_id}?from=past`), style: { cursor: "pointer" }, children: _jsxs("div", { className: "past-event-card-content", children: [_jsxs("div", { className: "past-event-card-text", children: [_jsxs("p", { className: "past-event-time", children: [convertTo12HourFormat(event.event_start_time), " - ", convertTo12HourFormat(event.event_end_time)] }), _jsx("p", { className: "past-event-title", children: event.event_title }), _jsx("p", { className: "past-event-category", children: event.event_category }), _jsxs("p", { className: "past-event-location", children: [_jsx("img", { src: locationIconeventspage, alt: "Location", className: "locationevent-icon" }), event.event_venue] }), _jsxs("p", { className: "past-event-guests", children: ["\uD83D\uDC65 ", event.event_going || 0, " guests"] })] }), _jsx("img", { src: getFullImageUrl(event.event_image), alt: event.event_title, className: "past-event-image", loading: "lazy", decoding: "async" })] }) }) })] }, index))) }) }), _jsx("button", { className: `see-more-button ${showAll ? "see-less" : ""}`, onClick: () => setShowAll(!showAll), children: showAll ? "See Less" : "See More" })] }));
}
