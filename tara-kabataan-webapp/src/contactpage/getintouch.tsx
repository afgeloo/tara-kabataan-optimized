// src/contactpage/getintouch.tsx

import "./css/getintouch.css";
import { useEffect, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import telephoneImg from "../assets/contactpage/telephone.png";
import emailImg from "../assets/contactpage/email.png";
import facebookImg from "../assets/contactpage/facebook.png";
import instagramImg from "../assets/contactpage/instagram.png";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// --- ZERO LATENCY CACHE ---
export let _globalAboutCache: any = null;
export let _globalAboutCacheAt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const GetInTouch = memo(() => {
  const navigate = useNavigate();

  // Initialize state IMMEDIATELY if the cache exists (Zero Latency)
  const [contactData, setContactData] = useState({
    contactNo: _globalAboutCache?.contact_no || "Loading...",
    email: _globalAboutCache?.about_email || "Loading...",
    address: _globalAboutCache?.address || "Manila, Philippines",
    instagramLink: _globalAboutCache?.instagram || "https://www.instagram.com/tarakabataan",
    facebookLink: _globalAboutCache?.facebook || "https://www.facebook.com/TaraKabataanMNL",
  });

  useEffect(() => {
    const now = Date.now();
    // If cache is hot, skip the network request entirely!
    if (_globalAboutCache && now - _globalAboutCacheAt < CACHE_TTL) {
      return; 
    }

    let mounted = true;
    fetch(`${API_BASE}/aboutus.php`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        
        // Update the cache for the rest of the site
        _globalAboutCache = data;
        _globalAboutCacheAt = Date.now();
        
        setContactData({
          contactNo: data.contact_no || "Unavailable",
          email: data.about_email || "Unavailable",
          address: data.address || "Manila, Philippines",
          instagramLink: data.instagram || "https://www.instagram.com/tarakabataan",
          facebookLink: data.facebook || "https://www.facebook.com/TaraKabataanMNL",
        });
      })
      .catch((err) => {
        console.error("Error fetching contact info:", err);
        if (!mounted) return;
        setContactData((prev) => ({
          ...prev,
          contactNo: "Unavailable",
          email: "Unavailable",
        }));
      });

    return () => { mounted = false; };
  }, []);

  return (
    <div className="getintouch-sec">
      <div className="getintouch-content">
        <h1 className="getintouch-header">Get in Touch</h1>
        <p className="getintouch-description">
          Reach out to us through any of our contact points below. We're here to listen and connect with you!
        </p>
      </div>

      <div className="getintouch-sub-sec">
        <div className="getintouch-left">
          <div className="contact-telephone">
            <a href={`tel:${contactData.contactNo}`} target="_blank" rel="noopener noreferrer">
              <div className="contact-telephone-icon">
                <img src={telephoneImg} alt="Telephone Icon" draggable="false" />
              </div>
            </a>
            <div className="contact-telephone-details">
              <h1 className="contact-telephone-header">Telephone</h1>
              <p className="contact-telephone-no">{contactData.contactNo}</p>
            </div>
          </div>

          <div className="contact-email">
            <div onClick={() => navigate("/contact")} style={{ cursor: "pointer" }}>
              <div className="contact-email-icon">
                <img src={emailImg} alt="Email Icon" draggable="false" />
              </div>
            </div>
            <div onClick={() => navigate("/contact")} style={{ cursor: "pointer" }} className="contact-email-details">
              <h1 className="contact-email-header">Email</h1>
              <p className="contact-email">{contactData.email}</p>
            </div>
          </div>
        </div>

        <div className="getintouch-right">
          <div className="contact-telephone">
            <a href={contactData.facebookLink} target="_blank" rel="noopener noreferrer">
              <div className="contact-telephone-icon">
                <img src={facebookImg} alt="Facebook Icon" draggable="false" />
              </div>
            </a>
            <div className="contact-telephone-details">
              <h1 className="contact-telephone-header">Facebook</h1>
              <p className="contact-telephone-no">Tara Kabataan</p>
            </div>
          </div>

          <div className="contact-email">
            <a href={contactData.instagramLink} target="_blank" rel="noopener noreferrer">
              <div className="contact-email-icon">
                <img src={instagramImg} alt="Instagram Icon" draggable="false" />
              </div>
            </a>
            <div className="contact-email-details">
              <h1 className="contact-email-header">Instagram</h1>
              <p className="contact-email">@tarakabataan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default GetInTouch;