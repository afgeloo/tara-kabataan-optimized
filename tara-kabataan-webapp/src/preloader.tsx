import React, { memo } from "react";
import "./global-css/preloader.css";
import preloaderImg from "./assets/logos/preloader.png";

const Preloader: React.FC = () => (
  <div className="preloader" role="status" aria-live="polite">
    <div className="preloader-logo">
      <img
        src={preloaderImg}
        alt="Loading..."
        loading="eager"
        decoding="async"
        draggable="false"
      />
      <div className="shadow"></div>
    </div>
    <p className="preloader-text">LOADING</p>
  </div>
);

export default memo(Preloader);
