// src/eventspage/eventspagehome.tsx
import { memo, Suspense, lazy } from "react";
import Footer from "../footer";
import Header from "../header";
import PreloaderEvents from "./loader-events";

// Lazy load the heavy RSVP logic to speed up initial site load
const EventsPageRSVP = lazy(() => import("./eventspage-rsvp"));

const Eventspage = memo(() => {
  return (
    <>
      <Header />
      {/* Show the smooth preloader while the heavy component streams in */}
      <Suspense fallback={<PreloaderEvents />}>
        <EventsPageRSVP />
      </Suspense>
      <Footer />
    </>
  );
});

export default Eventspage;