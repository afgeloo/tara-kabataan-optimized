import React, { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/eventpage-rsvp.css";
import locationIconeventspage from "../assets/eventspage/Location-eventspage.png";
import searchIconEventspage from "../assets/eventspage/Search-icon-events.png";
import Preloader from "../preloader";
import EventsCarousel from "../homepage/events-carousel";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export interface Event {
  event_id: string;
  event_image: string;
  event_category: string;
  event_title: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  event_venue: string;
  event_content: string;
  event_speakers: string;
  event_status: string;
  created_at: string;
  event_going?: number;
}

/* ---------- stable helpers/constants ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const DATE_FMT_FULL = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const MONTH_FMT = new Intl.DateTimeFormat(undefined, { month: "long" });

const getFullImageUrl = (imageUrl: string) => {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("//")) return imageUrl;
  return `${API_BASE}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
};

const formatDateRSVP = (dateString: string) => {
  const t = Date.parse(dateString);
  if (Number.isNaN(t)) return "Invalid date";
  return DATE_FMT_FULL.format(new Date(t));
};

const convertTo12HourFormat = (time: string) => {
  if (!time) return "";
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
  const [viewType, setViewType] = useState<"UPCOMING" | "PAST">(
    () => (sessionStorage.getItem("eventViewType") as "UPCOMING" | "PAST") || "UPCOMING"
  );
  const [selectedCategory, setSelectedCategory] = useState(
    () => sessionStorage.getItem("eventCategory") || "ALL"
  );
  const [searchQuery, setSearchQuery] = useState(
    () => sessionStorage.getItem("eventSearchQuery") || ""
  );
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");

  // data + flags
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringScroll, setRestoringScroll] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    expectations: "",
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const categories = useMemo(
    () => ["ALL", "KALUSUGAN", "KALIKASAN", "KARUNUNGAN", "KULTURA", "KASARIAN"],
    []
  );

  /* ---------- scroll restore BEFORE paint (no flicker) ---------- */
  const restored = useRef(false);
  useLayoutEffect(() => {
    if (!restored.current) {
      const savedScroll = sessionStorage.getItem("eventScrollY");
      if (savedScroll) window.scrollTo(0, parseInt(savedScroll, 10) || 0);
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
    const set = new Set<string>();
    for (const e of events) {
      const t = Date.parse(e.event_date);
      if (!Number.isNaN(t)) set.add(MONTH_FMT.format(new Date(t)));
    }
    return Array.from(set).sort();
  }, [events]);

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of events) {
      const t = Date.parse(e.event_date);
      if (!Number.isNaN(t)) set.add(String(new Date(t).getFullYear()));
    }
    return Array.from(set).sort();
  }, [events]);

  /* ---------- derived: filtered events ---------- */
  const filteredEvents = useMemo(() => {
    const now = new Date();
    const q = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const t = Date.parse(event.event_date);
      if (Number.isNaN(t)) return false;
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
      if ((corrected === "upcoming" || corrected === "ongoing") && isPastEvent) corrected = "completed";
      else if (corrected === "upcoming" && isOngoingNow) corrected = "ongoing";

      const matchesView =
        viewType === "UPCOMING"
          ? corrected === "upcoming" || corrected === "ongoing"
          : corrected === "completed";

      const matchesCategory =
        selectedCategory === "ALL" || event.event_category?.toUpperCase() === selectedCategory;

      const matchesSearch =
        !q ||
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
  const currentEvents = useMemo(
    () => filteredEvents.slice(0, eventsToShow),
    [filteredEvents, eventsToShow]
  );

  /* ---------- derived: carousel slides (sorted once) ---------- */
  const carouselSlides = useMemo(() => {
    if (!events.length) return [];
    const sorted = [...events].sort(
      (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
    );
    return sorted.slice(0, 5).map((event) => ({
      image: getFullImageUrl(event.event_image),
      category: event.event_category,
      title: event.event_title,
      date: formatDateRSVP(event.event_date),
      location: event.event_venue,
    }));
  }, [events]);

  /* ---------- handlers (stable) ---------- */
  const openModal = useCallback((e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    setSelectedEventId(eventId);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => setShowModal(false), []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((fd) => (fd[name as keyof typeof fd] === value ? fd : { ...fd, [name]: value }));
    },
    []
  );

  const [submitting, setSubmitting] = useState(false); // ensure it's declared (typescript)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedEventId) {
        toast.error("No event selected");
        return;
      }
      if (submitting) return;

      try {
        setSubmitting(true);
        const res = await fetch(
          `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/event_participants.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_id: selectedEventId,
              name: formData.name,
              email: formData.email,
              contact: formData.contact,
              expectations: formData.expectations,
            }),
          }
        );
        const json = await res.json();

        if (res.ok && json.success) {
          toast.success("Registered successfully!");
          setEvents((prev) =>
            prev.map((evt) =>
              evt.event_id === selectedEventId ? { ...evt, event_going: (evt.event_going || 0) + 1 } : evt
            )
          );
          setShowModal(false);
          setFormData({ name: "", email: "", contact: "", expectations: "" });
        } else {
          toast.error(json.error || "Registration failed");
        }
      } catch (err) {
        console.error(err);
        toast.error("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [selectedEventId, formData, submitting]
  );

  const handleSeeMore = useCallback(() => setEventsToShow((prev) => prev + 4), []);
  const handleSeeLess = useCallback(() => setEventsToShow((prev) => Math.max(12, prev - 4)), []);

  const onCardClick = useCallback(
    (eventId: string) => {
      sessionStorage.setItem("eventScrollY", String(window.scrollY));
      sessionStorage.setItem("eventViewType", viewType);
      sessionStorage.setItem("eventCategory", selectedCategory);
      sessionStorage.setItem("eventSearchQuery", searchQuery);
      sessionStorage.setItem("eventShowCount", String(eventsToShow));
      navigate(`/events/${eventId}`);
    },
    [viewType, selectedCategory, searchQuery, eventsToShow, navigate]
  );

  // debounce search input to reduce filter recalcs
  const debounceRef = useRef<number | null>(null);
  const onSearchChange = useCallback((val: string) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setSearchQuery(val);
    }, 250);
  }, []);

  // lock background scroll while modal open
  useEffect(() => {
    if (!showModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showModal]);

  // ESC to close modal
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  return (
    <div className="events-page-rsvp">
      {loading || restoringScroll ? (
        <Preloader />
      ) : (
        <>
          <div className="events-header-row">
            <h1 className="eventspage-header-EVENTS">Recent Events</h1>
            {events.length > 0 && (
              <EventsCarousel
                slides={carouselSlides}
                autoSlide
                autoSlideInterval={5000}
              />
            )}
          </div>

          <hr className="events-header-divider" />

          <h1 className="eventspage-header-2-EVENTS">Events</h1>

          <div className="events-header-row-2">
            <div className="event-searchbar-container">
              <input
                type="text"
                placeholder="Search events..."
                defaultValue={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="event-searchbar-input"
              />
              <img src={searchIconEventspage} alt="Search" className="event-searchbar-icon" />
            </div>

            <div className="event-toggle-tabs">
              <button
                className={`event-toggle-tab ${viewType === "UPCOMING" ? "active" : ""}`}
                onClick={() => setViewType("UPCOMING")}
              >
                UPCOMING
              </button>
              <button
                className={`event-toggle-tab ${viewType === "PAST" ? "active" : ""}`}
                onClick={() => setViewType("PAST")}
              >
                PAST
              </button>
            </div>
          </div>

          <div className="event-category-search-wrapper">
            <div className="event-category-filter">
              <div className="category-buttons-desktop">
                {categories.map((category) => (
                  <span
                    key={category}
                    className={`category-button ${selectedCategory === category ? "active" : ""}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </span>
                ))}
              </div>
              <div className="category-dropdown-mobile">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="event-filter-wrapper">
              <select
                className="event-filter-dropdown"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="ALL">All Months</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>

              <select
                className="event-filter-dropdown"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="ALL">All Years</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="custom-divider-pagination"></div>

          {filteredEvents.length > 0 ? (
            <div className="eventsrsvp-grid">
              {currentEvents.map((event) => (
                <div
                  key={event.event_id}
                  className="event-card"
                  onClick={() => onCardClick(event.event_id)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={getFullImageUrl(event.event_image)}
                    alt={event.event_title || "No image available"}
                    className="event-image"
                    loading="lazy"
                    decoding="async"
                  />
                  <h3 className="event-title">{event.event_title}</h3>
                  <p className="event-category">{event.event_category}</p>
                  <p className="event-date">
                    {formatDateRSVP(event.event_date)} <br />
                    {convertTo12HourFormat(event.event_start_time)} - {convertTo12HourFormat(event.event_end_time)}
                  </p>
                  <p className="event-location">
                    <img src={locationIconeventspage} alt="Location" className="locationevent-icon" />
                    {event.event_venue}
                  </p>
                  {viewType === "UPCOMING" && (
                    <div className="event-buttons">
                      <button
                        className="eventrsvp-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(event.event_id);
                          setShowModal(true);
                        }}
                      >
                        RSVP
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {filteredEvents.length > 0 && (
                <div className="see-more-container">
                  {eventsToShow < filteredEvents.length && (
                    <button className="see-more-button" onClick={handleSeeMore}>
                      See More
                    </button>
                  )}
                  {eventsToShow > 12 && (
                    <button className="see-less-button" onClick={handleSeeLess}>
                      Show Less
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="no-events-container">
              <p>No events found.</p>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="event-rsvp-modal-overlay" onClick={closeModal}>
          <div
            className="event-rsvp-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
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
                Contact
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
                <button
                  type="button"
                  onClick={closeModal}
                  className="event-rsvp-form-btn event-rsvp-form-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="event-rsvp-form-btn event-rsvp-form-btn-submit"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default EventsPageRSVP;
