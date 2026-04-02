import "./css/coreval.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ribbon from "../assets/aboutpage/coreval-ribbon.png";
import cow from "../assets/aboutpage/coreval-cow.png";

type AboutPayload = {
  core_kapwa?: string | null;
  core_kalinangan?: string | null;
  core_kaginhawaan?: string | null;
  [k: string]: unknown;
};

// ---- tiny in-tab cache to avoid refetches on remounts ----
let _cacheText: { kapwa: string; kalinangan: string; kaginhawaan: string } | null = null;
let _cacheAt = 0;
const TTL = 5 * 60 * 1000; // 5 min

function CoreValue() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [coreValues, setCoreValues] = useState([
    { title: "Kapwa",      description: "Loading..." },
    { title: "Kalinangan", description: "Loading..." },
    { title: "Kaginhawaan",description: "Loading..." },
  ]);
  const length = coreValues.length;
  const pausedRef = useRef(false);

  // Fetch data with abort + cache
  useEffect(() => {
    const now = Date.now();
    if (_cacheText && now - _cacheAt < TTL) {
      setCoreValues([
        { title: "Kapwa",      description: _cacheText.kapwa },
        { title: "Kalinangan", description: _cacheText.kalinangan },
        { title: "Kaginhawaan",description: _cacheText.kaginhawaan },
      ]);
      return;
    }

    const ctrl = new AbortController();
    fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<AboutPayload>;
      })
      .then((data) => {
        const kapwa       = (data.core_kapwa ?? "").toString().trim()       || "No data.";
        const kalinangan  = (data.core_kalinangan ?? "").toString().trim()  || "No data.";
        const kaginhawaan = (data.core_kaginhawaan ?? "").toString().trim() || "No data.";

        _cacheText = { kapwa, kalinangan, kaginhawaan };
        _cacheAt = Date.now();

        setCoreValues([
          { title: "Kapwa",      description: kapwa },
          { title: "Kalinangan", description: kalinangan },
          { title: "Kaginhawaan",description: kaginhawaan },
        ]);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Fetch error:", err);
          setCoreValues([
            { title: "Kapwa",      description: "Failed to load." },
            { title: "Kalinangan", description: "Failed to load." },
            { title: "Kaginhawaan",description: "Failed to load." },
          ]);
        }
      });

    return () => ctrl.abort();
  }, []);

  // Pause on hover handlers (no class changes required)
  const onMouseEnter = () => { pausedRef.current = true; };
  const onMouseLeave = () => { pausedRef.current = false; };

  // Auto-advance every 5s (pause if tab hidden or hovered)
  useEffect(() => {
    if (length <= 1) return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (pausedRef.current) return;
      setCurrentIndex((i) => (i === length - 1 ? 0 : i + 1));
    };
    const id = setInterval(tick, 5000);
    const onVis = () => { /* reset cycle on vis change */ };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [length]);

  // keep index in range if array length changes
  useEffect(() => {
    setCurrentIndex((i) => (length === 0 ? 0 : Math.min(i, length - 1)));
  }, [length]);

  // Precompute transformed HTML with <br/>s
  const cards = useMemo(
    () =>
      coreValues.map((v) => ({
        ...v,
        __html: v.description.replace(/\n/g, "<br />"),
      })),
    [coreValues]
  );

  return (
    <div className="coreval-sec">
      <h1 className="coreval-header">Core Values</h1>
      <div className="coreval-sec-content">
        <div className="coreval-outer-bg">
          <div className="coreval-inner-bg">
            <img
              src={ribbon}
              alt="Ribbon"
              loading="lazy"
              decoding="async"
            />
          </div>

          <div
            className="coreval-content-wrapper"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <div className="coreval-cow">
              <img
                src={cow}
                alt="Cow"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="corevalues-cards">
              <div className="slider-container">
                <div
                  className="slider"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {cards.map((value, idx) => (
                    <div className="card" key={idx}>
                      <h1>{value.title}</h1>
                      <p dangerouslySetInnerHTML={{ __html: value.__html }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pagination-dots">
                {coreValues.map((_, idx) => (
                  <span
                    key={idx}
                    className={`dot ${idx === currentIndex ? "active" : ""}`}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoreValue;
