import React, { useState, useCallback } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  FaBars,
  FaRegNewspaper,
  FaCalendarAlt,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import "./css/admin-sidebar.css";
import logo from "../assets/header/tarakabataanlogo2.png";

const AdminSidebar: React.FC = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isEventsPage = location.pathname.includes("events");

  const toggleSidebar = useCallback(() => setIsOpen((open) => !open), []);

  const handleLogout = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      localStorage.removeItem("admin-auth");
      setIsOpen(false);
      window.location.href = "/admin-login";
    },
    []
  );

  const navLinks = [
    { to: "blogs", icon: <FaRegNewspaper className="admin-icon" />, label: "Blogs" },
    {
      to: "events",
      icon: <FaCalendarAlt className="admin-icon" />,
      label: "Events",
      activeClass: "events-active",
    },
    { to: "settings", icon: <FaCog className="admin-icon" />, label: "Settings" },
  ];

  return (
    <>
      <button
        aria-label="Toggle sidebar"
        className="admin-sidebar-toggle"
        onClick={toggleSidebar}
      >
        <FaBars />
      </button>

      <nav
        className={`admin-sidebar ${isOpen ? "open" : ""} ${
          isEventsPage ? "events-page" : ""
        }`}
        aria-expanded={isOpen}
      >
        <header className="admin-sidebar-header">
          <Link to="/" aria-label="Home">
            <img src={logo} alt="Tarakabataan Logo" className="admin-logo" />
          </Link>
        </header>

        {navLinks.map(({ to, icon, label, activeClass }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `admin-link ${isActive ? `active ${activeClass || ""}` : ""}`.trim()
            }
            onClick={() => setIsOpen(false)}
          >
            {icon}
            {label}
          </NavLink>
        ))}

        <a href="#" className="admin-logout-link" onClick={handleLogout}>
          <FaSignOutAlt className="admin-logout-icon" />
          Logout
        </a>
      </nav>

      {isOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
});

export default AdminSidebar;
