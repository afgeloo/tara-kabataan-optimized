import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./global-css/index.css";
// Eager load the core app shell to prevent initialization flashes
import App from "./app";
import Preloader from "./preloader";
// Lazy load the heavy route components
const HomePage = lazy(() => import("./homepage/homepage"));
const EventsPage = lazy(() => import("./eventspage/eventspagehome"));
const EventDetails = lazy(() => import("./eventspage/eventpage-details"));
const AboutPage = lazy(() => import("./aboutpage1/aboutpage"));
const ContactPage = lazy(() => import("./contactpage/contactpage"));
const BlogsPage = lazy(() => import("./blogspage/blogspage"));
const SingleBlog = lazy(() => import("./blogspage/singleblog"));
const AdminLogin = lazy(() => import("./adminpage/admin-login"));
const RequireAuth = lazy(() => import("./adminpage/requireauth"));
const AdminPage = lazy(() => import("./adminpage/adminpage"));
const AdminBlogs = lazy(() => import("./adminpage/admin-blogs"));
const AdminEvents = lazy(() => import("./adminpage/admin-events"));
const AdminSettings = lazy(() => import("./adminpage/admin-settings"));
// Keeps route transitions silent (no full-screen loader when clicking links)
const RouteFallback = () => null;
const router = createBrowserRouter([
    {
        path: "/",
        element: _jsx(App, {}),
        children: [
            { index: true, element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(HomePage, {}) }) },
            { path: "About", element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(AboutPage, {}) }) },
            { path: "Contact", element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(ContactPage, {}) }) },
            { path: "Events", element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(EventsPage, {}) }) },
            { path: "Events/:id", element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(EventDetails, {}) }) },
            { path: "Blogs", element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(BlogsPage, {}) }) },
            { path: "Blog/:id", element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(SingleBlog, {}) }) },
        ],
    },
    {
        path: "/Admin-login",
        element: (_jsx(Suspense, { fallback: _jsx(Preloader, {}), children: _jsx(AdminLogin, {}) })),
    },
    {
        path: "/Admin",
        element: (_jsx(Suspense, { fallback: _jsx(Preloader, {}), children: _jsx(RequireAuth, {}) })),
        children: [
            {
                path: "",
                element: _jsx(AdminPage, {}),
                children: [
                    { path: "Blogs", element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(AdminBlogs, {}) }) },
                    { path: "Events", element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(AdminEvents, {}) }) },
                    { path: "Settings", element: _jsx(Suspense, { fallback: _jsx(RouteFallback, {}), children: _jsx(AdminSettings, {}) }) },
                    { index: true, element: _jsx(Navigate, { to: "Blogs", replace: true }) },
                ],
            },
        ],
    },
], { basename: import.meta.env?.BASE_URL || "/" });
createRoot(document.getElementById("root")).render(_jsx(StrictMode, { children: _jsx(RouterProvider, { router: router }) }));
