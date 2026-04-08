// src/components/Council.tsx

import React, { useEffect, useMemo, useState, memo } from "react";
import "./css/council.css";
import placeholderImg from "../assets/aboutpage/img-placeholder-guy.png";
import ribbon from "../assets/aboutpage/council-ribbon.png";

type Member = {
  member_id: string;
  member_name: string;
  member_image: string | null;
  role_name: string;
};

type AboutPayload = { council?: string | null; [k: string]: unknown };

/* ---------- Constants ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";
const BLACKLISTED_ROLES = ["Kalusugan", "Kalikasan", "Karunungan", "Kultura", "Kasarian"];
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/* ---------- Robust S3 Image Resolver ---------- */
const resolveImage = (raw: string | null): string => {
  if (!raw || !raw.trim()) return placeholderImg;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("//")) return raw;

  const [path, query] = raw.split("?");
  let cleanPath = path.startsWith("/") ? path.substring(1) : path;

  // Strip out redundant folders
  cleanPath = cleanPath
    .replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "")
    .replace("tara-kabataan-webapp/uploads/", "")
    .replace("members-images/members-images/", "members-images/"); // Fix double folder

  if (!cleanPath.includes("/")) cleanPath = `members-images/${cleanPath}`;

  let full = `${IMAGE_BASE}/${cleanPath}`;
  if (query) full += `?${query}`;
  
  return full;
};

/* ---------- Component ---------- */
const Council = memo(() => {
  // 1. INSTANT RENDER: Grab data from disk on mount
  const [councilData, setCouncilData] = useState<Member[]>(() => {
    try {
      const cached = localStorage.getItem("tk_council_list");
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });

  const [councilText, setCouncilText] = useState<string>(() => {
    try {
      return JSON.parse(localStorage.getItem("tk_council_desc") || '"Loading..."');
    } catch { return "Loading..."; }
  });

  // 2. BACKGROUND SYNC (Only if Cache is Expired)
  useEffect(() => {
    const lastFetch = Number(localStorage.getItem("tk_council_time") || 0);
    const now = Date.now();

    // SMART CACHE: If the data is less than 5 minutes old, STOP! Don't hit the database.
    if (councilData.length > 0 && (now - lastFetch < CACHE_TTL)) {
      return; 
    }

    const ctrl = new AbortController();
    const aboutUrl = `${API_BASE}/aboutus.php`;
    const councilUrl = `${API_BASE}/council.php`;

    Promise.all([
      fetch(aboutUrl, { signal: ctrl.signal }).then((r) => r.json()),
      fetch(councilUrl, { signal: ctrl.signal }).then((r) => r.json()),
    ])
      .then(([about, council]) => {
        const text = about?.council?.trim() || "No data.";
        const blacklist = new Set(BLACKLISTED_ROLES.map((s) => s.toLowerCase()));

        const normalized = Array.isArray(council) 
          ? council
              .map((m) => ({ ...m, member_image: resolveImage(m.member_image) }))
              .filter((m) => !blacklist.has(m.role_name.toLowerCase())) 
          : [];

        setCouncilText(text);
        setCouncilData(normalized);
        
        // Save everything to disk AND log the exact time we fetched it
        localStorage.setItem("tk_council_list", JSON.stringify(normalized));
        localStorage.setItem("tk_council_desc", JSON.stringify(text));
        localStorage.setItem("tk_council_time", String(Date.now()));
      })
      .catch((err) => {
        if (err?.name !== "AbortError") console.error("Council fetch error:", err);
      });

    return () => ctrl.abort();
  }, [councilData.length]);

  // 3. IDENTIFY LEADERS
  const { president, others } = useMemo(() => {
    const prez = councilData.find((m) => m.role_name.toLowerCase() === "president");
    const rest = councilData.filter((m) => m !== prez);
    return { president: prez, others: rest };
  }, [councilData]);

  return (
    <div className="council-sec">
      <div className="council-ribbon">
        <img src={ribbon} alt="ribbon" loading="lazy" decoding="async" />
      </div>

      <div className="council-sec-content">
        <h1 className="council-header">Council</h1>
        <p
          className="council-description"
          dangerouslySetInnerHTML={{ __html: councilText.replace(/\n/g, "<br />") }}
        />
      </div>

      {/* President */}
      {president && (
        <div className="council-president-grid">
          <div className="council-card council-card-main">
            <div className="council-inner-card-1-president">
              <div className="council-inner-card-2">
                <div className="council-member-image">
                  <img
                    src={president.member_image ?? placeholderImg}
                    alt={president.member_name}
                    loading="lazy"
                    decoding="async"
                    width={320}
                    height={320}
                  />
                </div>
                <h1 className="council-member-name">{president.member_name}</h1>
                <p className="council-member-role">{president.role_name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other council members */}
      <div className="council-grid">
        {others.map((member) => (
          <div key={member.member_id} className="council-card">
            <div className="council-inner-card-1-members">
              <div className="council-inner-card-2">
                <div className="council-member-image">
                  <img
                    src={member.member_image ?? placeholderImg}
                    alt={member.member_name}
                    loading="lazy"
                    decoding="async"
                    width={240}
                    height={240}
                  />
                </div>
                <h1 className="council-member-name">{member.member_name}</h1>
                <p className="council-member-role">{member.role_name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Council;