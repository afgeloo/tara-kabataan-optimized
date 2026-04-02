// src/preload-gate.tsx
import React, { useEffect, useRef, useState } from "react";
import Preloader from "./preloader";

type Asset = string;

function preloadImage(url: string) {
  return new Promise<void>((resolve) => {
    if (!url) return resolve();
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    img.src = url;
  });
}
function waitForImagesIn(root: HTMLElement, timeoutMs = 6000) {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  const pending = imgs.filter((i) => !i.complete);
  if (!pending.length) return Promise.resolve();
  const promises = pending.map(
    (img) =>
      new Promise<void>((resolve) => {
        const done = () => resolve();
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      })
  );
  const timeout = new Promise<void>((r) => setTimeout(r, timeoutMs));
  return Promise.race([Promise.all(promises).then(() => {}), timeout]);
}
function waitForFonts() {
  // Safari-safe
  return (document as any).fonts?.ready?.catch?.(() => {}) ?? Promise.resolve();
}
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

interface PreloadGateProps {
  assets?: Asset[];
  minDelay?: number;
  containerSelector?: string;
  /** Skip the gate after the first successful load in this tab/session */
  onlyOnFirstLoad?: boolean;
  /** Force-disable entirely (e.g., for light routes) */
  enabled?: boolean;
}

const PreloadGate: React.FC<React.PropsWithChildren<PreloadGateProps>> = ({
  assets = [],
  minDelay = 450,
  containerSelector = "#root",
  onlyOnFirstLoad = true,
  enabled = true,
  children,
}) => {
  // If we’ve already booted this tab and onlyOnFirstLoad is true, short-circuit
  const alreadyBooted =
    onlyOnFirstLoad && sessionStorage.getItem("appBootComplete") === "1";

  const [ready, setReady] = useState(alreadyBooted || !enabled);
  const startedAt = useRef<number>(performance.now());

  useEffect(() => {
    if (!enabled || alreadyBooted) return;

    let cancelled = false;
    (async () => {
      await nextFrame();
      await Promise.all(assets.map(preloadImage));
      await waitForFonts();

      const container =
        (document.querySelector(containerSelector) as HTMLElement) ||
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

  if (ready) return <>{children}</>;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "var(--app-bg, #fff)",
        }}
        aria-busy="true"
        aria-live="polite"
      >
        <Preloader />
      </div>
      <div style={{ pointerEvents: "none", userSelect: "none" }}>{children}</div>
    </>
  );
};

export default PreloadGate;
