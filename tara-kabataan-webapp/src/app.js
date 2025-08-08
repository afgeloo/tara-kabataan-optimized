import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// app.tsx
import { useState, useEffect, useMemo } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Preloader from "./preloader";
import Chatbot from "./chatbot";
import GoToTop from "./gototop";
import PreloadGate from "./preload-gate";
const MIN_LOAD_TIME = 3000; // boot-only
const App = () => {
    const [bootLoading, setBootLoading] = useState(true);
    const location = useLocation();
    const navType = useMemo(() => {
        const entries = performance.getEntriesByType("navigation");
        if (entries.length)
            return entries[0].type;
        const legacy = performance.navigation?.type;
        if (legacy === 1)
            return "reload";
        return "navigate";
    }, []);
    // Boot-only page load (hard refresh) preloader
    useEffect(() => {
        if (navType === "reload" || navType === "navigate") {
            const start = performance.now();
            const finish = () => {
                const elapsed = performance.now() - start;
                const delay = Math.max(0, MIN_LOAD_TIME - elapsed);
                setTimeout(() => setBootLoading(false), delay);
            };
            if (document.readyState === "complete")
                finish();
            else {
                window.addEventListener("load", finish, { once: true });
                return () => window.removeEventListener("load", finish);
            }
        }
        else {
            setBootLoading(false);
        }
    }, [navType]);
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [location.pathname]);
    if (bootLoading)
        return _jsx(Preloader, {});
    const isAdmin = location.pathname.startsWith("/admin");
    return (_jsxs(_Fragment, { children: [_jsx(PreloadGate, { onlyOnFirstLoad: true, enabled: true, children: _jsx(Outlet, {}) }), !isAdmin && (_jsxs(_Fragment, { children: [_jsx(Chatbot, {}), _jsx(GoToTop, {})] }))] }));
};
export default App;
