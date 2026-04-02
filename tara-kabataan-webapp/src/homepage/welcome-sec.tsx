import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import Marquee from "react-fast-marquee";
import "./css/welcome-sec.css";
import { Link } from "react-router-dom";
import flowersImg from "../assets/homepage/flowers.png";
import welcomeImg from "../assets/homepage/welcome.png";
import cowGifImg from "../assets/homepage/tk-cow-walking.gif";
import welcome1Img from "../assets/homepage/welcome1.png";
import topCloudImg from "../assets/homepage/top-cloud.png";
import logoLabelImg from "../assets/homepage/tk-logo-label.png";
import bulbImg from "../assets/homepage/bulb.png";
import botCloudImg from "../assets/homepage/bot-cloud.png";

const BASE = import.meta.env.VITE_API_BASE_URL as string;

// Memoized so the SVG doesn’t rerender every time
const Wave: React.FC = memo(() => (
  <div className="wave-container">
    <svg
      width="100%"
      height="auto"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      style={{ fillRule: "evenodd", clipRule: "evenodd", strokeLinecap: "round", strokeLinejoin: "round" }}
    >
      <path
        d="M50,39 C200,10 400,70 600,39 C800,10 1000,70 1200,39 C1400,10 1600,70 1800,39"
        style={{
          fill: "none",
          stroke: "#F875AA",
          strokeOpacity: 0.5,
          strokeWidth: 2,
          strokeDasharray: "280 550 160 600 260 350",
        }}
      >
        <animate attributeName="stroke-dashoffset" from="-2200" to="0" dur="32s" repeatCount="indefinite" />
      </path>
    </svg>

    <svg
      width="100%"
      height="auto"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      style={{ fillRule: "evenodd", clipRule: "evenodd", strokeLinecap: "round", strokeLinejoin: "round" }}
    >
      <path
        d="M50,39 C200,10 400,70 600,39 C800,10 1000,70 1200,39 C1400,10 1600,70 1800,39"
        style={{
          fill: "none",
          stroke: "#0F82CA",
          strokeOpacity: 0.5,
          strokeWidth: 2,
          strokeDasharray: "180 250 160 700 260 650",
        }}
        strokeDashoffset="180"
      >
        <animate attributeName="stroke-dashoffset" from="-2020" to="180" dur="32s" repeatCount="indefinite" />
      </path>
    </svg>
  </div>
));

function WelcomeSec() {
  const [overview, setOverview] = useState<string>("Loading...");
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Pre-build arrays once (no new arrays every render)
  const flowers = useMemo(() => Array.from({ length: 6 }), []);
  const spacer = useMemo(() => ({ width: "50px" }), []);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const text = typeof data?.overview === "string" && data.overview.trim()
          ? data.overview
          : "No overview content found.";
        setOverview(text);
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Error fetching overview:", err);
          setOverview("Failed to load overview.");
        }
      }
    })();
    return () => ctrl.abort();
  }, []);

  return (
    <div className="welcome-sec">
      <div className="wave-container">
        <Wave />
      </div>

      <div className="flower-container top-layer">
        <Marquee gradient={false} speed={50} loop={0} play={!prefersReducedMotion}>
          <div className="flowers1">
            {flowers.map((_, i) => (
              <img
                key={`f1-${i}`}
                src={flowersImg}
                alt="Flower"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ))}
            <div style={spacer} />
          </div>
        </Marquee>
      </div>

      <div className="flower-container bottom-layer">
        <Marquee gradient={false} speed={90} loop={0} direction="left" play={!prefersReducedMotion}>
          <div className="flowers2">
            {flowers.map((_, i) => (
              <img
                key={`f2-${i}`}
                src={flowersImg}
                alt="Flower"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ))}
            <div style={spacer} />
          </div>
        </Marquee>
      </div>

      <div className="welcome1">
        <img
          src={welcomeImg}
          alt="Welcome"
          decoding="async"
          draggable={false}
        />
      </div>

      <div className="cow">
        <div className="cow-shadow" />
        <img
          src={cowGifImg}
          alt="Cow"
          decoding="async"
          draggable={false}
        />
      </div>

      <div className="welcome3">
        <img
          src={welcome1Img}
          alt="Welcome 1"
          decoding="async"
          draggable={false}
        />
      </div>

      <div className="clouds-content-container">
        <img
          src={topCloudImg}
          className="top-cloud"
          alt="Top Cloud"
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        <div className="content-section-main">
          <div className="content-grid">
            <div className="empty" />
            <div className="whatsTK">
              <h2>What is TARA KABATAAN?</h2>
              <p>{overview}</p>
            </div>
            <div className="tk-logo">
              <img
                src={logoLabelImg}
                alt="Tara Kabataan"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
            <div className="know-more">
              <Link to="/About" className="nav-know-more">
                <img
                  src={bulbImg}
                  alt="Know More"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
                KNOW MORE
              </Link>
            </div>
            <div className="empty" />
            <div className="empty" />
          </div>
        </div>

        <img
          src={botCloudImg}
          className="bot-cloud"
          alt="Bottom Cloud"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </div>
    </div>
  );
}

export default memo(WelcomeSec);
