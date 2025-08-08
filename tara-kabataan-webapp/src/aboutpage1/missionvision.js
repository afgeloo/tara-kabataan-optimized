import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./css/missiovision.css";
import { useEffect, useState } from "react";
// ---- tiny in-tab cache so we don’t refetch on every mount ----
let _mvCache = null;
let _mvCacheAt = 0;
const TTL = 5 * 60 * 1000; // 5 minutes
function normalize(text, fallback) {
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
        fetch(`${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`, { signal: ctrl.signal })
            .then((res) => {
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return res.json();
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
    return (_jsxs("div", { className: "mission-vision-sec", children: [_jsxs("div", { className: "mission-sec-content", children: [_jsx("h1", { className: "mission-header", children: "Mission" }), _jsx("p", { className: "mission-description", dangerouslySetInnerHTML: {
                            __html: mission.replace(/\n/g, "<br />"),
                        } })] }), _jsxs("div", { className: "vision-sec-content", children: [_jsx("h1", { className: "vision-header", children: "Vision" }), _jsx("p", { className: "vision-description", dangerouslySetInnerHTML: {
                            __html: vision.replace(/\n/g, "<br />"),
                        } })] })] }));
}
export default MissionVision;
