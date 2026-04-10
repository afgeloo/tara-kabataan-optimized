import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/contactpage/getintouch.tsx
import "./css/getintouch.css";
import { useEffect, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import telephoneImg from "../assets/contactpage/telephone.png";
import emailImg from "../assets/contactpage/email.png";
import facebookImg from "../assets/contactpage/facebook.png";
import instagramImg from "../assets/contactpage/instagram.png";
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
// --- ZERO LATENCY CACHE ---
export let _globalAboutCache = null;
export let _globalAboutCacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const GetInTouch = memo(() => {
    const navigate = useNavigate();
    // Initialize state IMMEDIATELY if the cache exists (Zero Latency)
    const [contactData, setContactData] = useState({
        contactNo: _globalAboutCache?.contact_no || "Loading...",
        email: _globalAboutCache?.about_email || "Loading...",
        address: _globalAboutCache?.address || "Manila, Philippines",
        instagramLink: _globalAboutCache?.instagram || "https://www.instagram.com/tarakabataan",
        facebookLink: _globalAboutCache?.facebook || "https://www.facebook.com/TaraKabataanMNL",
    });
    useEffect(() => {
        const now = Date.now();
        // If cache is hot, skip the network request entirely!
        if (_globalAboutCache && now - _globalAboutCacheAt < CACHE_TTL) {
            return;
        }
        let mounted = true;
        fetch(`${API_BASE}/aboutus.php`)
            .then((res) => res.json())
            .then((data) => {
            if (!mounted)
                return;
            // Update the cache for the rest of the site
            _globalAboutCache = data;
            _globalAboutCacheAt = Date.now();
            setContactData({
                contactNo: data.contact_no || "Unavailable",
                email: data.about_email || "Unavailable",
                address: data.address || "Manila, Philippines",
                instagramLink: data.instagram || "https://www.instagram.com/tarakabataan",
                facebookLink: data.facebook || "https://www.facebook.com/TaraKabataanMNL",
            });
        })
            .catch((err) => {
            console.error("Error fetching contact info:", err);
            if (!mounted)
                return;
            setContactData((prev) => ({
                ...prev,
                contactNo: "Unavailable",
                email: "Unavailable",
            }));
        });
        return () => { mounted = false; };
    }, []);
    return (_jsxs("div", { className: "getintouch-sec", children: [_jsxs("div", { className: "getintouch-content", children: [_jsx("h1", { className: "getintouch-header", children: "Get in Touch" }), _jsx("p", { className: "getintouch-description", children: "Reach out to us through any of our contact points below. We're here to listen and connect with you!" })] }), _jsxs("div", { className: "getintouch-sub-sec", children: [_jsxs("div", { className: "getintouch-left", children: [_jsxs("div", { className: "contact-telephone", children: [_jsx("a", { href: `tel:${contactData.contactNo}`, target: "_blank", rel: "noopener noreferrer", children: _jsx("div", { className: "contact-telephone-icon", children: _jsx("img", { src: telephoneImg, alt: "Telephone Icon", draggable: "false" }) }) }), _jsxs("div", { className: "contact-telephone-details", children: [_jsx("h1", { className: "contact-telephone-header", children: "Telephone" }), _jsx("p", { className: "contact-telephone-no", children: contactData.contactNo })] })] }), _jsxs("div", { className: "contact-email", children: [_jsx("div", { onClick: () => navigate("/contact"), style: { cursor: "pointer" }, children: _jsx("div", { className: "contact-email-icon", children: _jsx("img", { src: emailImg, alt: "Email Icon", draggable: "false" }) }) }), _jsxs("div", { onClick: () => navigate("/contact"), style: { cursor: "pointer" }, className: "contact-email-details", children: [_jsx("h1", { className: "contact-email-header", children: "Email" }), _jsx("p", { className: "contact-email", children: contactData.email })] })] })] }), _jsxs("div", { className: "getintouch-right", children: [_jsxs("div", { className: "contact-telephone", children: [_jsx("a", { href: contactData.facebookLink, target: "_blank", rel: "noopener noreferrer", children: _jsx("div", { className: "contact-telephone-icon", children: _jsx("img", { src: facebookImg, alt: "Facebook Icon", draggable: "false" }) }) }), _jsxs("div", { className: "contact-telephone-details", children: [_jsx("h1", { className: "contact-telephone-header", children: "Facebook" }), _jsx("p", { className: "contact-telephone-no", children: "Tara Kabataan" })] })] }), _jsxs("div", { className: "contact-email", children: [_jsx("a", { href: contactData.instagramLink, target: "_blank", rel: "noopener noreferrer", children: _jsx("div", { className: "contact-email-icon", children: _jsx("img", { src: instagramImg, alt: "Instagram Icon", draggable: "false" }) }) }), _jsxs("div", { className: "contact-email-details", children: [_jsx("h1", { className: "contact-email-header", children: "Instagram" }), _jsx("p", { className: "contact-email", children: "@tarakabataan" })] })] })] })] })] }));
});
export default GetInTouch;
