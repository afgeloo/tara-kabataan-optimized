import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/eventspage/eventpage-details.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "./css/eventdetails.css";
import "./css/eventpage-rsvp.css";
import Header from "../header";
import Footer from "../footer";
import Preloader from "../preloader";
import attachIcon from "../assets/logos/attachicon.jpg";
// IMPORT THE CACHE AND S3 UTILITY DIRECTLY FROM THE RSVP FILE
import { _globalEventsCache, getSafeImageUrl } from "./eventspage-rsvp";
/* ---------- helpers ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
export const formatDateDetails = (dateString) => {
    const t = Date.parse(dateString);
    if (Number.isNaN(t))
        return "Invalid date";
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(t));
};
export const convertTo12HourFormat = (time) => {
    if (!time)
        return "";
    const [h, m] = time.split(":");
    let hour = parseInt(h || "0", 10);
    const minute = (m ?? "00").padEnd(2, "0").slice(0, 2);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
};
function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    // CHECK CACHE FIRST: If the user came from the main page, load instantly!
    const cachedEvent = useMemo(() => _globalEventsCache?.find(e => e.event_id === id) || null, [id]);
    const [event, setEvent] = useState(cachedEvent);
    const [loading, setLoading] = useState(!cachedEvent);
    const [fullImageUrl, setFullImageUrl] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", contact: "", expectations: "" });
    const aboutRef = useRef(null);
    useLayoutEffect(() => {
        const y = sessionStorage.getItem("eventDetailsScrollY");
        if (y) {
            window.scrollTo(0, parseInt(y, 10) || 0);
            sessionStorage.removeItem("eventDetailsScrollY");
        }
    }, []);
    useEffect(() => {
        if (!id || cachedEvent)
            return; // Skip fetching if we already have it!
        const ctrl = new AbortController();
        fetch(`${API_BASE}/events.php`, { signal: ctrl.signal, headers: { Accept: "application/json" } })
            .then((r) => r.json())
            .then((data) => setEvent(Array.isArray(data) ? data.find((e) => e.event_id === id) : null))
            .catch((e) => { if (e?.name !== "AbortError")
            console.error("Error fetching event:", e); })
            .finally(() => setLoading(false));
        return () => ctrl.abort();
    }, [id, cachedEvent]);
    useEffect(() => {
        const lock = showModal || showImageModal;
        document.body.style.overflow = lock ? "hidden" : "";
        const onKey = (e) => {
            if (e.key === "Escape") {
                setShowModal(false);
                setShowImageModal(false);
            }
        };
        if (lock)
            window.addEventListener("keydown", onKey);
        return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
    }, [showModal, showImageModal]);
    // Make images zoomable (The links are already formatted via the Admin panel)
    useEffect(() => {
        const container = aboutRef.current;
        if (!container)
            return;
        // Process Images (Zoom)
        const imgs = Array.from(container.querySelectorAll("img"));
        const handlers = imgs.map((img) => {
            img.style.cursor = "zoom-in";
            const handler = () => { setFullImageUrl(img.src); setShowImageModal(true); };
            img.addEventListener("click", handler);
            return { img, handler };
        });
        return () => handlers.forEach(({ img, handler }) => img.removeEventListener("click", handler));
    }, [event?.event_content]);
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((f) => ({ ...f, [name]: value }));
    }, []);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!id || submitting)
            return;
        try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE}/event_participants.php`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: id, ...formData }),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json.success) {
                toast.success("Registered successfully!");
                setShowModal(false);
                setFormData({ name: "", email: "", contact: "", expectations: "" });
                // INSTANT UI FIX
                setEvent((prev) => prev ? { ...prev, event_going: Number(prev.event_going || 0) + 1 } : prev);
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
    }, [id, formData, submitting]);
    const copyEventLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied!");
        }
        catch {
            toast.error("Failed to copy link");
        }
    }, []);
    const imageUrl = useMemo(() => (event ? getSafeImageUrl(event.event_image) : ""), [event?.event_image]);
    const isPast = useMemo(() => {
        if (!event)
            return false;
        const t = Date.parse(event.event_date);
        if (Number.isNaN(t))
            return false;
        const d = new Date(t);
        const [eh, em] = (event.event_end_time || "00:00").split(":").map(Number);
        d.setHours(eh || 0, em || 0, 0, 0);
        return new Date() > d;
    }, [event?.event_date, event?.event_end_time]);
    const showRSVP = useMemo(() => {
        if (!event)
            return false;
        const t = Date.parse(event.event_date);
        if (Number.isNaN(t))
            return false;
        const d = new Date(t);
        const [sh, sm] = (event.event_start_time || "00:00").split(":").map(Number);
        d.setHours(sh || 0, sm || 0, 0, 0);
        return new Date() < d;
    }, [event]);
    if (loading || !event)
        return _jsx(Preloader, {});
    return (_jsxs("div", { className: "event-details", children: [_jsx(Header, {}), _jsxs("div", { className: "event-details-page", children: [_jsx("div", { className: "back-button-container", children: _jsx("button", { className: "back-button", onClick: () => { sessionStorage.setItem("eventDetailsScrollY", String(window.scrollY)); navigate(-1); }, children: "\u2190 Go Back" }) }), _jsxs("div", { className: "event-details-grid", children: [_jsxs("div", { className: "event-details-left", children: [_jsx("img", { src: imageUrl, alt: "Event", className: "event-details-image", loading: "lazy", style: { cursor: "zoom-in" }, onClick: () => { setFullImageUrl(imageUrl); setShowImageModal(true); } }), _jsxs("div", { className: "event-details-info", children: [_jsxs("div", { className: "event-detail-section-going", children: [_jsxs("p", { className: "event-info-label-going", children: [isPast ? "Total Attended" : "Currently Going", ":"] }), _jsx("p", { className: "event-info-value-going", children: event.event_going || 0 })] }), _jsxs("div", { className: "event-detail-section", children: [_jsx("p", { className: "event-info-label", children: "Speakers" }), _jsx("br", {}), _jsx("div", { className: "event-info-value", dangerouslySetInnerHTML: { __html: (event.event_speakers || "To be announced").replace(/\n/g, "<br>").replace(/  /g, "  ") } })] }), _jsxs("div", { className: "event-detail-section", children: [_jsx("p", { className: "event-info-label", children: "Category" }), _jsx("p", { className: "event-info-category", children: event.event_category })] }), _jsxs("div", { className: "event-detail-section", children: [_jsx("p", { className: "event-info-label", children: "Location" }), _jsx("a", { href: `https://maps.google.com/?q=${encodeURIComponent(event.event_venue)}`, target: "_blank", rel: "noopener noreferrer", className: "event-info-value", style: { textDecoration: "underline", color: "#1299ED", cursor: "pointer", display: "inline-block" }, children: event.event_venue }), _jsx("div", { className: "event-map", children: _jsx("iframe", { src: `https://www.google.com/maps?q=${encodeURIComponent(event.event_venue)}&z=18&output=embed`, width: "100%", height: "250", loading: "lazy", style: { border: "0", borderRadius: "10px", marginTop: "10px" } }) })] })] }), showRSVP && (_jsx("div", { className: "event-detail-section", children: _jsx("button", { className: "event-rsvp-button", onClick: () => setShowModal(true), children: "RSVP" }) }))] }), _jsxs("div", { className: "event-details-right", children: [_jsx("h1", { className: "event-details-title", children: event.event_title }), _jsxs("p", { className: "event-details-date", children: [formatDateDetails(event.event_date), ", ", event.event_day] }), _jsxs("p", { className: "event-details-time", children: [convertTo12HourFormat(event.event_start_time), " - ", convertTo12HourFormat(event.event_end_time)] }), _jsxs("div", { className: "event-about-header", children: [_jsx("span", { children: "About the Event" }), _jsx("div", { className: "copy-link", onClick: copyEventLink, style: { cursor: "pointer", transition: "transform 0.2s" }, onMouseOver: (e) => e.currentTarget.style.transform = "scale(1.1)", onMouseOut: (e) => e.currentTarget.style.transform = "scale(1)", children: _jsx("img", { src: attachIcon, alt: "Copy link" }) })] }), _jsx("div", { className: "event-divider" }), _jsx("div", { className: "event-about", ref: aboutRef, dangerouslySetInnerHTML: { __html: event.event_content } })] })] }), _jsx(ToastContainer, { position: "top-center", autoClose: 1500, hideProgressBar: true, closeOnClick: true, limit: 1 })] }), showModal && (_jsx("div", { className: "event-rsvp-modal-overlay", onClick: () => setShowModal(false), children: _jsxs("div", { className: "event-rsvp-modal-content", onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { children: "REGISTER" }), _jsxs("form", { onSubmit: handleSubmit, className: "event-rsvp-form", children: [_jsxs("label", { children: ["Name", _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["Email", _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["Contact No. (Optional)", _jsx("input", { type: "text", name: "contact", value: formData.contact, onChange: handleChange, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["What to Expect (Optional)", _jsx("textarea", { name: "expectations", value: formData.expectations, onChange: handleChange, rows: 4, className: "event-rsvp-form-textarea" })] }), _jsxs("div", { className: "event-rsvp-form-actions", children: [_jsx("button", { type: "button", onClick: () => setShowModal(false), className: "event-rsvp-form-btn event-rsvp-form-btn-cancel", children: "Cancel" }), _jsx("button", { type: "submit", disabled: submitting, className: "event-rsvp-form-btn event-rsvp-form-btn-submit", children: submitting ? "Submitting..." : "Submit" })] })] })] }) })), showImageModal && fullImageUrl && (_jsxs("div", { className: "zoom-modal", children: [_jsx("div", { className: "zoom-backdrop", onClick: () => setShowImageModal(false) }), _jsx("img", { src: fullImageUrl, alt: "Fullscreen event", className: "zoom-image" }), _jsx("button", { className: "zoom-close", onClick: () => setShowImageModal(false), children: "\u2715" })] })), _jsx(Footer, {})] }));
}
export default EventDetails;
