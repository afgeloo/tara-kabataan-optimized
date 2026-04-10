import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useLocation, Outlet } from "react-router-dom";
import GoToTop from "./gototop";
import PreloadGate from "./preload-gate";
import "./adminpage/css/admin-blogs.css";
import "./adminpage/css/admin-events.css";
import "./adminpage/css/admin-sidebar.css";
import "./adminpage/css/adminpage.css";
import "./adminpage/css/richtexteditor.css";
import "./adminpage/css/admin-settings.css";
const App = () => {
    const location = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [location.pathname]);
    const isAdmin = location.pathname.startsWith("/admin");
    return (_jsxs(_Fragment, { children: [_jsx(PreloadGate, { onlyOnFirstLoad: true, enabled: true, children: _jsx(Outlet, {}) }), !isAdmin && _jsx(GoToTop, {})] }));
};
export default App;
