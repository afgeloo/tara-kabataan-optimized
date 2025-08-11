import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./admin-sidebar";
import "./css/adminpage.css";
const AdminPage = () => {
    return (_jsxs("div", { className: "admin-container", children: [_jsx(AdminSidebar, {}), _jsx("main", { className: "admin-content", children: _jsx(Outlet, {}) })] }));
};
export default React.memo(AdminPage);
