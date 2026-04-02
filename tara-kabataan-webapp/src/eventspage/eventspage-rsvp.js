import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
const DATE_FMT_FULL = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
});
const MONTH_FMT = new Intl.DateTimeFormat(undefined, { month: "long" });
const getFullImageUrl = (imageUrl) => {
    if (!imageUrl)
        return "";
    if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("//"))
        return imageUrl;
    return `${API_BASE}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
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
function EventsPageRSVP() {
    const navigate = useNavigate();
    // persisted view state
    const [eventsToShow, setEventsToShow] = useState(() => {
        const saved = sessionStorage.getItem("eventShowCount");
        return saved ? parseInt(saved, 10) : 12;
    });
    const [viewType, setViewType] = useState(() => sessionStorage.getItem("eventViewType") || "UPCOMING");
    const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem("eventCategory") || "ALL");
    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("eventSearchQuery") || "");
    const [selectedMonth, setSelectedMonth] = useState("ALL");
    const [selectedYear, setSelectedYear] = useState("ALL");
    // data + flags
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [restoringScroll, setRestoringScroll] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        contact: "",
        expectations: "",
    });
    const [selectedEventId, setSelectedEventId] = useState(null);
    const categories = useMemo(() => ["ALL", "KALUSUGAN", "KALIKASAN", "KARUNUNGAN", "KULTURA", "KASARIAN"], []);
    /* ---------- scroll restore BEFORE paint (no flicker) ---------- */
    const restored = useRef(false);
    useLayoutEffect(() => {
        if (!restored.current) {
            const savedScroll = sessionStorage.getItem("eventScrollY");
            if (savedScroll)
                window.scrollTo(0, parseInt(savedScroll, 10) || 0);
            restored.current = true;
        }
    }, []);
    /* ---------- fetch events (abortable) ---------- */
    useEffect(() => {
        const ctrl = new AbortController();
        setLoading(true);
        fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/events.php`, {
            signal: ctrl.signal,
            headers: { Accept: "application/json" },
            cache: "no-store",
        })
            .then((res) => res.json())
            .then((data) => {
            setEvents(Array.isArray(data) ? data : []);
            // if we restored from scroll, clear those persisted keys now
            const savedScroll = sessionStorage.getItem("eventScrollY");
            if (savedScroll) {
                sessionStorage.removeItem("eventScrollY");
                sessionStorage.removeItem("eventViewType");
                sessionStorage.removeItem("eventCategory");
                sessionStorage.removeItem("eventSearchQuery");
            }
            setRestoringScroll(false);
        })
            .catch((err) => {
            if (err?.name !== "AbortError") {
                console.error("Error fetching events:", err);
                setRestoringScroll(false);
            }
        })
            .finally(() => setLoading(false));
        return () => ctrl.abort();
    }, []);
    /* ---------- derived: month/year options ---------- */
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
    /* ---------- derived: filtered events ---------- */
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
            const start = new Date(eventDate);
            start.setHours(sh || 0, sm || 0, 0, 0);
            const end = new Date(eventDate);
            end.setHours(eh || 0, em || 0, 0, 0);
            const isOngoingNow = now >= start && now <= end;
            const isPastEvent = now > end;
            let corrected = (event.event_status || "").toLowerCase();
            if ((corrected === "upcoming" || corrected === "ongoing") && isPastEvent)
                corrected = "completed";
            else if (corrected === "upcoming" && isOngoingNow)
                corrected = "ongoing";
            const matchesView = viewType === "UPCOMING"
                ? corrected === "upcoming" || corrected === "ongoing"
                : corrected === "completed";
            const matchesCategory = selectedCategory === "ALL" || event.event_category?.toUpperCase() === selectedCategory;
            const matchesSearch = !q ||
                event.event_title?.toLowerCase().includes(q) ||
                event.event_category?.toLowerCase().includes(q) ||
                event.event_venue?.toLowerCase().includes(q) ||
                formatDateRSVP(event.event_date).toLowerCase().includes(q);
            const matchesMonth = selectedMonth === "ALL" || eventMonth === selectedMonth;
            const matchesYear = selectedYear === "ALL" || eventYear === selectedYear;
            return matchesView && matchesCategory && matchesSearch && matchesMonth && matchesYear;
        });
    }, [events, viewType, selectedCategory, searchQuery, selectedMonth, selectedYear]);
    /* ---------- derived: currentEvents for grid ---------- */
    const currentEvents = useMemo(() => filteredEvents.slice(0, eventsToShow), [filteredEvents, eventsToShow]);
    /* ---------- derived: carousel slides (sorted once) ---------- */
    const carouselSlides = useMemo(() => {
        if (!events.length)
            return [];
        const sorted = [...events].sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime());
        return sorted.slice(0, 5).map((event) => ({
            image: getFullImageUrl(event.event_image),
            category: event.event_category,
            title: event.event_title,
            date: formatDateRSVP(event.event_date),
            location: event.event_venue,
        }));
    }, [events]);
    /* ---------- handlers (stable) ---------- */
    const openModal = useCallback((e, eventId) => {
        e.stopPropagation();
        setSelectedEventId(eventId);
        setShowModal(true);
    }, []);
    const closeModal = useCallback(() => setShowModal(false), []);
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((fd) => (fd[name] === value ? fd : { ...fd, [name]: value }));
    }, []);
    const [submitting, setSubmitting] = useState(false); // ensure it's declared (typescript)
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedEventId) {
            toast.error("No event selected");
            return;
        }
        if (submitting)
            return;
        try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/event_participants.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    event_id: selectedEventId,
                    name: formData.name,
                    email: formData.email,
                    contact: formData.contact,
                    expectations: formData.expectations,
                }),
            });
            const json = await res.json();
            if (res.ok && json.success) {
                toast.success("Registered successfully!");
                setEvents((prev) => prev.map((evt) => evt.event_id === selectedEventId ? { ...evt, event_going: (evt.event_going || 0) + 1 } : evt));
                setShowModal(false);
                setFormData({ name: "", email: "", contact: "", expectations: "" });
            }
            else {
                toast.error(json.error || "Registration failed");
            }
        }
        catch (err) {
            console.error(err);
            toast.error("Network error. Please try again.");
        }
        finally {
            setSubmitting(false);
        }
    }, [selectedEventId, formData, submitting]);
    const handleSeeMore = useCallback(() => setEventsToShow((prev) => prev + 4), []);
    const handleSeeLess = useCallback(() => setEventsToShow((prev) => Math.max(12, prev - 4)), []);
    const onCardClick = useCallback((eventId) => {
        sessionStorage.setItem("eventScrollY", String(window.scrollY));
        sessionStorage.setItem("eventViewType", viewType);
        sessionStorage.setItem("eventCategory", selectedCategory);
        sessionStorage.setItem("eventSearchQuery", searchQuery);
        sessionStorage.setItem("eventShowCount", String(eventsToShow));
        navigate(`/events/${eventId}`);
    }, [viewType, selectedCategory, searchQuery, eventsToShow, navigate]);
    // debounce search input to reduce filter recalcs
    const debounceRef = useRef(null);
    const onSearchChange = useCallback((val) => {
        if (debounceRef.current)
            window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            setSearchQuery(val);
        }, 250);
    }, []);
    // lock background scroll while modal open
    useEffect(() => {
        if (!showModal)
            return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [showModal]);
    // ESC to close modal
    useEffect(() => {
        if (!showModal)
            return;
        const onKey = (e) => {
            if (e.key === "Escape")
                setShowModal(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showModal]);
    return (_jsxs("div", { className: "events-page-rsvp", children: [loading || restoringScroll ? (_jsx(Preloader, {})) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "events-header-row", children: [_jsx("h1", { className: "eventspage-header-EVENTS", children: "Recent Events" }), events.length > 0 && (_jsx(EventsCarousel, { slides: carouselSlides, autoSlide: true, autoSlideInterval: 5000 }))] }), _jsx("hr", { className: "events-header-divider" }), _jsx("h1", { className: "eventspage-header-2-EVENTS", children: "Events" }), _jsxs("div", { className: "events-header-row-2", children: [_jsxs("div", { className: "event-searchbar-container", children: [_jsx("input", { type: "text", placeholder: "Search events...", defaultValue: searchQuery, onChange: (e) => onSearchChange(e.target.value), className: "event-searchbar-input" }), _jsx("img", { src: searchIconEventspage, alt: "Search", className: "event-searchbar-icon" })] }), _jsxs("div", { className: "event-toggle-tabs", children: [_jsx("button", { className: `event-toggle-tab ${viewType === "UPCOMING" ? "active" : ""}`, onClick: () => setViewType("UPCOMING"), children: "UPCOMING" }), _jsx("button", { className: `event-toggle-tab ${viewType === "PAST" ? "active" : ""}`, onClick: () => setViewType("PAST"), children: "PAST" })] })] }), _jsxs("div", { className: "event-category-search-wrapper", children: [_jsxs("div", { className: "event-category-filter", children: [_jsx("div", { className: "category-buttons-desktop", children: categories.map((category) => (_jsx("span", { className: `category-button ${selectedCategory === category ? "active" : ""}`, onClick: () => setSelectedCategory(category), children: category }, category))) }), _jsx("div", { className: "category-dropdown-mobile", children: _jsx("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), className: "category-select", children: categories.map((category) => (_jsx("option", { value: category, children: category }, category))) }) })] }), _jsxs("div", { className: "event-filter-wrapper", children: [_jsxs("select", { className: "event-filter-dropdown", value: selectedMonth, onChange: (e) => setSelectedMonth(e.target.value), children: [_jsx("option", { value: "ALL", children: "All Months" }), monthOptions.map((month) => (_jsx("option", { value: month, children: month }, month)))] }), _jsxs("select", { className: "event-filter-dropdown", value: selectedYear, onChange: (e) => setSelectedYear(e.target.value), children: [_jsx("option", { value: "ALL", children: "All Years" }), yearOptions.map((year) => (_jsx("option", { value: year, children: year }, year)))] })] })] }), _jsx("div", { className: "custom-divider-pagination" }), filteredEvents.length > 0 ? (_jsxs("div", { className: "eventsrsvp-grid", children: [currentEvents.map((event) => (_jsxs("div", { className: "event-card", onClick: () => onCardClick(event.event_id), style: { cursor: "pointer" }, children: [_jsx("img", { src: getFullImageUrl(event.event_image), alt: event.event_title || "No image available", className: "event-image", loading: "lazy", decoding: "async" }), _jsx("h3", { className: "event-title", children: event.event_title }), _jsx("p", { className: "event-category", children: event.event_category }), _jsxs("p", { className: "event-date", children: [formatDateRSVP(event.event_date), " ", _jsx("br", {}), convertTo12HourFormat(event.event_start_time), " - ", convertTo12HourFormat(event.event_end_time)] }), _jsxs("p", { className: "event-location", children: [_jsx("img", { src: locationIconeventspage, alt: "Location", className: "locationevent-icon" }), event.event_venue] }), viewType === "UPCOMING" && (_jsx("div", { className: "event-buttons", children: _jsx("button", { className: "eventrsvp-button", onClick: (e) => {
                                                e.stopPropagation();
                                                setSelectedEventId(event.event_id);
                                                setShowModal(true);
                                            }, children: "RSVP" }) }))] }, event.event_id))), filteredEvents.length > 0 && (_jsxs("div", { className: "see-more-container", children: [eventsToShow < filteredEvents.length && (_jsx("button", { className: "see-more-button", onClick: handleSeeMore, children: "See More" })), eventsToShow > 12 && (_jsx("button", { className: "see-less-button", onClick: handleSeeLess, children: "Show Less" }))] }))] })) : (_jsx("div", { className: "no-events-container", children: _jsx("p", { children: "No events found." }) }))] })), showModal && (_jsx("div", { className: "event-rsvp-modal-overlay", onClick: closeModal, children: _jsxs("div", { className: "event-rsvp-modal-content", onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { children: "REGISTER" }), _jsxs("form", { onSubmit: handleSubmit, className: "event-rsvp-form", children: [_jsxs("label", { children: ["Name", _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["Email", _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["Contact", _jsx("input", { type: "text", name: "contact", value: formData.contact, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["What to Expect", _jsx("textarea", { name: "expectations", value: formData.expectations, onChange: handleChange, rows: 4, className: "event-rsvp-form-textarea" })] }), _jsxs("div", { className: "event-rsvp-form-actions", children: [_jsx("button", { type: "button", onClick: closeModal, className: "event-rsvp-form-btn event-rsvp-form-btn-cancel", children: "Cancel" }), _jsx("button", { type: "submit", disabled: submitting, className: "event-rsvp-form-btn event-rsvp-form-btn-submit", children: submitting ? "Submitting..." : "Submit" })] })] })] }) })), _jsx(ToastContainer, { position: "top-center", autoClose: 3000, hideProgressBar: false, newestOnTop: false, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true })] }));
}
export default EventsPageRSVP;
