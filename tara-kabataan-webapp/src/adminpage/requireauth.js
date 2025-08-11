import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet } from "react-router-dom";
const RequireAuth = () => {
    const isAuthenticated = localStorage.getItem("admin-auth") === "true";
    return isAuthenticated ? _jsx(Outlet, {}) : _jsx(Navigate, { to: "/admin-login", replace: true });
};
export default RequireAuth;
