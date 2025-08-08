import "./css/events-sec.css";
import EventsCarousel from "./events-carousel";
import { Link } from "react-router-dom";
import React, { memo, useEffect, useMemo, useState } from "react";

interface EventAPI {
  event_id: string;
  event_image: string;
  event_category: string;
  event_title: string;
  event_date: string;  // ISO-ish date from API
  event_venue: string;
}

interface Slide {
  image: string;
  category: string;
  title: string;
  date: string;
  location: string;
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// safer join for `${BASE_URL}${path}` even if one has/hasn't a slash
const joinUrl = (base: string, path: string) => {
  if (!path) return base;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
};

const EventsSec: React.FC = memo(() => {
  const [slides, setSlides] = useState<Slide[]>([]);

  // Build a single date formatter instance (faster than calling toLocaleDateString repeatedly)
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    []
  );

  useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/tara-kabataan/tara-kabataan-backend/api/events.php`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as unknown;

        if (!Array.isArray(data)) {
          console.warn("Events API did not return an array.");
          return;
        }

        // transform once, filter invalid dates/images, then sort+slice
        const processed = data
          .map((e: EventAPI) => {
            const ts = Date.parse(e.event_date ?? "");
            if (Number.isNaN(ts)) return null;
            const img = e.event_image ? joinUrl(BASE_URL, e.event_image) : "";
            return {
              ts,
              slide: {
                image: img,
                category: e.event_category ?? "",
                title: e.event_title ?? "",
                date: dateFmt.format(ts),
                location: e.event_venue ?? "",
              } as Slide,
            };
          })
          .filter((x): x is { ts: number; slide: Slide } => !!x && !!x.slide.image)
          .sort((a, b) => b.ts - a.ts)
          .slice(0, 5)
          .map((x) => x.slide);

        setSlides(processed);
      } catch (err: any) {
        if (err?.name === "AbortError") return; // unmount/refresh
        console.error("Failed to fetch events:", err);
      }
    })();

    return () => ctrl.abort();
  }, [dateFmt]);

  if (slides.length === 0) return null;

  return (
    <div className="events-sec">
      <div className="events-sec-content">
        <div className="carousel-container">
          <h1 className="events-header">EVENTS</h1>
          {slides.length > 0 && (
            <EventsCarousel slides={slides} autoSlide autoSlideInterval={5000} />
          )}
          <div className="events-sec-nav">
            <Link to="/Events" className="nav-events">
              <img src="./src/assets/homepage/calendar.png" alt="Calendar Icon" />
              SEE MORE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

export default EventsSec;
