// main.tsx
import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./global-css/index.css";

const App          = lazy(() => import("./app"));
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

// keep null here to avoid showing a loader during client-side code-split navigations
const Fallback = () => null;

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <Suspense fallback={<Fallback />}>
          <App />
        </Suspense>
      ),
      children: [
        { index: true, element: <HomePage /> },
        { path: "about", element: <AboutPage /> },
        { path: "contact", element: <ContactPage /> },
        { path: "events", element: <EventsPage /> },
        { path: "events/:id", element: <EventDetails /> },
        { path: "blogs", element: <BlogsPage /> },
        { path: "blog/:id", element: <SingleBlog /> },
      ],
    },
    {
      path: "/admin-login",
      element: (
        <Suspense fallback={<Fallback />}>
          <AdminLogin />
        </Suspense>
      ),
    },
    {
      path: "/admin",
      element: (
        <Suspense fallback={<Fallback />}>
          <RequireAuth />
        </Suspense>
      ),
      children: [
        {
          path: "",
          element: (
            <Suspense fallback={<Fallback />}>
              <AdminPage />
            </Suspense>
          ),
          children: [
            { path: "blogs", element: <AdminBlogs /> },
            { path: "events", element: <AdminEvents /> },
            { path: "settings", element: <AdminSettings /> },
            { index: true, element: <Navigate to="blogs" replace /> },
          ],
        },
      ],
    },
  ],
  { basename: (import.meta as any).env?.BASE_URL || "/" }
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense fallback={<Fallback />}>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>
);
