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

const App: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Route-level gate intelligently checks assets once per session */}
      <PreloadGate onlyOnFirstLoad enabled>
        <Outlet />
      </PreloadGate>

      {!isAdmin && <GoToTop />}
    </>
  );
};

export default App;