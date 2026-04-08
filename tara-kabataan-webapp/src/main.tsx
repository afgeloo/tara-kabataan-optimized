import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./global-css/index.css";

// Eager load the core app shell to prevent initialization flashes
import App from "./app";
import Preloader from "./preloader";

// Lazy load the heavy route components
const HomePage     = lazy(() => import("./homepage/homepage"));
const EventsPage   = lazy(() => import("./eventspage/eventspagehome"));
const EventDetails = lazy(() => import("./eventspage/eventpage-details"));
const AboutPage    = lazy(() => import("./aboutpage1/aboutpage"));
const ContactPage  = lazy(() => import("./contactpage/contactpage"));
const BlogsPage    = lazy(() => import("./blogspage/blogspage"));
const SingleBlog   = lazy(() => import("./blogspage/singleblog"));

const AdminLogin    = lazy(() => import("./adminpage/admin-login"));
const RequireAuth   = lazy(() => import("./adminpage/requireauth"));
const AdminPage     = lazy(() => import("./adminpage/adminpage"));
const AdminBlogs    = lazy(() => import("./adminpage/admin-blogs"));
const AdminEvents   = lazy(() => import("./adminpage/admin-events"));
const AdminSettings = lazy(() => import("./adminpage/admin-settings"));

// Keeps route transitions silent (no full-screen loader when clicking links)
const RouteFallback = () => null; 

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />, 
      children: [
        { index: true, element: <Suspense fallback={<RouteFallback />}><HomePage /></Suspense> },
        { path: "About", element: <Suspense fallback={<RouteFallback />}><AboutPage /></Suspense> },
        { path: "Contact", element: <Suspense fallback={<RouteFallback />}><ContactPage /></Suspense> },
        { path: "Events", element: <Suspense fallback={<RouteFallback />}><EventsPage /></Suspense> },
        { path: "Events/:id", element: <Suspense fallback={<RouteFallback />}><EventDetails /></Suspense> },
        { path: "Blogs", element: <Suspense fallback={<RouteFallback />}><BlogsPage /></Suspense> },
        { path: "Blog/:id", element: <Suspense fallback={<RouteFallback />}><SingleBlog /></Suspense> },
      ],
    },
    {
      path: "/Admin-login",
      element: (
        <Suspense fallback={<Preloader />}>
          <AdminLogin />
        </Suspense>
      ),
    },
    {
      path: "/Admin",
      element: (
        <Suspense fallback={<Preloader />}>
          <RequireAuth />
        </Suspense>
      ),
      children: [
        {
          path: "",
          element: <AdminPage />,
          children: [
            { path: "Blogs", element: <Suspense fallback={<RouteFallback />}><AdminBlogs /></Suspense> },
            { path: "Events", element: <Suspense fallback={<RouteFallback />}><AdminEvents /></Suspense> },
            { path: "Settings", element: <Suspense fallback={<RouteFallback />}><AdminSettings /></Suspense> },
            { index: true, element: <Navigate to="Blogs" replace /> },
          ],
        },
      ],
    },
  ],
  { basename: (import.meta as any).env?.BASE_URL || "/" }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);