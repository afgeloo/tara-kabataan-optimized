import React, { useEffect, useMemo, useRef, useState, memo } from "react";
import "./global-css/footer.css";
import "./global-css/header.css";

import logo from "./assets/header/tarakabataanlogo2.png";
import topCloud from "./assets/homepage/top-cloud.png";
import footerMid from "./assets/homepage/footer-mid.png";
import botCloud from "./assets/footer/botcloud.png";
import facebookIcon from "./assets/footer/facebook.png";
import instagramIcon from "./assets/footer/instagram.png";
import { IonIcon } from "@ionic/react";
import { callOutline, mailOutline } from "ionicons/icons";

type AboutResp = {
  contact_no?: string;
  about_email?: string;
} | Record<string, unknown>;

const BASE = import.meta.env.VITE_API_BASE_URL as string;

const Footer: React.FC = memo(() => {
  const [info, setInfo] = useState<{ contact: string; email: string }>({
    contact: "Loading...",
    email: "Loading...",
  });

  const mounted = useRef(true);

  // stable fallbacks (no new strings every render)
  const unavailable = useMemo(() => ({ contact: "Unavailable", email: "Unavailable" }), []);

  useEffect(() => {
    mounted.current = true;
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `${BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`,
          { signal: ctrl.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: AboutResp = await res.json();

        const contact = typeof (data as any)?.contact_no === "string" && (data as any).contact_no.trim()
          ? (data as any).contact_no
          : unavailable.contact;

        const email = typeof (data as any)?.about_email === "string" && (data as any).about_email.trim()
          ? (data as any).about_email
          : unavailable.email;

        // avoid pointless re-render if unchanged
        setInfo((prev) => (prev.contact === contact && prev.email === email ? prev : { contact, email }));
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Error fetching footer data:", err);
          setInfo(unavailable);
        }
      }
    })();

    return () => {
      mounted.current = false;
      ctrl.abort();
    };
  }, [unavailable]);

  return (
    <div className="footer-sec">
      <img
        src={topCloud}
        className="footer-top-cloud"
        alt="Top Cloud"
        draggable="false"
        loading="lazy"
        decoding="async"
      />
      <div className="footer-section-main">
        <div className="footer-content">
          <div className="footer-left-content">
            <img
              src={logo}
              alt="Tarakabataan Logo"
              className="footer-tk-logo"
              draggable="false"
              loading="lazy"
              decoding="async"
            />
            <div className="footer-number">
              <div className="footer-icon-circle">
                <IonIcon icon={callOutline} />
              </div>
              <p>{info.contact}</p>
            </div>
            <div className="footer-email">
              <div className="footer-icon-circle">
                <IonIcon icon={mailOutline} />
              </div>
              <p>{info.email}</p>
            </div>
          </div>

          <div className="footer-mid-content">
            <h2>About Us</h2>
            <p>
              Ang Tara Kabataan (TK) ay isang organisasyon ng mga kabataan sa Maynila na
              itinatag para isulong ang kaginhawaan ng bawat kabataan at Manilenyo.
            </p>
          </div>

          <div className="footer-right-content">
            <h2>Social Media</h2>
            <a
              href="https://www.facebook.com/TaraKabataanMNL"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-facebook"
            >
              <img
                src={facebookIcon}
                alt="Facebook"
                draggable="false"
                loading="lazy"
                decoding="async"
              />
              <p>Tara Kabataan</p>
            </a>
            <a
              href="https://www.instagram.com/tarakabataan"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-instagram"
            >
              <img
                src={instagramIcon}
                alt="Instagram"
                draggable="false"
                loading="lazy"
                decoding="async"
              />
              <p>@tarakabataan</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Footer;
