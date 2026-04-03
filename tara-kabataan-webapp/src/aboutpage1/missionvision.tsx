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
  const [mission, setMission] = useState(() => JSON.parse(localStorage.getItem("tk_mission") || '"Loading..."'));
  const [vision, setVision] = useState(() => JSON.parse(localStorage.getItem("tk_vision") || '"Loading..."'));

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`${import.meta.env.VITE_API_BASE_URL}/aboutus.php`, { signal: ctrl.signal })
      .then((res) => res.json())
      .then((data) => {
        const m = data.mission?.trim() || "No mission data.";
        const v = data.vision?.trim() || "No vision data.";
        setMission(m);
        setVision(v);
        localStorage.setItem("tk_mission", JSON.stringify(m));
        localStorage.setItem("tk_vision", JSON.stringify(v));
      })
      .catch((err) => err?.name !== "AbortError" && console.error(err));
    return () => ctrl.abort();
  }, []);

  return (
    <div className="mission-vision-sec">
      <div className="mission-sec-content">
        <h1 className="mission-header">Mission</h1>
        <p className="mission-description" dangerouslySetInnerHTML={{ __html: mission.replace(/\n/g, "<br />") }} />
      </div>
      <div className="vision-sec-content">
        <h1 className="vision-header">Vision</h1>
        <p className="vision-description" dangerouslySetInnerHTML={{ __html: vision.replace(/\n/g, "<br />") }} />
      </div>
    </div>
  );
}

export default MissionVision;
