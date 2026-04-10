import { jsx as _jsx } from "react/jsx-runtime";
// src/adminpage/requireauth.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
const RequireAuth = () => {
    // null means "checking...", true means "allowed", false means "kicked out"
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    useEffect(() => {
        const verifySession = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/check_session.php`, {
                    method: "GET",
                    credentials: "include", // THIS IS THE MAGIC WORD! It forces React to send the cookie.
                    cache: "no-store",
                    headers: {
                        "Accept": "application/json",
                    },
                });
                const data = await res.json();
                if (data.authenticated) {
                    setIsAuthenticated(true);
                    // Keep local storage synced just in case
                    localStorage.setItem("admin-auth", "true");
                }
                else {
                    setIsAuthenticated(false);
                    localStorage.removeItem("admin-auth");
                }
            }
            catch (err) {
                console.error("Session verification failed:", err);
                setIsAuthenticated(false);
                localStorage.removeItem("admin-auth");
            }
        };
        verifySession();
    }, []);
    // Show a blank screen (or you can add a spinner here) while it asks the server
    if (isAuthenticated === null) {
        return _jsx("div", { style: { height: "100vh", backgroundColor: "#fff" } });
    }
    // If the server said yes, show the page. If no, kick them to login.
    return isAuthenticated ? _jsx(Outlet, {}) : _jsx(Navigate, { to: "/admin-login", replace: true });
};
export default RequireAuth;
