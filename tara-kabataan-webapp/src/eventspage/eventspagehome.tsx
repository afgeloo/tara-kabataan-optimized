import { memo, Suspense, lazy } from "react";
import Footer from "../footer";
import Header from "../header";
import EventsPageRSVP from "./eventspage-rsvp";

// Optional: lazy load RSVP if heavy
// const EventsPageRSVP = lazy(() => import("./eventspage-rsvp"));

const Eventspage = () => {
  return (
    <>
      <Header />
      {/* If you lazy load, wrap in Suspense */}
      {/* <Suspense fallback={<div>Loading events...</div>}> */}
        <EventsPageRSVP />
      {/* </Suspense> */}
      <Footer />
    </>
  );
};

// Memoize so it doesn't re-render unless props change
export default memo(Eventspage);
