import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "./admin-sidebar";
import "./css/adminpage.css";
import "./css/admin-blogs.css";
import "./css/admin-events.css";
import "./css/admin-settings.css";

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/tara-kabataan-optimized/tara-kabataan-backend/api/check_session.php`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Session-Token": token, // SEND THE VIP PASS TO PHP!
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
            return;
          }
        }
        setIsAuthenticated(false);
      } catch (err) {
        setIsAuthenticated(false);
      }
    };

    verifySession();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Loading securely...
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