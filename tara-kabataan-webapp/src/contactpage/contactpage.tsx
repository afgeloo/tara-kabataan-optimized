// src/contactpage/contactpage.tsx

import React, { Suspense, lazy, memo } from "react";
import Header from "../header";
import Footer from "../footer"; // Added Footer for consistency!

// Lazy load the heavy components for an instant initial page paint
const EmailUs = lazy(() => import("./emailus"));
const GetInTouch = lazy(() => import("./getintouch"));

const ContactPage = memo(() => {
    return (
        <div className="contact-page">
            <Header />
            
            <Suspense fallback={<div style={{ minHeight: '80vh' }} />}>
                <EmailUs />
                <GetInTouch />
            </Suspense>

            <Footer />
        </div>
    );
});

export default ContactPage;