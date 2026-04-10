import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/Council.tsx
import { useEffect, useMemo, useState, memo } from "react";
import "./css/council.css";
import placeholderImg from "../assets/aboutpage/img-placeholder-guy.png";
import ribbon from "../assets/aboutpage/council-ribbon.png";
/* ---------- Constants ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp-v2.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
const BLACKLISTED_ROLES = ["Kalusugan", "Kalikasan", "Karunungan", "Kultura", "Kasarian"];
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
/* ---------- Robust S3 Image Resolver ---------- */
const resolveImage = (raw) => {
    if (!raw || !raw.trim())
        return placeholderImg;
    if (/^https?:\/\//i.test(raw) || raw.startsWith("//"))
        return raw;
    const [path, query] = raw.split("?");
    let cleanPath = path.startsWith("/") ? path.substring(1) : path;
    // Strip out redundant folders
    cleanPath = cleanPath
        .replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "")
        .replace("tara-kabataan-webapp/uploads/", "")
        .replace("members-images/members-images/", "members-images/"); // Fix double folder
    if (!cleanPath.includes("/"))
        cleanPath = `members-images/${cleanPath}`;
    let full = `${IMAGE_BASE}/${cleanPath}`;
    if (query)
        full += `?${query}`;
    return full;
};
/* ---------- Component ---------- */
const Council = memo(() => {
    // 1. INSTANT RENDER: Grab data from disk on mount
    const [councilData, setCouncilData] = useState(() => {
        try {
            const cached = localStorage.getItem("tk_council_list");
            return cached ? JSON.parse(cached) : [];
        }
        catch {
            return [];
        }
    });
    const [councilText, setCouncilText] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("tk_council_desc") || '"Loading..."');
        }
        catch {
            return "Loading...";
        }
    });
    // 2. BACKGROUND SYNC (Only if Cache is Expired)
    useEffect(() => {
        const lastFetch = Number(localStorage.getItem("tk_council_time") || 0);
        const now = Date.now();
        const ctrl = new AbortController();
        const aboutUrl = `${API_BASE}/aboutus.php`;
        const councilUrl = `${API_BASE}/council.php`;
        Promise.all([
            fetch(aboutUrl, { signal: ctrl.signal }).then((r) => r.json()),
            fetch(councilUrl, { signal: ctrl.signal }).then((r) => r.json()),
        ])
            .then(([about, council]) => {
            const text = about?.council?.trim() || "No data.";
            const blacklist = new Set(BLACKLISTED_ROLES.map((s) => s.toLowerCase()));
            const normalized = Array.isArray(council)
                ? council
                    .map((m) => ({ ...m, member_image: resolveImage(m.member_image) }))
                    .filter((m) => !blacklist.has(m.role_name.toLowerCase()))
                : [];
            setCouncilText(text);
            setCouncilData(normalized);
            // Save everything to disk AND log the exact time we fetched it
            localStorage.setItem("tk_council_list", JSON.stringify(normalized));
            localStorage.setItem("tk_council_desc", JSON.stringify(text));
            localStorage.setItem("tk_council_time", String(Date.now()));
        })
            .catch((err) => {
            if (err?.name !== "AbortError")
                console.error("Council fetch error:", err);
        });
        return () => ctrl.abort();
    }, [councilData.length]);
    // 3. IDENTIFY LEADERS
    const { president, others } = useMemo(() => {
        const prez = councilData.find((m) => m.role_name.toLowerCase() === "president");
        const rest = councilData.filter((m) => m !== prez);
        return { president: prez, others: rest };
    }, [councilData]);
    return (_jsxs("div", { className: "council-sec", children: [_jsx("div", { className: "council-ribbon", children: _jsx("img", { src: ribbon, alt: "ribbon", loading: "lazy", decoding: "async" }) }), _jsxs("div", { className: "council-sec-content", children: [_jsx("h1", { className: "council-header", children: "Council" }), _jsx("p", { className: "council-description", dangerouslySetInnerHTML: { __html: councilText.replace(/\n/g, "<br />") } })] }), president && (_jsx("div", { className: "council-president-grid", children: _jsx("div", { className: "council-card council-card-main", children: _jsx("div", { className: "council-inner-card-1-president", children: _jsxs("div", { className: "council-inner-card-2", children: [_jsx("div", { className: "council-member-image", children: _jsx("img", { src: president.member_image ?? placeholderImg, alt: president.member_name, loading: "lazy", decoding: "async", width: 320, height: 320 }) }), _jsx("h1", { className: "council-member-name", children: president.member_name }), _jsx("p", { className: "council-member-role", children: president.role_name })] }) }) }) })), _jsx("div", { className: "council-grid", children: others.map((member) => (_jsx("div", { className: "council-card", children: _jsx("div", { className: "council-inner-card-1-members", children: _jsxs("div", { className: "council-inner-card-2", children: [_jsx("div", { className: "council-member-image", children: _jsx("img", { src: member.member_image ?? placeholderImg, alt: member.member_name, loading: "lazy", decoding: "async", width: 240, height: 240 }) }), _jsx("h1", { className: "council-member-name", children: member.member_name }), _jsx("p", { className: "council-member-role", children: member.role_name })] }) }) }, member.member_id))) })] }));
});
export default Council;
