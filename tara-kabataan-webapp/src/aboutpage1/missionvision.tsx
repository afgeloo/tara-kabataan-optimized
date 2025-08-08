import "./css/missiovision.css";
import React, { useEffect, useState } from "react";

type AboutPayload = {
  mission?: string | null;
  vision?: string | null;
  [k: string]: unknown;
};

// ---- tiny in-tab cache so we don’t refetch on every mount ----
let _mvCache: { mission: string; vision: string } | null = null;
let _mvCacheAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes

function normalize(text: unknown, fallback: string) {
  const str = (typeof text === "string" ? text : "")?.trim();
  return str || fallback;
}

function MissionVision() {
  const [mission, setMission] = useState("Loading...");
  const [vision, setVision] = useState("Loading...");

  useEffect(() => {
    const now = Date.now();
    if (_mvCache && now - _mvCacheAt < TTL) {
      setMission(_mvCache.mission);
      setVision(_mvCache.vision);
      return;
    }

    const ctrl = new AbortController();

    fetch(
      `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`,
      { signal: ctrl.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<AboutPayload>;
      })
      .then((data) => {
        const m = normalize(data.mission, "No data.");
        const v = normalize(data.vision, "No data.");
        _mvCache = { mission: m, vision: v };
        _mvCacheAt = Date.now();
        // single state flush (helps avoid 2 paints)
        setMission(m);
        setVision(v);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Fetch error:", err);
          setMission("Failed to load.");
          setVision("Failed to load.");
        }
      });

    return () => ctrl.abort();
  }, []);

  return (
    <div className="mission-vision-sec">
      <div className="mission-sec-content">
        <h1 className="mission-header">Mission</h1>
        <p
          className="mission-description"
          dangerouslySetInnerHTML={{
            __html: mission.replace(/\n/g, "<br />"),
          }}
        />
      </div>

      <div className="vision-sec-content">
        <h1 className="vision-header">Vision</h1>
        <p
          className="vision-description"
          dangerouslySetInnerHTML={{
            __html: vision.replace(/\n/g, "<br />"),
          }}
        />
      </div>
    </div>
  );
}

export default MissionVision;
