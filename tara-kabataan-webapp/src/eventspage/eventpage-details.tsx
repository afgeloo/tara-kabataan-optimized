import { useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { formatDateDetails, convertTo12HourFormat } from "./mockServer";
import { ToastContainer, toast } from "react-toastify";
import "./css/eventdetails.css";
import "./css/eventpage-rsvp.css";
import Header from "../header";
import Footer from "../footer";
import Preloader from "../preloader";
import locationIcon from "../assets/eventspage/Location-eventspage.png";
import attachIcon from "../assets/logos/attachicon.jpg";

export interface Event {
  event_id: string;
  event_image: string;
  event_category: string;
  event_title: string;
  event_date: string;
  event_day: string;
  event_start_time: string;
  event_end_time: string;
  event_venue: string;
  event_content: string;
  event_speakers: string;
  event_status: string;
  created_at: string;
  event_going: number;
  map_url: string;
}

/* ---------- helpers ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const getFullImageUrl = (path: string) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("//")) return path;
  return `${API_BASE}/${path.replace(/^\/+/, "")}`;
};

function EventDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const from = queryParams.get("from");

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", contact: "", expectations: "" });

  const aboutRef = useRef<HTMLDivElement>(null);

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
    if (!id) return;
    const ctrl = new AbortController();
    setLoading(true);

    fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/events.php`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((data) => {
        const selected = Array.isArray(data) ? data.find((e: Event) => e.event_id === id) : null;
        setEvent(selected || null);
      })
      .catch((e) => {
        if (e?.name !== "AbortError") console.error("Error fetching event:", e);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [id]);

  /* ---------- lock background scroll for any modal ---------- */
  useEffect(() => {
    const lock = showModal || showImageModal;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showModal, showImageModal]);

  /* ---------- ESC key to close modals ---------- */
  useEffect(() => {
    if (!showModal && !showImageModal) return;
    const onKey = (e: KeyboardEvent) => {
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
    if (!container) return;

    const imgs = Array.from(container.querySelectorAll<HTMLImageElement>("img"));
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
  const openModal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  }, []);
  const closeModal = useCallback(() => setShowModal(false), []);
  const copyEventLink = useCallback(async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Link copied");
    }
  }, []);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((f) => (f[name as keyof typeof f] === value ? f : { ...f, [name]: value }));
    },
    []
  );
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!id || submitting) return;
      try {
        setSubmitting(true);
        const res = await fetch(
          `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/event_participants.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event_id: id, ...formData }),
          }
        );
        const json = await res.json().catch(() => ({}));
        if (res.ok && (json as any)?.success) {
          toast.success("Registered successfully!");
          closeModal();
          setFormData({ name: "", email: "", contact: "", expectations: "" });
        } else {
          toast.error((json as any)?.error || "Registration failed");
        }
      } catch (err) {
        console.error("RSVP error:", err);
        toast.error("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [id, formData, submitting, closeModal]
  );

  /* ---------- derived values ---------- */
  const imageUrl = useMemo(() => (event ? getFullImageUrl(event.event_image) : ""), [event?.event_image]);
  const isPast = useMemo(() => {
    if (!event) return false;
    const t = Date.parse(event.event_date);
    if (Number.isNaN(t)) return false;
    const d = new Date(t);
    const [eh, em] = (event.event_end_time || "00:00").split(":").map(Number);
    const end = new Date(d);
    end.setHours(eh || 0, em || 0, 0, 0);
    return new Date() > end;
  }, [event?.event_date, event?.event_end_time]);

  const goingLabel = isPast ? "Event Came" : "Event Going";

  const formatContent = useCallback((content: string) => {
    if (!content) return "";
    return content.replace(/\n/g, "<br>").replace(/  /g, " &nbsp;");
  }, []);

  // DATE-AWARE RSVP (only before the event start time)
  const showRSVP = useMemo(() => {
    if (!event) return false;
    const t = Date.parse(event.event_date);
    if (Number.isNaN(t)) return false;
    const eventDate = new Date(t);
    const [sh, sm] = (event.event_start_time || "00:00").split(":").map(Number);
    const start = new Date(eventDate);
    start.setHours(sh || 0, sm || 0, 0, 0);
    return new Date() < start;
  }, [event]);

  if (loading || !event) return <Preloader />;

  return (
    <div className="event-details">
      <Header />
      <div className="event-details-page">
        <div className="back-button-container">
          <button
            className="back-button"
            onClick={() => {
              sessionStorage.setItem("eventDetailsScrollY", String(window.scrollY));
              navigate(-1);
            }}
          >
            ← Go Back
          </button>
        </div>

        <div className="event-details-grid">
          <div className="event-details-left">
            <img
              src={imageUrl}
              alt="Event"
              className="event-details-image"
              loading="lazy"
              decoding="async"
              style={{ cursor: "zoom-in" }}
              onClick={() => {
                setFullImageUrl(imageUrl);
                setShowImageModal(true);
              }}
            />

            <div className="event-details-info">
              <div className="event-detail-section-going">
                <>
                  <p className="event-info-label-going">{goingLabel}:</p>
                  <p className="event-info-value-going">{event.event_going}</p>
                </>
              </div>

              <div className="event-detail-section">
                <p className="event-info-label">Speakers</p>
                <br />
                <div
                  className="event-info-value"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(event.event_speakers || "To be announced"),
                  }}
                />
              </div>

              <div className="event-detail-section">
                <p className="event-info-label">Category</p>
                <p className="event-info-category">{event.event_category}</p>
              </div>

              <div className="event-detail-section">
                <p className="event-info-label">Location</p>
                <p className="event-info-value">{event.event_venue}</p>
                <div className="event-map">
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(event.event_venue)}&z=18&output=embed`}
                    width="100%"
                    height="250"
                    loading="lazy"
                    style={{ border: "0", borderRadius: "10px" }}
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>

            {showRSVP && (
              <div className="event-detail-section">
                <button className="event-rsvp-button" onClick={openModal}>
                  RSVP
                </button>
              </div>
            )}

            {showModal && (
              <div className="event-rsvp-modal-overlay" onClick={closeModal}>
                <div className="event-rsvp-modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>REGISTER</h2>
                  <form onSubmit={handleSubmit} className="event-rsvp-form">
                    <label>
                      Name
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="event-rsvp-form-input"
                      />
                    </label>
                    <label>
                      Email
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="event-rsvp-form-input"
                      />
                    </label>
                    <label>
                      Contact No.
                      <input
                        type="text"
                        name="contact"
                        value={formData.contact}
                        onChange={handleChange}
                        required
                        className="event-rsvp-form-input"
                      />
                    </label>
                    <label>
                      What to Expect
                      <textarea
                        name="expectations"
                        value={formData.expectations}
                        onChange={handleChange}
                        rows={4}
                        className="event-rsvp-form-textarea"
                      />
                    </label>
                    <div className="event-rsvp-form-actions">
                      <button type="button" onClick={closeModal} className="event-rsvp-form-btn event-rsvp-form-btn-cancel">
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting} className="event-rsvp-form-btn event-rsvp-form-btn-submit">
                        {submitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          <div className="event-details-right">
            <h1 className="event-details-title">{event.event_title}</h1>
            <p className="event-details-date">{formatDateDetails(event.event_date)}, {event.event_day}</p>
            <p className="event-details-time">
              {convertTo12HourFormat(event.event_start_time)} - {convertTo12HourFormat(event.event_end_time)}
            </p>

            <div className="event-about-header">
              <span>About the Event</span>
              <div className="copy-link" onClick={copyEventLink}>
                <img src={attachIcon} alt="Copy link" />
              </div>
            </div>
            <div className="event-divider"></div>

            <div
              className="event-about"
              ref={aboutRef}
              dangerouslySetInnerHTML={{ __html: event.event_content }}
            />
          </div>
        </div>

        <ToastContainer
          position="top-center"
          autoClose={1500}
          hideProgressBar
          closeOnClick
          pauseOnFocusLoss={false}
          pauseOnHover
          className="custom-toast-container"
          toastClassName="custom-toast"
          limit={1}
        />
      </div>

      {showImageModal && fullImageUrl && (
        <div className="zoom-modal">
          <div className="zoom-backdrop" onClick={() => setShowImageModal(false)} />
          <img src={fullImageUrl} alt="Fullscreen event" className="zoom-image" />
          <button className="zoom-close" onClick={() => setShowImageModal(false)}>✕</button>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default EventDetails;
