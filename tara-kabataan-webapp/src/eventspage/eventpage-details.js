import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { formatDateDetails, convertTo12HourFormat } from "./mockServer";
import { ToastContainer, toast } from "react-toastify";
import "./css/eventdetails.css";
import "./css/eventpage-rsvp.css";
import Header from "../header";
import Footer from "../footer";
import Preloader from "../preloader";
import attachIcon from "../assets/logos/attachicon.jpg";
/* ---------- helpers ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const getFullImageUrl = (path) => {
    if (!path)
        return "";
    if (/^https?:\/\//i.test(path) || path.startsWith("//"))
        return path;
    return `${API_BASE}/${path.replace(/^\/+/, "")}`;
};
function EventDetails() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const from = queryParams.get("from");
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fullImageUrl, setFullImageUrl] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: "", email: "", contact: "", expectations: "" });
    const aboutRef = useRef(null);
    /* ---------- scroll restore BEFORE paint ---------- */
    useLayoutEffect(() => {
        const y = sessionStorage.getItem("eventDetailsScrollY");
        if (y) {
            window.scrollTo(0, parseInt(y, 10) || 0);
            sessionStorage.removeItem("eventDetailsScrollY");
        }
    }, []);
    /* ---------- fetch event (abortable) ---------- */
    useEffect(() => {
        if (!id)
            return;
        const ctrl = new AbortController();
        setLoading(true);
        fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/events.php`, {
            signal: ctrl.signal,
            headers: { Accept: "application/json" },
            cache: "no-store",
        })
            .then((r) => r.json())
            .then((data) => {
            const selected = Array.isArray(data) ? data.find((e) => e.event_id === id) : null;
            setEvent(selected || null);
        })
            .catch((e) => {
            if (e?.name !== "AbortError")
                console.error("Error fetching event:", e);
        })
            .finally(() => setLoading(false));
        return () => ctrl.abort();
    }, [id]);
    /* ---------- lock background scroll for any modal ---------- */
    useEffect(() => {
        const lock = showModal || showImageModal;
        const prev = document.body.style.overflow;
        if (lock)
            document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [showModal, showImageModal]);
    /* ---------- ESC key to close modals ---------- */
    useEffect(() => {
        if (!showModal && !showImageModal)
            return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                setShowModal(false);
                setShowImageModal(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showModal, showImageModal]);
    /* ---------- click-to-zoom for images inside rich content ---------- */
    useEffect(() => {
        const container = aboutRef.current;
        if (!container)
            return;
        const imgs = Array.from(container.querySelectorAll("img"));
        const handlers = imgs.map((img) => {
            img.style.cursor = "zoom-in";
            const handler = () => {
                setFullImageUrl(img.src);
                setShowImageModal(true);
            };
            img.addEventListener("click", handler);
            return { img, handler };
        });
        return () => handlers.forEach(({ img, handler }) => img.removeEventListener("click", handler));
    }, [event?.event_content]);
    /* ---------- handlers ---------- */
    const openModal = useCallback((e) => {
        e.stopPropagation();
        setShowModal(true);
    }, []);
    const closeModal = useCallback(() => setShowModal(false), []);
    const copyEventLink = useCallback(async () => {
        const link = window.location.href;
        try {
            await navigator.clipboard.writeText(link);
            toast.success("Link copied!");
        }
        catch {
            const textarea = document.createElement("textarea");
            textarea.value = link;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            toast.success("Link copied");
        }
    }, []);
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData((f) => (f[name] === value ? f : { ...f, [name]: value }));
    }, []);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!id || submitting)
            return;
        try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/event_participants.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_id: id, ...formData }),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json?.success) {
                toast.success("Registered successfully!");
                closeModal();
                setFormData({ name: "", email: "", contact: "", expectations: "" });
            }
            else {
                toast.error(json?.error || "Registration failed");
            }
        }
        catch (err) {
            console.error("RSVP error:", err);
            toast.error("Network error. Please try again.");
        }
        finally {
            setSubmitting(false);
        }
    }, [id, formData, submitting, closeModal]);
    /* ---------- derived values ---------- */
    const imageUrl = useMemo(() => (event ? getFullImageUrl(event.event_image) : ""), [event?.event_image]);
    const isPast = useMemo(() => {
        if (!event)
            return false;
        const t = Date.parse(event.event_date);
        if (Number.isNaN(t))
            return false;
        const d = new Date(t);
        const [eh, em] = (event.event_end_time || "00:00").split(":").map(Number);
        const end = new Date(d);
        end.setHours(eh || 0, em || 0, 0, 0);
        return new Date() > end;
    }, [event?.event_date, event?.event_end_time]);
    const goingLabel = isPast ? "Event Came" : "Event Going";
    const formatContent = useCallback((content) => {
        if (!content)
            return "";
        return content.replace(/\n/g, "<br>").replace(/  /g, " &nbsp;");
    }, []);
    // DATE-AWARE RSVP (only before the event start time)
    const showRSVP = useMemo(() => {
        if (!event)
            return false;
        const t = Date.parse(event.event_date);
        if (Number.isNaN(t))
            return false;
        const eventDate = new Date(t);
        const [sh, sm] = (event.event_start_time || "00:00").split(":").map(Number);
        const start = new Date(eventDate);
        start.setHours(sh || 0, sm || 0, 0, 0);
        return new Date() < start;
    }, [event]);
    if (loading || !event)
        return _jsx(Preloader, {});
    return (_jsxs("div", { className: "event-details", children: [_jsx(Header, {}), _jsxs("div", { className: "event-details-page", children: [_jsx("div", { className: "back-button-container", children: _jsx("button", { className: "back-button", onClick: () => {
                                sessionStorage.setItem("eventDetailsScrollY", String(window.scrollY));
                                navigate(-1);
                            }, children: "\u2190 Go Back" }) }), _jsxs("div", { className: "event-details-grid", children: [_jsxs("div", { className: "event-details-left", children: [_jsx("img", { src: imageUrl, alt: "Event", className: "event-details-image", loading: "lazy", decoding: "async", style: { cursor: "zoom-in" }, onClick: () => {
                                            setFullImageUrl(imageUrl);
                                            setShowImageModal(true);
                                        } }), _jsxs("div", { className: "event-details-info", children: [_jsx("div", { className: "event-detail-section-going", children: _jsxs(_Fragment, { children: [_jsxs("p", { className: "event-info-label-going", children: [goingLabel, ":"] }), _jsx("p", { className: "event-info-value-going", children: event.event_going })] }) }), _jsxs("div", { className: "event-detail-section", children: [_jsx("p", { className: "event-info-label", children: "Speakers" }), _jsx("br", {}), _jsx("div", { className: "event-info-value", dangerouslySetInnerHTML: {
                                                            __html: formatContent(event.event_speakers || "To be announced"),
                                                        } })] }), _jsxs("div", { className: "event-detail-section", children: [_jsx("p", { className: "event-info-label", children: "Category" }), _jsx("p", { className: "event-info-category", children: event.event_category })] }), _jsxs("div", { className: "event-detail-section", children: [_jsx("p", { className: "event-info-label", children: "Location" }), _jsx("p", { className: "event-info-value", children: event.event_venue }), _jsx("div", { className: "event-map", children: _jsx("iframe", { src: `https://www.google.com/maps?q=${encodeURIComponent(event.event_venue)}&z=18&output=embed`, width: "100%", height: "250", loading: "lazy", style: { border: "0", borderRadius: "10px" }, referrerPolicy: "no-referrer-when-downgrade" }) })] })] }), showRSVP && (_jsx("div", { className: "event-detail-section", children: _jsx("button", { className: "event-rsvp-button", onClick: openModal, children: "RSVP" }) })), showModal && (_jsx("div", { className: "event-rsvp-modal-overlay", onClick: closeModal, children: _jsxs("div", { className: "event-rsvp-modal-content", onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { children: "REGISTER" }), _jsxs("form", { onSubmit: handleSubmit, className: "event-rsvp-form", children: [_jsxs("label", { children: ["Name", _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["Email", _jsx("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["Contact No.", _jsx("input", { type: "text", name: "contact", value: formData.contact, onChange: handleChange, required: true, className: "event-rsvp-form-input" })] }), _jsxs("label", { children: ["What to Expect", _jsx("textarea", { name: "expectations", value: formData.expectations, onChange: handleChange, rows: 4, className: "event-rsvp-form-textarea" })] }), _jsxs("div", { className: "event-rsvp-form-actions", children: [_jsx("button", { type: "button", onClick: closeModal, className: "event-rsvp-form-btn event-rsvp-form-btn-cancel", children: "Cancel" }), _jsx("button", { type: "submit", disabled: submitting, className: "event-rsvp-form-btn event-rsvp-form-btn-submit", children: submitting ? "Submitting..." : "Submit" })] })] })] }) }))] }), _jsxs("div", { className: "event-details-right", children: [_jsx("h1", { className: "event-details-title", children: event.event_title }), _jsxs("p", { className: "event-details-date", children: [formatDateDetails(event.event_date), ", ", event.event_day] }), _jsxs("p", { className: "event-details-time", children: [convertTo12HourFormat(event.event_start_time), " - ", convertTo12HourFormat(event.event_end_time)] }), _jsxs("div", { className: "event-about-header", children: [_jsx("span", { children: "About the Event" }), _jsx("div", { className: "copy-link", onClick: copyEventLink, children: _jsx("img", { src: attachIcon, alt: "Copy link" }) })] }), _jsx("div", { className: "event-divider" }), _jsx("div", { className: "event-about", ref: aboutRef, dangerouslySetInnerHTML: { __html: event.event_content } })] })] }), _jsx(ToastContainer, { position: "top-center", autoClose: 1500, hideProgressBar: true, closeOnClick: true, pauseOnFocusLoss: false, pauseOnHover: true, className: "custom-toast-container", toastClassName: "custom-toast", limit: 1 })] }), showImageModal && fullImageUrl && (_jsxs("div", { className: "zoom-modal", children: [_jsx("div", { className: "zoom-backdrop", onClick: () => setShowImageModal(false) }), _jsx("img", { src: fullImageUrl, alt: "Fullscreen event", className: "zoom-image" }), _jsx("button", { className: "zoom-close", onClick: () => setShowImageModal(false), children: "\u2715" })] })), _jsx(Footer, {})] }));
}
export default EventDetails;
