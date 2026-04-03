import "./css/events-sec.css";
import EventsCarousel from "./events-carousel";
import { Link } from "react-router-dom";
import React, { memo, useEffect, useMemo, useState } from "react";
import calendarImg from "../assets/homepage/calendar.png";

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
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";

const getSafeImageUrl = (url?: string | null) => {
  if (!url) return "";

  // 1. If it already has the full S3 URL, just use it!
  if (url.startsWith("http") || url.startsWith("//")) {
    return url;
  }

  // 2. Clean up the path (removes any lingering local paths and double folders)
  let cleanPath = url
    .replace(/^\/?tara-kabataan-optimized\/tara-kabataan-webapp\/uploads\//, "")
    .replace("events-images/events-images/", "events-images/");

  // 3. Remove leading slash if it exists
  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.substring(1);
  }

  // 4. Combine them cleanly
  return `${IMAGE_BASE}/${cleanPath}`;
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
          `${BASE_URL}/events.php`,
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
            
            // Use the new safe image function here!
            const img = getSafeImageUrl(e.event_image);
            
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
              <img src={calendarImg} alt="Calendar Icon" />
              SEE MORE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

export default EventsSec;