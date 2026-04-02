import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { FaBars, FaRegNewspaper, FaCalendarAlt, FaCog, FaSignOutAlt, } from "react-icons/fa";
import "./css/admin-sidebar.css";
import logo from "../assets/header/tarakabataanlogo2.png";
const AdminSidebar = React.memo(() => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const isEventsPage = location.pathname.includes("events");
    const toggleSidebar = useCallback(() => setIsOpen((open) => !open), []);
    const handleLogout = useCallback((e) => {
        e.preventDefault();
        localStorage.removeItem("admin-auth");
        setIsOpen(false);
        window.location.href = "/admin-login";
    }, []);
    const navLinks = [
        { to: "blogs", icon: _jsx(FaRegNewspaper, { className: "admin-icon" }), label: "Blogs" },
        {
            to: "events",
            icon: _jsx(FaCalendarAlt, { className: "admin-icon" }),
            label: "Events",
            activeClass: "events-active",
        },
        { to: "settings", icon: _jsx(FaCog, { className: "admin-icon" }), label: "Settings" },
    ];
    return (_jsxs(_Fragment, { children: [_jsx("button", { "aria-label": "Toggle sidebar", className: "admin-sidebar-toggle", onClick: toggleSidebar, children: _jsx(FaBars, {}) }), _jsxs("nav", { className: `admin-sidebar ${isOpen ? "open" : ""} ${isEventsPage ? "events-page" : ""}`, "aria-expanded": isOpen, children: [_jsx("header", { className: "admin-sidebar-header", children: _jsx(Link, { to: "/", "aria-label": "Home", children: _jsx("img", { src: logo, alt: "Tarakabataan Logo", className: "admin-logo" }) }) }), navLinks.map(({ to, icon, label, activeClass }) => (_jsxs(NavLink, { to: to, className: ({ isActive }) => `admin-link ${isActive ? `active ${activeClass || ""}` : ""}`.trim(), onClick: () => setIsOpen(false), children: [icon, label] }, to))), _jsxs("a", { href: "#", className: "admin-logout-link", onClick: handleLogout, children: [_jsx(FaSignOutAlt, { className: "admin-logout-icon" }), "Logout"] })] }), isOpen && (_jsx("div", { className: "admin-sidebar-backdrop", onClick: () => setIsOpen(false), "aria-hidden": "true" }))] }));
});
export default AdminSidebar;
