import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/eventspage/eventspage-rsvp.tsx
import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/eventpage-rsvp.css";
import locationIconeventspage from "../assets/eventspage/Location-eventspage.png";
import searchIconEventspage from "../assets/eventspage/Search-icon-events.png";
import Preloader from "../preloader";
import EventsCarousel from "../homepage/events-carousel";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
/* ---------- stable helpers/constants ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp-v2.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
const DATE_FMT_FULL = new Intl.DateTimeFormat(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const MONTH_FMT = new Intl.DateTimeFormat(undefined, { month: "long" });
// --- THE ROBUST S3 IMAGE RESOLVER ---
export const getSafeImageUrl = (url) => {
    if (!url)
        return "";
    if (url.startsWith("http") || url.startsWith("//"))
        return url;
    let cleanPath = url
        .replace(/^\/?tara-kabataan-optimized\/tara-kabataan-webapp\/uploads\//, "")
        .replace("events-images/events-images/", "events-images/");
    if (cleanPath.startsWith("/"))
        cleanPath = cleanPath.substring(1);
    return `${IMAGE_BASE}/${cleanPath}`;
};
const formatDateRSVP = (dateString) => {
    const t = Date.parse(dateString);
    if (Number.isNaN(t))
        return "Invalid date";
    return DATE_FMT_FULL.format(new Date(t));
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
// --- ZERO LATENCY GLOBAL CACHE ---
export let _globalEventsCache = null;
export let _globalEventsCacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export default function EventsPageRSVP() {
    const navigate = useNavigate();
    const [eventsToShow, setEventsToShow] = useState(() => parseInt(sessionStorage.getItem("eventShowCount") || "12", 10));
    const [viewType, setViewType] = useState(() => sessionStorage.getItem("eventViewType") || "UPCOMING");
    const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem("eventCategory") || "ALL");
    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("eventSearchQuery") || "");
    const [selectedMonth, setSelectedMonth] = useState("ALL");
    const [selectedYear, setSelectedYear] = useState("ALL");
    const [events, setEvents] = useState(_globalEventsCache || []);
    const [loading, setLoading] = useState(!_globalEventsCache);
    const [restoringScroll, setRestoringScroll] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", contact: "", expectations: "" });
    const [selectedEventId, setSelectedEventId] = useState(null);
    const categories = useMemo(() => ["ALL", "KALUSUGAN", "KALIKASAN", "KARUNUNGAN", "KULTURA", "KASARIAN"], []);
    useLayoutEffect(() => {
        if (!restoringScroll)
            return;
        const savedScroll = sessionStorage.getItem("eventScrollY");
        if (savedScroll)
            window.scrollTo(0, parseInt(savedScroll, 10) || 0);
        setRestoringScroll(false);
    }, [restoringScroll]);
    /* ---------- fetch events (Zero Latency) ---------- */
    useEffect(() => {
        const now = Date.now();
        if (_globalEventsCache && (now - _globalEventsCacheAt < CACHE_TTL)) {
            setEvents(_globalEventsCache);
            setLoading(false);
            return;
        }
        const ctrl = new AbortController();
        setLoading(true);
        fetch(`${API_BASE}/events.php`, {
            signal: ctrl.signal,
            headers: { Accept: "application/json" } // Removed "no-store" cache blocker
        })
            .then((res) => res.json())
            .then((data) => {
            const arr = Array.isArray(data) ? data : [];
            _globalEventsCache = arr;
            _globalEventsCacheAt = Date.now();
            setEvents(arr);
        })
            .catch((err) => {
            if (err?.name !== "AbortError")
                console.error("Error fetching events:", err);
        })
            .finally(() => setLoading(false));
        return () => ctrl.abort();
    }, []);
    const monthOptions = useMemo(() => {
        const set = new Set();
        for (const e of events) {
            const t = Date.parse(e.event_date);
            if (!Number.isNaN(t))
                set.add(MONTH_FMT.format(new Date(t)));
        }
        return Array.from(set).sort();
    }, [events]);
    const yearOptions = useMemo(() => {
        const set = new Set();
        for (const e of events) {
            const t = Date.parse(e.event_date);
            if (!Number.isNaN(t))
                set.add(String(new Date(t).getFullYear()));
        }
        return Array.from(set).sort();
    }, [events]);
    const filteredEvents = useMemo(() => {
        const now = new Date();
        const q = searchQuery.trim().toLowerCase();
        return events.filter((event) => {
            const t = Date.parse(event.event_date);
            if (Number.isNaN(t))
                return false;
            const eventDate = new Date(t);
            const eventMonth = MONTH_FMT.format(eventDate);
            const eventYear = String(eventDate.getFullYear());
            const [sh, sm] = (event.event_start_time || "00:00").split(":").map(Number);
            const [eh, em] = (event.event_end_time || "00:00").split(":").map(Number);
            const start = new Date(eventDate).setHours(sh || 0, sm || 0, 0, 0);
            const end = new Date(eventDate).setHours(eh || 0, em || 0, 0, 0);
            const isOngoingNow = now.getTime() >= start && now.getTime() <= end;
            const isPastEvent = now.getTime() > end;
            let corrected = (event.event_status || "").toLowerCase();
            if ((corrected === "upcoming" || corrected === "ongoing") && isPastEvent)
                corrected = "completed";
            else if (corrected === "upcoming" && isOngoingNow)
                corrected = "ongoing";
            const matchesView = viewType === "UPCOMING" ? (corrected === "upcoming" || corrected === "ongoing") : corrected === "completed";
            const matchesCategory = selectedCategory === "ALL" || event.event_category?.toUpperCase() === selectedCategory;
            const matchesSearch = !q ||
                event.event_title?.toLowerCase().includes(q) ||
                event.event_category?.toLowerCase().includes(q) ||
                event.event_venue?.toLowerCase().includes(q);
            const matchesMonth = selectedMonth === "ALL" || eventMonth === selectedMonth;
            const matchesYear = selectedYear === "ALL" || eventYear === selectedYear;
            return matchesView && matchesCategory && matchesSearch && matchesMonth && matchesYear;
        });
    }, [events, viewType, selectedCategory, searchQuery, selectedMonth, selectedYear]);
    const currentEvents = useMemo(() => filteredEvents.slice(0, eventsToShow), [filteredEvents, eventsToShow]);
    const carouselSlides = useMemo(() => {
        if (!events.length)
            return [];
        return [...events]
            .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
            .slice(0, 5)
            .map((event) => ({
            image: getSafeImageUrl(event.event_image),
            category: event.event_category,
            title: event.event_title,
            date: formatDateRSVP(event.event_date),
            location: event.event_venue,
        }));
    }, [events]);
    const openModal = useCallback((e, eventId) => {
        e.stopPropagation();
        setSelectedEventId(eventId);
        setShowModal(true);
    }, []);
    const closeModal = useCallback(() => setShowModal(false), []);
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((fd) => ({ ...fd, [name]: value }));
    }, []);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedEventId || submitting)
            return;
        try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE}/event_participants.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: selectedEventId, ...formData }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                toast.success("Registered successfully!");
                // INSTANT UI UPDATE & CACHE UPDATE
                const updatedEvents = events.map(evt => evt.event_id === selectedEventId ? { ...evt, event_going: Number(evt.event_going || 0) + 1 } : evt);
                setEvents(updatedEvents);
                _globalEventsCache = updatedEvents;
                setShowModal(false);
                setFormData({ name: "", email: "", contact: "", expectations: "" });
            }
            else {
                toast.error(json.error || "Registration failed");
            }
        }
        catch (err) {
            toast.error("Network error. Please try again.");
        }
        finally {
            setSubmitting(false);
        }
    }, [selectedEventId, formData, submitting, events]);
    const onCardClick = useCallback((eventId) => {
        sessionStorage.setItem("eventScrollY", String(window.scrollY));
        sessionStorage.setItem("eventViewType", viewType);
        sessionStorage.setItem("eventCategory", selectedCategory);
        sessionStorage.setItem("eventSearchQuery", searchQuery);
        sessionStorage.setItem("eventShowCount", String(eventsToShow));
        navigate(`/events/${eventId}`);
    }, [viewType, selectedCategory, searchQuery, eventsToShow, navigate]);
    const debounceRef = useRef(null);
    const onSearchChange = useCallback((val) => {
        if (debounceRef.current)
            window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => setSearchQuery(val), 250);
    }, []);
    useEffect(() => {
        document.body.style.overflow = showModal ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [showModal]);
    return (_jsxs("div", { className: "events-page-rsvp", children: [loading ? (_jsx(Preloader, {})) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "events-header-row", children: [_jsx("h1", { className: "eventspage-header-EVENTS", children: "Recent Events" }), events.length > 0 && _jsx(EventsCarousel, { slides: carouselSlides, autoSlide: true, autoSlideInterval: 5000 })] }), _jsx("hr", { className: "events-header-divider" }), _jsx("h1", { className: "eventspage-header-2-EVENTS", children: "Events" }), _jsxs("div", { className: "events-header-row-2", children: [_jsxs("div", { className: "event-searchbar-container", children: [_jsx("input", { type: "text", placeholder: "Search events...", defaultValue: searchQuery, onChange: (e) => onSearchChange(e.target.value), className: "event-searchbar-input" }), _jsx("img", { src: searchIconEventspage, alt: "Search", className: "event-searchbar-icon" })] }), _jsxs("div", { className: "event-toggle-tabs", children: [_jsx("button", { className: `event-toggle-tab ${viewType === "UPCOMING" ? "active" : ""}`, onClick: () => setViewType("UPCOMING"), children: "UPCOMING" }), _jsx("button", { className: `event-toggle-tab ${viewType === "PAST" ? "active" : ""}`, onClick: () => setViewType("PAST"), children: "PAST" })] })] }), _jsxs("div", { className: "event-category-search-wrapper", children: [_jsxs("div", { className: "event-category-filter", children: [_jsx("div", { className: "category-buttons-desktop", children: categories.map((category) => (_jsx("span", { className: `category-button ${selectedCategory === category ? "active" : ""}`, onClick: () => setSelectedCategory(category), children: category }, category))) }), _jsx("div", { className: "category-dropdown-mobile", children: _jsx("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "category-select", children: categories.map((category) => _jsx("option", { value: category, children: category }, category)) }) })] }), _jsxs("div", { className: "event-filter-wrapper", children: [_jsxs("select", { className: "event-filter-dropdown", value: selectedMonth, onChange: (e) => setSelectedMonth(e.target.value), children: [_jsx("option", { value: "ALL", children: "All Months" }), monthOptions.map((month) => _jsx("option", { value: month, children: month }, month))] }), _jsxs("select", { className: "event-filter-dropdown", value: selectedYear, onChange: (e) => setSelectedYear(e.target.value), children: [_jsx("option", { value: "ALL", children: "All Years" }), yearOptions.map((year) => _jsx("option", { value: year, children: year }, year))] })] })] }), _jsx("div", { className: "custom-divider-pagination" }), filteredEvents.length > 0 ? (_jsxs("div", { className: "eventsrsvp-grid", children: [currentEvents.map((event) => (_jsxs("div", { className: "event-card", onClick: () => onCardClick(event.event_id), style: { cursor: "pointer" }, children: [_jsx("img", { src: getSafeImageUrl(event.event_image), alt: event.event_title, className: "event-image", loading: "lazy", decoding: "async" }), _jsx("h3", { className: "event-title", children: event.event_title }), _jsx("p", { className: "event-category", children: event.event_category }), _jsxs("p", { className: "event-date", children: [formatDateRSVP(event.event_date), " ", _jsx("br", {}), convertTo12HourFormat(event.event_start_time), " - ", convertTo12HourFormat(event.event_end_time)] }), _jsxs("p", { className: "event-location", children: [_jsx("img", { src: locationIconeventspage, alt: "Location", className: "locationevent-icon" }), event.event_venue] }), viewType === "UPCOMING" && (_jsx("div", { className: "event-buttons", children: _jsx("button", { className: "eventrsvp-button", onClick: (e) => openModal(e, event.event_id), children: "RSVP" }) }))] }, event.event_id))), eventsToShow < filteredEvents.length && (_jsx("div", { className: "see-more-container", children: _jsx("button", { className: "see-more-button", onClick: () => setEventsToShow(p => p + 4), children: "See More" }) }))] })) : (_jsx("div", { className: "no-events-container", children: _jsx("p", { children: "No events found." }) }))] })), showModal && (_jsx("div", { className: "event-rsvp-modal-overlay", onClick: closeModal, children: _jsxs("div", { className: "event-rsvp-modal-content", onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { children: "REGISTER" }), _jsxs("form", { onSubmit: handleSubmit, className: "event-rsvp-form", children: [_jsxs("label", { children: ["Name", _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["Email", _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["Contact", _jsx("input", { type: "text", name: "contact", value: formData.contact, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["What to Expect", _jsx("textarea", { name: "expectations", value: formData.expectations, onChange: handleChange, rows: 4, className: "event-rsvp-form-textarea" })] }), _jsxs("div", { className: "event-rsvp-form-actions", children: [_jsx("button", { type: "button", onClick: closeModal, className: "event-rsvp-form-btn event-rsvp-form-btn-cancel", children: "Cancel" }), _jsx("button", { type: "submit", disabled: submitting, className: "event-rsvp-form-btn event-rsvp-form-btn-submit", children: submitting ? "Submitting..." : "Submit" })] })] })] }) })), _jsx(ToastContainer, { position: "top-center", autoClose: 3000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true })] }));
}
