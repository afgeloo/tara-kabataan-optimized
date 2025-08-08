import React, { useState, useEffect, useMemo, useRef, memo } from "react";
import Marquee from "react-fast-marquee";
import "./css/partner-sec.css";
import { Link } from "react-router-dom";
import partnerLogo from "../assets/logos/tklogo1.png";
import memberLogo from "../assets/logos/tklogo2.png";
import tklogo from "../assets/logos/tklogo3.png";
import tkdonate from "../assets/homepage/qr-code.jpg";
import donateicon from "../assets/logos/donateicon.png";

type PartnerApi = { partner_image?: string | null };
type PartnersResponse = { partners?: PartnerApi[] } | PartnerApi[] | unknown;

const BASE = import.meta.env.VITE_API_BASE_URL as string;

const encodeFilename = (p: string) => {
  const parts = p.split(/[/\\]/);
  const filename = parts[parts.length - 1] || "";
  return encodeURIComponent(filename);
};
const toLogoUrl = (fullPath: string) =>
  `${BASE}/tara-kabataan-optimized/tara-kabataan-webapp/uploads/partners-images/${encodeFilename(fullPath)}`;

const PartnerSec: React.FC = memo(() => {
  const [showQR, setShowQR] = useState(false);
  const [partnerLogos, setPartnerLogos] = useState<string[]>([]);
  const mounted = useRef(true);

  // Respect reduced motion (Marquee supports `play`)
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    mounted.current = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `${BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/partners.php`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PartnersResponse = await res.json();

        const list =
          Array.isArray((data as any)?.partners)
            ? (data as any).partners
            : Array.isArray(data)
            ? (data as any)
            : [];

        const next = (list as PartnerApi[])
          .map((p) => p?.partner_image?.trim() || "")
          .filter(Boolean)
          .map(toLogoUrl);

        // Avoid useless re-render if identical
        setPartnerLogos((prev) => {
          if (prev.length === next.length && prev.every((v, i) => v === next[i])) return prev;
          return next;
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") console.error("Error fetching partner logos:", err);
      }
    })();

    return () => {
      mounted.current = false;
      ctrl.abort();
    };
  }, []);

  // Ensure continuous scroll even with few logos (dup once if < 6)
  const displayedLogos = useMemo(() => {
    if (partnerLogos.length === 0) return [];
    if (partnerLogos.length < 6) return [...partnerLogos, ...partnerLogos];
    return partnerLogos;
  }, [partnerLogos]);

  if (displayedLogos.length === 0) {
    // Nothing to show yet; keep DOM minimal
    return (
      <div className="partner-sec">
        <h1 className="PastPartnership-Text">PAST PARTNERSHIPS</h1>
        <hr className="Hr-under-pastpartnership" />
        {/* rest of section still renders below */}
        <div className="partner-member-container">
          <div className="BePartnerMemberSection">
            <h2 className="BePartnerMemberText">BE A PARTNER</h2>
            <div className="BePartnerMemberSection-box">
              <div className="circle-inside-be-a-partner-member">
                <img src={partnerLogo} alt="Partner Logo" className="circle-image partner-image" />
              </div>
              <p className="text-inside-be-a-partner-member-container">
                Partnering with Tara Kabataan means joining a dedicated movement focused on empowering the youth and fostering community development. Your collaboration will support initiatives that promote education, environmental stewardship, and active civic engagement among young individuals.
              </p>
              <Link to="/Contact" className="button-inside-be-a-partner-member">BECOME A PARTNER</Link>
            </div>
          </div>

          <div className="BePartnerMemberSection">
            <h2 className="BePartnerMemberText">BE A MEMBER</h2>
            <div className="BePartnerMemberSection-box">
              <div className="circle-inside-be-a-partner-member">
                <img src={memberLogo} alt="Member Logo" className="circle-image member-image" />
              </div>
              <p className="text-inside-be-a-partner-member-container">
                Joining Tara Kabataan as a member means becoming part of a passionate community of youth advocates and changemakers. You’ll have opportunities to engage in meaningful volunteer work and develop your leadership and advocacy skills through community-based activities.
              </p>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSewrSWYnmn5lVqOTbSh9751x80e-IhIp_atvMFaDf3M0n6uVg/viewform"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <button className="button-inside-be-a-partner-member">BECOME A MEMBER</button>
              </a>
            </div>
          </div>
        </div>

        <h2 className="support-tk-title">SUPPORT TARA KABATAAN</h2>
        <div className="support-tk-container">
          <div className="support-tk-content-format">
            <div className="logo-inside-donate-now-placing">
              <img src={tklogo} className="logo-inside-donate-now-sizing" alt="Support Logo" />
            </div>
            <div className="support-tk-text">
              <p>
                Your donation is more than just a contribution — it’s a commitment to youth empowerment and inclusive nation-building. Every peso you give fuels Tara Kabataan’s programs that uplift communities, advance human rights, and promote genuine civic engagement.
                Whether it’s through in-kind support or financial assistance, your help goes directly to grassroots initiatives: from relief operations and educational drives to health missions and climate justice actions.
              </p>
            </div>
          </div>
          <button className="donate-now-section" onClick={() => setShowQR(true)}>
            <img src={donateicon} alt="Donate Icon" className="logo-inside-donate-now" />
            <span className="donate-now-text">DONATE NOW</span>
          </button>
        </div>

        {showQR && (
          <div className="qr-popup-overlay" onClick={() => setShowQR(false)} role="dialog" aria-modal="true">
            <div className="qr-popup" onClick={(e) => e.stopPropagation()}>
              <button className="close-qr-btn" onClick={() => setShowQR(false)} aria-label="Close">×</button>
              <p>Open GCash, Maya, or any app with a built-in QR scanner to scan:</p>
              <img src={tkdonate} alt="QR Code" className="qr-code-img" loading="lazy" decoding="async" />
              <p>Or message us directly on Messenger:</p>
              <a
                href="https://www.facebook.com/messages/t/105536985395406"
                target="_blank"
                rel="noopener noreferrer"
                className="messenger-link"
              >
                Send a Message!
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="partner-sec">
      <h1 className="PastPartnership-Text">PAST PARTNERSHIPS</h1>
      <br />
      <div>
        <Marquee
          key={`partner-marquee-${displayedLogos.length}`} // stable remount only when data changes
          speed={60}
          pauseOnHover
          loop={0}
          gradient={false}
          play={!prefersReducedMotion}
        >
          {displayedLogos.map((logo, index) => (
            <div key={`${logo}-${index}`} style={{ padding: "0 20px" }}>
              <img
                src={logo}
                className="past-partnerships-logo"
                alt={`Partner ${index + 1}`}
                loading="lazy"
                decoding="async"
                draggable={false}
                onError={(e) => {
                  const img = e.currentTarget;
                  // Hide broken images without re-render
                  img.style.display = "none";
                }}
              />
            </div>
          ))}
        </Marquee>
      </div>

      <hr className="Hr-under-pastpartnership" />

      <div className="partner-member-container">
        <div className="BePartnerMemberSection">
          <h2 className="BePartnerMemberText">BE A PARTNER</h2>
          <div className="BePartnerMemberSection-box">
            <div className="circle-inside-be-a-partner-member">
              <img src={partnerLogo} alt="Partner Logo" className="circle-image partner-image" />
            </div>
            <p className="text-inside-be-a-partner-member-container">
              Partnering with Tara Kabataan means joining a dedicated movement focused on empowering the youth and fostering community development. Your collaboration will support initiatives that promote education, environmental stewardship, and active civic engagement among young individuals.
            </p>
            <Link to="/Contact" className="button-inside-be-a-partner-member">
              BECOME A PARTNER
            </Link>
          </div>
        </div>

        <div className="BePartnerMemberSection">
          <h2 className="BePartnerMemberText">BE A MEMBER</h2>
          <div className="BePartnerMemberSection-box">
            <div className="circle-inside-be-a-partner-member">
              <img src={memberLogo} alt="Member Logo" className="circle-image member-image" />
            </div>
            <p className="text-inside-be-a-partner-member-container">
              Joining Tara Kabataan as a member means becoming part of a passionate community of youth advocates and changemakers. You’ll have opportunities to engage in meaningful volunteer work and develop your leadership and advocacy skills through community-based activities.
            </p>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSewrSWYnmn5lVqOTbSh9751x80e-IhIp_atvMFaDf3M0n6uVg/viewform"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none" }}
            >
              <button className="button-inside-be-a-partner-member">BECOME A MEMBER</button>
            </a>
          </div>
        </div>
      </div>

      <h2 className="support-tk-title">SUPPORT TARA KABATAAN</h2>
      <div className="support-tk-container">
        <div className="support-tk-content-format">
          <div className="logo-inside-donate-now-placing">
            <img src={tklogo} className="logo-inside-donate-now-sizing" alt="Support Logo" />
          </div>
          <div className="support-tk-text">
            <p>
              Your donation is more than just a contribution — it’s a commitment to youth empowerment and inclusive nation-building. Every peso you give fuels Tara Kabataan’s programs that uplift communities, advance human rights, and promote genuine civic engagement.
              Whether it’s through in-kind support or financial assistance, your help goes directly to grassroots initiatives: from relief operations and educational drives to health missions and climate justice actions.
            </p>
          </div>
        </div>
        <button className="donate-now-section" onClick={() => setShowQR(true)}>
          <img src={donateicon} alt="Donate Icon" className="logo-inside-donate-now" />
          <span className="donate-now-text">DONATE NOW</span>
        </button>
      </div>

      {showQR && (
        <div className="qr-popup-overlay" onClick={() => setShowQR(false)} role="dialog" aria-modal="true">
          <div className="qr-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-qr-btn" onClick={() => setShowQR(false)} aria-label="Close">×</button>
            <p>Open GCash, Maya, or any app with a built-in QR scanner to scan:</p>
            <img src={tkdonate} alt="QR Code" className="qr-code-img" loading="lazy" decoding="async" />
            <p>Or message us directly on Messenger:</p>
            <a
              href="https://www.facebook.com/messages/t/105536985395406"
              target="_blank"
              rel="noopener noreferrer"
              className="messenger-link"
            >
              Send a Message!
            </a>
          </div>
        </div>
      )}
    </div>
  );
});

export default PartnerSec;
