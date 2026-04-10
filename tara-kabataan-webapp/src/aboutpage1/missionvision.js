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
    return (_jsxs("div", { className: "mission-vision-sec", children: [_jsxs("div", { className: "mission-sec-content", children: [_jsx("h1", { className: "mission-header", children: "Mission" }), _jsx("p", { className: "mission-description", dangerouslySetInnerHTML: { __html: mission.replace(/\n/g, "<br />") } })] }), _jsxs("div", { className: "vision-sec-content", children: [_jsx("h1", { className: "vision-header", children: "Vision" }), _jsx("p", { className: "vision-description", dangerouslySetInnerHTML: { __html: vision.replace(/\n/g, "<br />") } })] })] }));
}
export default MissionVision;
