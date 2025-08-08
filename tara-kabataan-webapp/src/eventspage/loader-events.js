import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "./css/loader-events.css";
import preloaderImg from "../assets/logos/preloader.png";
const Preloader_events = ({ inline = false }) => {
    return (_jsx("div", { className: `preloader-events ${inline ? "inline" : ""}`, children: _jsxs("div", { className: "preloader-logo-events", children: [_jsx("img", { src: preloaderImg, alt: "Loading..." }), _jsx("div", { className: "shadow-events" })] }) }));
};
export default Preloader_events;
