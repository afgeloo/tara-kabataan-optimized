import React from "react";
import "./css/loader-events.css"; 
import preloaderImg from "../assets/logos/preloader.png"; 

const Preloader_events: React.FC<{ inline?: boolean }> = ({ inline = false }) => {
    return (
      <div className={`preloader-events ${inline ? "inline" : ""}`}>
        <div className="preloader-logo-events">
          <img src={preloaderImg} alt="Loading..." />
          <div className="shadow-events"></div>
        </div>
      </div>
    );
  };

export default Preloader_events;