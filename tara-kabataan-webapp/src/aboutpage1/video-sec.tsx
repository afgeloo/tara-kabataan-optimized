import React, { memo, useEffect, useRef, useState, lazy, Suspense } from "react";
import "./css/video-sec.css";

// Lazy-load the player for smaller initial bundle
const ReactPlayer = lazy(() => import("react-player/lazy"));

const FB_VIDEO_URL =
  "https://www.facebook.com/TaraKabataanMNL/videos/330160250091186";

const VideoSec: React.FC = memo(() => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") {
      setVisible(true); // Fallback if no IO support
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.01 }
    );

    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="about-video-sec">
      <div className="about-video-description">
        <h1>Let’s take a walk down memory lane to revisit where it all began</h1>
      </div>

      <div className="about-video-container" ref={containerRef}>
        <div className="custom-video-frame">
          {visible ? (
            <Suspense fallback={<div style={{ width: "100%", paddingTop: "56.25%" }} />}>
              <ReactPlayer
                url={FB_VIDEO_URL}
                controls
                width="100%"
                height="100%"
                playsinline
                onError={(e) => console.error("Video load error:", e)}
              />
            </Suspense>
          ) : (
            <div style={{ width: "100%", paddingTop: "56.25%" }} />
          )}
        </div>
      </div>
    </div>
  );
});

export default VideoSec;
