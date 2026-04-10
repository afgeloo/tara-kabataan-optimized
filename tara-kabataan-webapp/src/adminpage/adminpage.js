import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "./admin-sidebar";
import Preloader from "../preloader"; // Added your preloader
import "./css/adminpage.css";
import "./css/admin-blogs.css";
import "./css/admin-events.css";
import "./css/admin-settings.css";
const AdminPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    useEffect(() => {
        const verifySession = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/check_session.php`, {
                    method: "GET",
                    credentials: "include",
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.authenticated) {
                        setIsAuthenticated(true);
                        return;
                    }
                }
                localStorage.removeItem("admin-auth");
                localStorage.removeItem("admin-user");
                setIsAuthenticated(false);
            }
            catch (err) {
                localStorage.removeItem("admin-auth");
                localStorage.removeItem("admin-user");
                setIsAuthenticated(false);
            }
        };
        verifySession();
    }, []);
    if (isAuthenticated === null) {
        // Replaced raw text with your beautiful preloader
        return (_jsx("div", { style: { position: "fixed", inset: 0, zIndex: 9999, background: "var(--app-bg, #fff)" }, children: _jsx(Preloader, {}) }));
    }
    if (isAuthenticated === false) {
        return _jsx(Navigate, { to: "/admin-login", replace: true });
    }
    return (_jsxs("div", { className: "admin-container", children: [_jsx(AdminSidebar, {}), _jsx("main", { className: "admin-content", children: _jsx(Outlet, {}) })] }));
};
export default React.memo(AdminPage);
