import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/Council.tsx
import "./css/council.css";
import { useEffect, useMemo, useState } from "react";
import placeholderImg from "../assets/aboutpage/img-placeholder-guy.png";
import ribbon from "../assets/aboutpage/council-ribbon.png";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const BLACKLISTED_ROLES = ["Kalusugan", "Kalikasan", "Karunungan", "Kultura", "Kasarian"];
// ---- tiny in-tab cache to avoid refetches per mount ----
let _cacheAt = 0;
let _councilCache = null;
let _aboutCache = null;
const TTL = 5 * 60 * 1000;
const resolveImage = (raw) => {
    if (!raw || !raw.trim())
        return placeholderImg;
    if (raw.startsWith("http"))
        return raw;
    const [path, query] = raw.split("?");
    const hasOpt = path.includes("/tara-kabataan-optimized/");
    const hasNon = path.includes("/tara-kabataan-optimized/");
    let full = hasOpt || hasNon ? `${API_BASE}${path}` : `${API_BASE}/tara-kabataan-optimized/${path.startsWith("/") ? path.slice(1) : path}`;
    if (query)
        full += `?${query}`;
    return full;
};
export default function Council() {
    const [councilData, setCouncilData] = useState(_councilCache ?? []);
    const [councilText, setCouncilText] = useState(_aboutCache ?? "Loading...");
    useEffect(() => {
        const now = Date.now();
        const fresh = now - _cacheAt < TTL && _councilCache && _aboutCache;
        if (fresh)
            return;
        const ctrl = new AbortController();
        const aboutUrl = `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`;
        const councilUrl = `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/council.php`;
        Promise.all([
            fetch(aboutUrl, { signal: ctrl.signal }).then((r) => (r.ok ? r.json() : Promise.reject(r))),
            fetch(councilUrl, { signal: ctrl.signal }).then((r) => (r.ok ? r.json() : Promise.reject(r))),
        ])
            .then(([about, council]) => {
            const text = (about?.council ?? "").toString().trim() || "No data.";
            const blacklist = new Set(BLACKLISTED_ROLES.map((s) => s.toLowerCase()));
            const normalized = Array.isArray(council)
                ? council
                    .map((m) => ({
                    ...m,
                    role_name: (m.role_name ?? "").trim(),
                    member_image: resolveImage(m.member_image),
                }))
                    .filter((m) => !blacklist.has(m.role_name.toLowerCase()))
                : [];
            _aboutCache = text;
            _councilCache = normalized;
            _cacheAt = Date.now();
            setCouncilText(text);
            setCouncilData(normalized);
        })
            .catch((err) => {
            if (err?.name !== "AbortError") {
                console.error("Council fetch error:", err);
                if (!_aboutCache)
                    setCouncilText("Failed to load.");
                if (!_councilCache)
                    setCouncilData([]);
            }
        });
        return () => ctrl.abort();
    }, []);
    // Identify president (case-insensitive), then others
    const { president, others } = useMemo(() => {
        const prez = councilData.find((m) => m.role_name.toLowerCase() === "president");
        const rest = councilData.filter((m) => m !== prez);
        return { president: prez, others: rest };
    }, [councilData]);
    return (_jsxs("div", { className: "council-sec", children: [_jsx("div", { className: "council-ribbon", children: _jsx("img", { src: ribbon, alt: "ribbon", loading: "lazy", decoding: "async" }) }), _jsxs("div", { className: "council-sec-content", children: [_jsx("h1", { className: "council-header", children: "Council" }), _jsx("p", { className: "council-description", dangerouslySetInnerHTML: { __html: councilText.replace(/\n/g, "<br />") } })] }), president && (_jsx("div", { className: "council-president-grid", children: _jsx("div", { className: "council-card council-card-main", children: _jsx("div", { className: "council-inner-card-1-president", children: _jsxs("div", { className: "council-inner-card-2", children: [_jsx("div", { className: "council-member-image", children: _jsx("img", { src: president.member_image ?? placeholderImg, alt: president.member_name, loading: "lazy", decoding: "async", width: 320, height: 320 }) }), _jsx("h1", { className: "council-member-name", children: president.member_name }), _jsx("p", { className: "council-member-role", children: president.role_name })] }) }) }) })), _jsx("div", { className: "council-grid", children: others.map((member) => (_jsx("div", { className: "council-card", children: _jsx("div", { className: "council-inner-card-1-members", children: _jsxs("div", { className: "council-inner-card-2", children: [_jsx("div", { className: "council-member-image", children: _jsx("img", { src: member.member_image ?? placeholderImg, alt: member.member_name, loading: "lazy", decoding: "async", width: 240, height: 240 }) }), _jsx("h1", { className: "council-member-name", children: member.member_name }), _jsx("p", { className: "council-member-role", children: member.role_name })] }) }) }, member.member_id))) })] }));
}
