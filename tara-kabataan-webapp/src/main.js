import { jsx as _jsx } from "react/jsx-runtime";
// main.tsx
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./global-css/index.css";
const App = lazy(() => import("./app"));
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
// keep null here to avoid showing a loader during client-side code-split navigations
const Fallback = () => null;
const router = createBrowserRouter([
    {
        path: "/",
        element: (_jsx(Suspense, { fallback: _jsx(Fallback, {}), children: _jsx(App, {}) })),
        children: [
            { index: true, element: _jsx(HomePage, {}) },
            { path: "about", element: _jsx(AboutPage, {}) },
            { path: "contact", element: _jsx(ContactPage, {}) },
            { path: "events", element: _jsx(EventsPage, {}) },
            { path: "events/:id", element: _jsx(EventDetails, {}) },
            { path: "blogs", element: _jsx(BlogsPage, {}) },
            { path: "blog/:id", element: _jsx(SingleBlog, {}) },
        ],
    },
    {
        path: "/admin-login",
        element: (_jsx(Suspense, { fallback: _jsx(Fallback, {}), children: _jsx(AdminLogin, {}) })),
    },
    {
        path: "/admin",
        element: (_jsx(Suspense, { fallback: _jsx(Fallback, {}), children: _jsx(RequireAuth, {}) })),
        children: [
            {
                path: "",
                element: (_jsx(Suspense, { fallback: _jsx(Fallback, {}), children: _jsx(AdminPage, {}) })),
                children: [
                    { path: "blogs", element: _jsx(AdminBlogs, {}) },
                    { path: "events", element: _jsx(AdminEvents, {}) },
                    { path: "settings", element: _jsx(AdminSettings, {}) },
                    { index: true, element: _jsx(Navigate, { to: "blogs", replace: true }) },
                ],
            },
        ],
    },
], { basename: import.meta.env?.BASE_URL || "/" });
createRoot(document.getElementById("root")).render(_jsx(StrictMode, { children: _jsx(Suspense, { fallback: _jsx(Fallback, {}), children: _jsx(RouterProvider, { router: router }) }) }));
