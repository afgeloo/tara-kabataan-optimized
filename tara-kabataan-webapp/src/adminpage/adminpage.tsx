import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "./admin-sidebar";
import Preloader from "../preloader"; // Added your preloader
import "./css/adminpage.css";
import "./css/admin-blogs.css";
import "./css/admin-events.css";
import "./css/admin-settings.css";

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/check_session.php`,
          {
            method: "GET",
            credentials: "include", 
          }
        );

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
      } catch (err) {
        localStorage.removeItem("admin-auth");
        localStorage.removeItem("admin-user");
        setIsAuthenticated(false);
      }
    };

    verifySession();
  }, []);

  if (isAuthenticated === null) {
    // Replaced raw text with your beautiful preloader
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--app-bg, #fff)" }}>
        <Preloader />
      </div>
    ); 
  }

  if (isAuthenticated === false) {
    return <Navigate to="/admin-login" replace />; 
  }

  return (
    <div className="admin-container">
      <AdminSidebar />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default React.memo(AdminPage);