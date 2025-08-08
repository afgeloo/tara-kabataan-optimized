import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./admin-sidebar";
import "./css/adminpage.css";

const AdminPage: React.FC = () => {
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
