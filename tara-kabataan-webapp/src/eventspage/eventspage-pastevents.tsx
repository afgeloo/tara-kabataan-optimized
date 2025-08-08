import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { fetchEvents, formatDatePast, convertTo12HourFormat } from "./mockServer";
import "./css/eventpage-pastevents.css";
import locationIconeventspage from "../assets/eventspage/Location-eventspage.png";
import searchIconEventspage from "../assets/eventspage/Search-icon-events.png";
import { useNavigate } from "react-router-dom";

export interface Event {
  event_id: string;
  event_image: string;
  event_category: string;
  event_title: string;
  event_date: string;       // ISO
  event_day: string;
  event_start_time: string; // HH:mm
  event_end_time: string;   // HH:mm
  event_venue: string;
  event_content: string;
  event_speakers: string;
  event_status: string;     // "Completed"/"COMPLETED"/etc.
  created_at: string;
  event_going?: number;
}

/* ---------- helpers ---------- */
const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? "";
const getFullImageUrl = (url: string) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("//")) return url;
  return `${API_BASE}${url.startsWith("/") ? url : `/${url}`}`;
};
const getMonthName = (dateStr: string) =>
  new Date(dateStr).toLocaleString("default", { month: "long" });
const getYearStr = (dateStr: string) => String(new Date(dateStr).getFullYear());

export default function PastEvents() {
  const navigate = useNavigate();

  // data
  const [events, setEvents] = useState<Event[]>([]);

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL"); // kept for parity, not used in UI

  // debounce search input to avoid filtering on every keystroke
  const [searchInput, setSearchInput] = useState("");
  const debounceRef = useRef<number | null>(null);
  const onSearchChange = useCallback((val: string) => {
    setSearchInput(val);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setSearchTerm(val);
    }, 250);
  }, []);

  // fetch + prefilter to completed
  useEffect(() => {
    let mounted = true;
    fetchEvents().then((data: Event[] | unknown) => {
      if (!mounted) return;
      const arr = Array.isArray(data) ? (data as Event[]) : [];
      const completedOnly = arr.filter(
        (e) => (e.event_status || "").toLowerCase() === "completed"
      );
      setEvents(completedOnly);
    });
    return () => {
      mounted = false;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [selectedCategory]); // kept dependency to match your original behavior

  /* ---------- derived options ---------- */
  const currentYear = new Date().getFullYear();

  const earliestYear = useMemo(() => {
    if (!events.length) return currentYear;
    let min = currentYear;
    for (const e of events) {
      const t = Date.parse(e.event_date);
      if (!Number.isNaN(t)) {
        const y = new Date(t).getFullYear();
        if (y < min) min = y;
      }
    }
    return min;
  }, [events, currentYear]);

  const yearOptions = useMemo(() => {
    const out: string[] = [];
    for (let y = earliestYear; y <= currentYear; y++) out.push(String(y));
    return out;
  }, [earliestYear, currentYear]);

  const monthOptions = useMemo(
    () => [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ],
    []
  );

  const categoryOptions = useMemo(
    () => ["Kalusugan","Kalikasan","Karunungan","Kultura","Kasarian"],
    []
  );

  /* ---------- filtering ---------- */
  const filteredEvents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return events.filter((event) => {
      const matchesSearch =
        !q ||
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

  const displayedEvents = useMemo(
    () => (showAll ? filteredEvents : filteredEvents.slice(0, 3)),
    [filteredEvents, showAll]
  );

  return (
    <div className="past-events-container">
      <div className="past-events-header">
        <h1 className="past-events-title">Past Events</h1>

        <div className="search-wrapper">
          <img src={searchIconEventspage} alt="Search" className="search-icon-eventspage" />
          <input
            type="text"
            className="search-input-eventspage"
            placeholder="Search events"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          <select className="search-dropdown" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">Month</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select className="search-dropdown" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Year</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            className="search-dropdown"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Category</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="custom-divider-pastevents"></div>
      </div>

      <div className="past-events-list">
        <div className={`past-events-box transition-wrapper ${showAll ? "expanded" : "collapsed"}`}>
          {displayedEvents.map((event, index) => (
            <div key={index} className="past-event-item">
              <div className="past-event-date">
                <div className="past-event-date-day">{formatDatePast(event.event_date)},</div>
                <p className="past-event-date-weekday">
                  {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long" })}
                </p>
              </div>

              <div className="past-event-details">
                <div
                  className="past-event-card"
                  onClick={() => navigate(`/events/${event.event_id}?from=past`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="past-event-card-content">
                    <div className="past-event-card-text">
                      <p className="past-event-time">
                        {convertTo12HourFormat(event.event_start_time)} - {convertTo12HourFormat(event.event_end_time)}
                      </p>
                      <p className="past-event-title">{event.event_title}</p>
                      <p className="past-event-category">{event.event_category}</p>
                      <p className="past-event-location">
                        <img src={locationIconeventspage} alt="Location" className="locationevent-icon" />
                        {event.event_venue}
                      </p>
                      <p className="past-event-guests">👥 {event.event_going || 0} guests</p>
                    </div>

                    <img
                      src={getFullImageUrl(event.event_image)}
                      alt={event.event_title}
                      className="past-event-image"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        className={`see-more-button ${showAll ? "see-less" : ""}`}
        onClick={() => setShowAll(!showAll)}
      >
        {showAll ? "See Less" : "See More"}
      </button>
    </div>
  );
}
