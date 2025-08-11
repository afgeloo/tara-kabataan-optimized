import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo, useRef, memo } from "react";
import Marquee from "react-fast-marquee";
import "./css/partner-sec.css";
import { Link } from "react-router-dom";
import partnerLogo from "../assets/logos/tklogo1.png";
import memberLogo from "../assets/logos/tklogo2.png";
import tklogo from "../assets/logos/tklogo3.png";
import tkdonate from "../assets/homepage/qr-code.jpg";
import donateicon from "../assets/logos/donateicon.png";
const BASE = import.meta.env.VITE_API_BASE_URL;
const encodeFilename = (p) => {
    const parts = p.split(/[/\\]/);
    const filename = parts[parts.length - 1] || "";
    return encodeURIComponent(filename);
};
const toLogoUrl = (fullPath) => `${BASE}/tara-kabataan-optimized/tara-kabataan-webapp/uploads/partners-images/${encodeFilename(fullPath)}`;
const PartnerSec = memo(() => {
    const [showQR, setShowQR] = useState(false);
    const [partnerLogos, setPartnerLogos] = useState([]);
    const mounted = useRef(true);
    // Respect reduced motion (Marquee supports `play`)
    const prefersReducedMotion = typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    useEffect(() => {
        mounted.current = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const res = await fetch(`${BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/partners.php`, { signal: ctrl.signal });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const list = Array.isArray(data?.partners)
                    ? data.partners
                    : Array.isArray(data)
                        ? data
                        : [];
                const next = list
                    .map((p) => p?.partner_image?.trim() || "")
                    .filter(Boolean)
                    .map(toLogoUrl);
                // Avoid useless re-render if identical
                setPartnerLogos((prev) => {
                    if (prev.length === next.length && prev.every((v, i) => v === next[i]))
                        return prev;
                    return next;
                });
            }
            catch (err) {
                if (err?.name !== "AbortError")
                    console.error("Error fetching partner logos:", err);
            }
        })();
        return () => {
            mounted.current = false;
            ctrl.abort();
        };
    }, []);
    // Ensure continuous scroll even with few logos (dup once if < 6)
    const displayedLogos = useMemo(() => {
        if (partnerLogos.length === 0)
            return [];
        if (partnerLogos.length < 6)
            return [...partnerLogos, ...partnerLogos];
        return partnerLogos;
    }, [partnerLogos]);
    if (displayedLogos.length === 0) {
        // Nothing to show yet; keep DOM minimal
        return (_jsxs("div", { className: "partner-sec", children: [_jsx("h1", { className: "PastPartnership-Text", children: "PAST PARTNERSHIPS" }), _jsx("hr", { className: "Hr-under-pastpartnership" }), _jsxs("div", { className: "partner-member-container", children: [_jsxs("div", { className: "BePartnerMemberSection", children: [_jsx("h2", { className: "BePartnerMemberText", children: "BE A PARTNER" }), _jsxs("div", { className: "BePartnerMemberSection-box", children: [_jsx("div", { className: "circle-inside-be-a-partner-member", children: _jsx("img", { src: partnerLogo, alt: "Partner Logo", className: "circle-image partner-image" }) }), _jsx("p", { className: "text-inside-be-a-partner-member-container", children: "Partnering with Tara Kabataan means joining a dedicated movement focused on empowering the youth and fostering community development. Your collaboration will support initiatives that promote education, environmental stewardship, and active civic engagement among young individuals." }), _jsx(Link, { to: "/Contact", className: "button-inside-be-a-partner-member", children: "BECOME A PARTNER" })] })] }), _jsxs("div", { className: "BePartnerMemberSection", children: [_jsx("h2", { className: "BePartnerMemberText", children: "BE A MEMBER" }), _jsxs("div", { className: "BePartnerMemberSection-box", children: [_jsx("div", { className: "circle-inside-be-a-partner-member", children: _jsx("img", { src: memberLogo, alt: "Member Logo", className: "circle-image member-image" }) }), _jsx("p", { className: "text-inside-be-a-partner-member-container", children: "Joining Tara Kabataan as a member means becoming part of a passionate community of youth advocates and changemakers. You\u2019ll have opportunities to engage in meaningful volunteer work and develop your leadership and advocacy skills through community-based activities." }), _jsx("a", { href: "https://docs.google.com/forms/d/e/1FAIpQLSewrSWYnmn5lVqOTbSh9751x80e-IhIp_atvMFaDf3M0n6uVg/viewform", target: "_blank", rel: "noopener noreferrer", style: { textDecoration: "none" }, children: _jsx("button", { className: "button-inside-be-a-partner-member", children: "BECOME A MEMBER" }) })] })] })] }), _jsx("h2", { className: "support-tk-title", children: "SUPPORT TARA KABATAAN" }), _jsxs("div", { className: "support-tk-container", children: [_jsxs("div", { className: "support-tk-content-format", children: [_jsx("div", { className: "logo-inside-donate-now-placing", children: _jsx("img", { src: tklogo, className: "logo-inside-donate-now-sizing", alt: "Support Logo" }) }), _jsx("div", { className: "support-tk-text", children: _jsx("p", { children: "Your donation is more than just a contribution \u2014 it\u2019s a commitment to youth empowerment and inclusive nation-building. Every peso you give fuels Tara Kabataan\u2019s programs that uplift communities, advance human rights, and promote genuine civic engagement. Whether it\u2019s through in-kind support or financial assistance, your help goes directly to grassroots initiatives: from relief operations and educational drives to health missions and climate justice actions." }) })] }), _jsxs("button", { className: "donate-now-section", onClick: () => setShowQR(true), children: [_jsx("img", { src: donateicon, alt: "Donate Icon", className: "logo-inside-donate-now" }), _jsx("span", { className: "donate-now-text", children: "DONATE NOW" })] })] }), showQR && (_jsx("div", { className: "qr-popup-overlay", onClick: () => setShowQR(false), role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "qr-popup", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "close-qr-btn", onClick: () => setShowQR(false), "aria-label": "Close", children: "\u00D7" }), _jsx("p", { children: "Open GCash, Maya, or any app with a built-in QR scanner to scan:" }), _jsx("img", { src: tkdonate, alt: "QR Code", className: "qr-code-img", loading: "lazy", decoding: "async" }), _jsx("p", { children: "Or message us directly on Messenger:" }), _jsx("a", { href: "https://www.facebook.com/messages/t/105536985395406", target: "_blank", rel: "noopener noreferrer", className: "messenger-link", children: "Send a Message!" })] }) }))] }));
    }
    return (_jsxs("div", { className: "partner-sec", children: [_jsx("h1", { className: "PastPartnership-Text", children: "PAST PARTNERSHIPS" }), _jsx("br", {}), _jsx("div", { children: _jsx(Marquee, { speed: 60, pauseOnHover: true, loop: 0, gradient: false, play: !prefersReducedMotion, children: displayedLogos.map((logo, index) => (_jsx("div", { style: { padding: "0 20px" }, children: _jsx("img", { src: logo, className: "past-partnerships-logo", alt: `Partner ${index + 1}`, loading: "lazy", decoding: "async", draggable: false, onError: (e) => {
                                const img = e.currentTarget;
                                // Hide broken images without re-render
                                img.style.display = "none";
                            } }) }, `${logo}-${index}`))) }, `partner-marquee-${displayedLogos.length}`) }), _jsx("hr", { className: "Hr-under-pastpartnership" }), _jsxs("div", { className: "partner-member-container", children: [_jsxs("div", { className: "BePartnerMemberSection", children: [_jsx("h2", { className: "BePartnerMemberText", children: "BE A PARTNER" }), _jsxs("div", { className: "BePartnerMemberSection-box", children: [_jsx("div", { className: "circle-inside-be-a-partner-member", children: _jsx("img", { src: partnerLogo, alt: "Partner Logo", className: "circle-image partner-image" }) }), _jsx("p", { className: "text-inside-be-a-partner-member-container", children: "Partnering with Tara Kabataan means joining a dedicated movement focused on empowering the youth and fostering community development. Your collaboration will support initiatives that promote education, environmental stewardship, and active civic engagement among young individuals." }), _jsx(Link, { to: "/Contact", className: "button-inside-be-a-partner-member", children: "BECOME A PARTNER" })] })] }), _jsxs("div", { className: "BePartnerMemberSection", children: [_jsx("h2", { className: "BePartnerMemberText", children: "BE A MEMBER" }), _jsxs("div", { className: "BePartnerMemberSection-box", children: [_jsx("div", { className: "circle-inside-be-a-partner-member", children: _jsx("img", { src: memberLogo, alt: "Member Logo", className: "circle-image member-image" }) }), _jsx("p", { className: "text-inside-be-a-partner-member-container", children: "Joining Tara Kabataan as a member means becoming part of a passionate community of youth advocates and changemakers. You\u2019ll have opportunities to engage in meaningful volunteer work and develop your leadership and advocacy skills through community-based activities." }), _jsx("a", { href: "https://docs.google.com/forms/d/e/1FAIpQLSewrSWYnmn5lVqOTbSh9751x80e-IhIp_atvMFaDf3M0n6uVg/viewform", target: "_blank", rel: "noopener noreferrer", style: { textDecoration: "none" }, children: _jsx("button", { className: "button-inside-be-a-partner-member", children: "BECOME A MEMBER" }) })] })] })] }), _jsx("h2", { className: "support-tk-title", children: "SUPPORT TARA KABATAAN" }), _jsxs("div", { className: "support-tk-container", children: [_jsxs("div", { className: "support-tk-content-format", children: [_jsx("div", { className: "logo-inside-donate-now-placing", children: _jsx("img", { src: tklogo, className: "logo-inside-donate-now-sizing", alt: "Support Logo" }) }), _jsx("div", { className: "support-tk-text", children: _jsx("p", { children: "Your donation is more than just a contribution \u2014 it\u2019s a commitment to youth empowerment and inclusive nation-building. Every peso you give fuels Tara Kabataan\u2019s programs that uplift communities, advance human rights, and promote genuine civic engagement. Whether it\u2019s through in-kind support or financial assistance, your help goes directly to grassroots initiatives: from relief operations and educational drives to health missions and climate justice actions." }) })] }), _jsxs("button", { className: "donate-now-section", onClick: () => setShowQR(true), children: [_jsx("img", { src: donateicon, alt: "Donate Icon", className: "logo-inside-donate-now" }), _jsx("span", { className: "donate-now-text", children: "DONATE NOW" })] })] }), showQR && (_jsx("div", { className: "qr-popup-overlay", onClick: () => setShowQR(false), role: "dialog", "aria-modal": "true", children: _jsxs("div", { className: "qr-popup", onClick: (e) => e.stopPropagation(), children: [_jsx("button", { className: "close-qr-btn", onClick: () => setShowQR(false), "aria-label": "Close", children: "\u00D7" }), _jsx("p", { children: "Open GCash, Maya, or any app with a built-in QR scanner to scan:" }), _jsx("img", { src: tkdonate, alt: "QR Code", className: "qr-code-img", loading: "lazy", decoding: "async" }), _jsx("p", { children: "Or message us directly on Messenger:" }), _jsx("a", { href: "https://www.facebook.com/messages/t/105536985395406", target: "_blank", rel: "noopener noreferrer", className: "messenger-link", children: "Send a Message!" })] }) }))] }));
});
export default PartnerSec;
