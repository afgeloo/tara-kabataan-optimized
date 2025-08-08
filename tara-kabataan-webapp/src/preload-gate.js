import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/preload-gate.tsx
import { useEffect, useRef, useState } from "react";
import Preloader from "./preloader";
function preloadImage(url) {
    return new Promise((resolve) => {
        if (!url)
            return resolve();
        const img = new Image();
        const done = () => resolve();
        img.onload = done;
        img.onerror = done;
        img.src = url;
    });
}
function waitForImagesIn(root, timeoutMs = 6000) {
    const imgs = Array.from(root.querySelectorAll("img"));
    const pending = imgs.filter((i) => !i.complete);
    if (!pending.length)
        return Promise.resolve();
    const promises = pending.map((img) => new Promise((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
    }));
    const timeout = new Promise((r) => setTimeout(r, timeoutMs));
    return Promise.race([Promise.all(promises).then(() => { }), timeout]);
}
function waitForFonts() {
    // Safari-safe
    return document.fonts?.ready?.catch?.(() => { }) ?? Promise.resolve();
}
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const PreloadGate = ({ assets = [], minDelay = 450, containerSelector = "#root", onlyOnFirstLoad = true, enabled = true, children, }) => {
    // If we’ve already booted this tab and onlyOnFirstLoad is true, short-circuit
    const alreadyBooted = onlyOnFirstLoad && sessionStorage.getItem("appBootComplete") === "1";
    const [ready, setReady] = useState(alreadyBooted || !enabled);
    const startedAt = useRef(performance.now());
    useEffect(() => {
        if (!enabled || alreadyBooted)
            return;
        let cancelled = false;
        (async () => {
            await nextFrame();
            await Promise.all(assets.map(preloadImage));
            await waitForFonts();
            const container = document.querySelector(containerSelector) ||
                document.body;
            await waitForImagesIn(container);
            const elapsed = performance.now() - startedAt.current;
            if (elapsed < minDelay) {
                await new Promise((r) => setTimeout(r, minDelay - elapsed));
            }
            if (!cancelled) {
                setReady(true);
                // Mark this session as booted so future client navs skip the gate
                sessionStorage.setItem("appBootComplete", "1");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [assets, containerSelector, minDelay, enabled, alreadyBooted]);
    if (ready)
        return _jsx(_Fragment, { children: children });
    return (_jsxs(_Fragment, { children: [_jsx("div", { style: {
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    background: "var(--app-bg, #fff)",
                }, "aria-busy": "true", "aria-live": "polite", children: _jsx(Preloader, {}) }), _jsx("div", { style: { pointerEvents: "none", userSelect: "none" }, children: children })] }));
};
export default PreloadGate;
