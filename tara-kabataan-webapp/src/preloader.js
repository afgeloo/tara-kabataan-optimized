import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import "./global-css/preloader.css";
import preloaderImg from "./assets/logos/preloader.png";
const Preloader = () => (_jsxs("div", { className: "preloader", role: "status", "aria-live": "polite", children: [_jsxs("div", { className: "preloader-logo", children: [_jsx("img", { src: preloaderImg, alt: "Loading...", loading: "eager", decoding: "async", draggable: "false" }), _jsx("div", { className: "shadow" })] }), _jsx("p", { className: "preloader-text", children: "LOADING" })] }));
export default memo(Preloader);
