import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/contactpage/contactpage.tsx
import { Suspense, lazy, memo } from "react";
import Header from "../header";
import Footer from "../footer"; // Added Footer for consistency!
// Lazy load the heavy components for an instant initial page paint
const EmailUs = lazy(() => import("./emailus"));
const GetInTouch = lazy(() => import("./getintouch"));
const ContactPage = memo(() => {
    return (_jsxs("div", { className: "contact-page", children: [_jsx(Header, {}), _jsxs(Suspense, { fallback: _jsx("div", { style: { minHeight: '80vh' } }), children: [_jsx(EmailUs, {}), _jsx(GetInTouch, {})] }), _jsx(Footer, {})] }));
});
export default ContactPage;
