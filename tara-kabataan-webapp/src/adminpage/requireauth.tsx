import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const RequireAuth: React.FC = () => {
  const isAuthenticated = localStorage.getItem("admin-auth") === "true";
  return isAuthenticated ? <Outlet /> : <Navigate to="/admin-login" replace />;
};

export default RequireAuth;
