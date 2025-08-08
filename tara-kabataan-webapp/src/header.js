import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./global-css/header.css";
import logo from "./assets/header/tarakabataanlogo2.png";
const navLinks = [
    { path: "/", label: "Home" },
    { path: "/About", label: "About" },
    { path: "/Contact", label: "Contact" },
    { path: "/Events", label: "Events" },
    { path: "/Blogs", label: "Blogs" },
];
const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) {
                setMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return (_jsxs("header", { className: "header", children: [_jsx(Link, { to: "/", children: _jsx("img", { src: logo, alt: "Tarakabataan Logo", className: "logo" }) }), _jsxs("div", { className: "burger", onClick: () => setMenuOpen(!menuOpen), children: [_jsx("div", { className: `bar ${menuOpen ? "open" : ""}` }), _jsx("div", { className: `bar ${menuOpen ? "open" : ""}` }), _jsx("div", { className: `bar ${menuOpen ? "open" : ""}` })] }), _jsxs("nav", { className: `nav-links ${menuOpen ? "active" : ""} ${isMobile ? "mobile" : "desktop"}`, children: [navLinks.map(({ path, label }) => (_jsx("li", { children: _jsx(Link, { to: path, className: "nav-button", onClick: () => setMenuOpen(false), children: label }) }, path))), _jsx("a", { href: "https://docs.google.com/forms/d/e/1FAIpQLSewrSWYnmn5lVqOTbSh9751x80e-IhIp_atvMFaDf3M0n6uVg/viewform", target: "_blank", rel: "noopener noreferrer", className: "nav-join", onClick: () => setMenuOpen(false), children: "Join Now" })] })] }));
};
export default Header;
