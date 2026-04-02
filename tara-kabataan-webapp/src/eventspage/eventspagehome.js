import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import Footer from "../footer";
import Header from "../header";
import EventsPageRSVP from "./eventspage-rsvp";
// Optional: lazy load RSVP if heavy
// const EventsPageRSVP = lazy(() => import("./eventspage-rsvp"));
const Eventspage = () => {
    return (_jsxs(_Fragment, { children: [_jsx(Header, {}), _jsx(EventsPageRSVP, {}), _jsx(Footer, {})] }));
};
// Memoize so it doesn't re-render unless props change
export default memo(Eventspage);
