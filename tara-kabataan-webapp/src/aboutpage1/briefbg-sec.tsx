// src/src/about/BriefBgSection.tsx (or wherever this file lives)

import "./css/briefbg-sec.css";
import React, { memo, useEffect, useState } from "react";
import BgCarousel from "./bgcarousel";

// Prefer static imports so bundlers optimize & hash correctly
import slide1 from "../assets/homepage/about-image-1.png";
import slide2 from "../assets/homepage/events-2.jpg";
import slide3 from "../assets/homepage/events-3.jpg";
import slide4 from "../assets/homepage/events-4.jpg";
import ribbon from "../assets/aboutpage/briefbg-ribbon.png";

type AboutPayload = {
  background?: string | null;
  [k: string]: unknown;
};

// --- tiny in-memory cache (per tab) to avoid refetches ---
let _bgCache: string | null = null;
let _bgCacheAt = 0;
const BG_TTL = 5 * 60 * 1000; // 5 min

const slides = [
  { image: slide1 },
  { image: slide2 },
  { image: slide3 },
  { image: slide4 },
];

const BriefBg: React.FC = memo(() => {
  // PERSISTENT CACHE: Pull from disk immediately
  const [background, setBackground] = useState<string>(() => {
    const cached = localStorage.getItem("tk_about_bg");
    return cached ? JSON.parse(cached) : "Loading...";
  });

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${import.meta.env.VITE_API_BASE_URL}/aboutus.php`, { signal: ctrl.signal })
      .then((res) => res.json())
      .then((data) => {
        const text = data.background?.trim() || "No background content found.";
        setBackground(text);
        // Save to disk for next visit
        localStorage.setItem("tk_about_bg", JSON.stringify(text));
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error(err);
      });
    return () => ctrl.abort();
  }, []);

  return (
    <div className="briefbg-sec">
      <div className="briefbg-carousel-bg"><img src={ribbon} alt="ribbon" loading="lazy" /></div>
      <div className="bg-carousel-container"><BgCarousel slides={slides} autoSlide autoSlideInterval={5000} /></div>
      <div className="briefbg-sec-content">
        <h1 className="briefbg-header">Brief Background</h1>
        <p className="briefbg-description">{background}</p>
      </div>
      <hr className="briefbg-line" />
    </div>
  );
});

export default BriefBg;
