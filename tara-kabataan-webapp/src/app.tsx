// app.tsx
import { useState, useEffect, useMemo } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Preloader from "./preloader";
import Chatbot from "./chatbot";
import GoToTop from "./gototop";
import PreloadGate from "./preload-gate";

const MIN_LOAD_TIME = 3000; // boot-only

const App: React.FC = () => {
  const [bootLoading, setBootLoading] = useState(true);
  const location = useLocation();

  const navType = useMemo(() => {
    const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entries.length) return entries[0].type;
    const legacy = (performance as any).navigation?.type;
    if (legacy === 1) return "reload";
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
      if (document.readyState === "complete") finish();
      else {
        window.addEventListener("load", finish, { once: true });
        return () => window.removeEventListener("load", finish);
      }
    } else {
      setBootLoading(false);
    }
  }, [navType]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  if (bootLoading) return <Preloader />;

  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Route-level gate runs once per tab (then skips) */}
      <PreloadGate onlyOnFirstLoad enabled>
        <Outlet />
      </PreloadGate>

      {!isAdmin && (
        <>
          <Chatbot />
          <GoToTop />
        </>
      )}
    </>
  );
};

export default App;
