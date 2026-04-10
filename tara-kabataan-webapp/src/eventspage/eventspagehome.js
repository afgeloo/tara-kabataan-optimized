import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// src/eventspage/eventspagehome.tsx
import { memo, Suspense, lazy } from "react";
import Footer from "../footer";
import Header from "../header";
import PreloaderEvents from "./loader-events";
// Lazy load the heavy RSVP logic to speed up initial site load
const EventsPageRSVP = lazy(() => import("./eventspage-rsvp"));
const Eventspage = memo(() => {
    return (_jsxs(_Fragment, { children: [_jsx(Header, {}), _jsx(Suspense, { fallback: _jsx(PreloaderEvents, {}), children: _jsx(EventsPageRSVP, {}) }), _jsx(Footer, {})] }));
});
export default Eventspage;
