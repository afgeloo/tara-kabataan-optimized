import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState, memo } from "react";
import "./global-css/footer.css";
import "./global-css/header.css";
import logo from "./assets/header/tarakabataanlogo2.png";
import topCloud from "./assets/homepage/top-cloud.png";
import facebookIcon from "./assets/footer/facebook.png";
import instagramIcon from "./assets/footer/instagram.png";
import { IonIcon } from "@ionic/react";
import { callOutline, mailOutline } from "ionicons/icons";
const BASE = import.meta.env.VITE_API_BASE_URL;
const Footer = memo(() => {
    const [info, setInfo] = useState({
        contact: "Loading...",
        email: "Loading...",
    });
    const mounted = useRef(true);
    // stable fallbacks (no new strings every render)
    const unavailable = useMemo(() => ({ contact: "Unavailable", email: "Unavailable" }), []);
    useEffect(() => {
        mounted.current = true;
        const ctrl = new AbortController();
        (async () => {
            try {
                const res = await fetch(`${BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`, { signal: ctrl.signal });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const contact = typeof data?.contact_no === "string" && data.contact_no.trim()
                    ? data.contact_no
                    : unavailable.contact;
                const email = typeof data?.about_email === "string" && data.about_email.trim()
                    ? data.about_email
                    : unavailable.email;
                // avoid pointless re-render if unchanged
                setInfo((prev) => (prev.contact === contact && prev.email === email ? prev : { contact, email }));
            }
            catch (err) {
                if (err?.name !== "AbortError") {
                    console.error("Error fetching footer data:", err);
                    setInfo(unavailable);
                }
            }
        })();
        return () => {
            mounted.current = false;
            ctrl.abort();
        };
    }, [unavailable]);
    return (_jsxs("div", { className: "footer-sec", children: [_jsx("img", { src: topCloud, className: "footer-top-cloud", alt: "Top Cloud", draggable: "false", loading: "lazy", decoding: "async" }), _jsx("div", { className: "footer-section-main", children: _jsxs("div", { className: "footer-content", children: [_jsxs("div", { className: "footer-left-content", children: [_jsx("img", { src: logo, alt: "Tarakabataan Logo", className: "footer-tk-logo", draggable: "false", loading: "lazy", decoding: "async" }), _jsxs("div", { className: "footer-number", children: [_jsx("div", { className: "footer-icon-circle", children: _jsx(IonIcon, { icon: callOutline }) }), _jsx("p", { children: info.contact })] }), _jsxs("div", { className: "footer-email", children: [_jsx("div", { className: "footer-icon-circle", children: _jsx(IonIcon, { icon: mailOutline }) }), _jsx("p", { children: info.email })] })] }), _jsxs("div", { className: "footer-mid-content", children: [_jsx("h2", { children: "About Us" }), _jsx("p", { children: "Ang Tara Kabataan (TK) ay isang organisasyon ng mga kabataan sa Maynila na itinatag para isulong ang kaginhawaan ng bawat kabataan at Manilenyo." })] }), _jsxs("div", { className: "footer-right-content", children: [_jsx("h2", { children: "Social Media" }), _jsxs("a", { href: "https://www.facebook.com/TaraKabataanMNL", target: "_blank", rel: "noopener noreferrer", className: "footer-facebook", children: [_jsx("img", { src: facebookIcon, alt: "Facebook", draggable: "false", loading: "lazy", decoding: "async" }), _jsx("p", { children: "Tara Kabataan" })] }), _jsxs("a", { href: "https://www.instagram.com/tarakabataan", target: "_blank", rel: "noopener noreferrer", className: "footer-instagram", children: [_jsx("img", { src: instagramIcon, alt: "Instagram", draggable: "false", loading: "lazy", decoding: "async" }), _jsx("p", { children: "@tarakabataan" })] })] })] }) })] }));
});
export default Footer;
