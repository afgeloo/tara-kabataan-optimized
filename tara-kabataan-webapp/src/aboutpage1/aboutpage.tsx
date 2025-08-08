// src/components/about/AboutPage.tsx (or wherever this file lives)
import React, { lazy, memo, Suspense, useEffect } from "react";
import Header from "../footer/../header"; // keep Header immediate for fast paint
import Footer from "../footer";

// Lazy chunks (same default exports you already have)
const BriefBg = lazy(() => import("./briefbg-sec"));
const VideoSec = lazy(() => import("./video-sec"));
const CoreValue = lazy(() => import("./coreval-sec"));
const MissionVision = lazy(() => import("./missionvision"));
const Council = lazy(() => import("./council"));
const AboutAdvocacies = lazy(() => import("./advocacies-sec"));

/** Mounts children only when near/in viewport (no CSS class changes needed). */
function InViewMount({
  children,
  rootMargin = "200px",
  minHeight = 200,
}: {
  children: React.ReactNode;
  rootMargin?: string;
  minHeight?: number;
}) {
  const [show, setShow] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (show) return; // already mounted
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShow(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [show, rootMargin]);

  return (
    <div ref={ref} style={!show ? { minHeight } : undefined}>
      {show ? children : null}
    </div>
  );
}

/** Light skeleton to hold space while a chunk streams in */
function Skeleton({ h = 300 }: { h?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: h,
        background:
          "linear-gradient(90deg, #f2f2f2 25%, #e9e9e9 37%, #f2f2f2 63%)",
        backgroundSize: "400% 100%",
        animation: "shimmer 1.2s ease-in-out infinite",
        borderRadius: 8,
      }}
    />
  );
}

/* Add a keyframes rule globally once (optional). If you already have one, remove this. */
const style = document.createElement("style");
style.innerHTML = `
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;
if (typeof document !== "undefined" && !document.getElementById("shimmer-keyframes")) {
  style.id = "shimmer-keyframes";
  document.head.appendChild(style);
}

const AboutPage: React.FC = memo(() => {
  // Idle prefetch of below-the-fold chunks so they load instantly when scrolled
  useEffect(() => {
    const warm = () => {
      import("./video-sec");
      import("./coreval-sec");
      import("./missionvision");
      import("./council");
      import("./advocacies-sec");
    };
    if ("requestIdleCallback" in window) {
      (window as any).requestIdleCallback(warm, { timeout: 1500 });
    } else {
      setTimeout(warm, 0);
    }
  }, []);

  return (
    <div className="about-page">
      <Header />

      {/* Hero/first content: render immediately */}
      <Suspense fallback={<Skeleton h={420} />}>
        <BriefBg />
      </Suspense>

      {/* Load the rest just-in-time as the user scrolls */}
      <InViewMount minHeight={420}>
        <Suspense fallback={<Skeleton h={420} />}>
          <VideoSec />
        </Suspense>
      </InViewMount>

      <InViewMount minHeight={360}>
        <Suspense fallback={<Skeleton h={360} />}>
          <CoreValue />
        </Suspense>
      </InViewMount>

      <InViewMount minHeight={320}>
        <Suspense fallback={<Skeleton h={320} />}>
          <MissionVision />
        </Suspense>
      </InViewMount>

      <InViewMount minHeight={580}>
        <Suspense fallback={<Skeleton h={580} />}>
          <Council />
        </Suspense>
      </InViewMount>

      <InViewMount minHeight={560}>
        <Suspense fallback={<Skeleton h={560} />}>
          <AboutAdvocacies />
        </Suspense>
      </InViewMount>

      <Footer />
    </div>
  );
});

export default AboutPage;
