// src/components/Council.tsx
import "./css/council.css";
import React, { useEffect, useMemo, useState } from "react";
import placeholderImg from "../assets/aboutpage/img-placeholder-guy.png";
import ribbon from "../assets/aboutpage/council-ribbon.png";

type Member = {
  member_id: string;
  member_name: string;
  member_image: string | null;
  role_name: string;
};

type AboutPayload = { council?: string | null; [k: string]: unknown };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";

const BLACKLISTED_ROLES = ["Kalusugan", "Kalikasan", "Karunungan", "Kultura", "Kasarian"];

// ---- tiny in-tab cache to avoid refetches per mount ----
let _cacheAt = 0;
let _councilCache: Member[] | null = null;
let _aboutCache: string | null = null;
const TTL = 5 * 60 * 1000;

const resolveImage = (raw: string | null): string => {
  if (!raw || !raw.trim()) return placeholderImg;
  
  // 1. If it is already a full S3 link, return as-is
  if (/^https?:\/\//i.test(raw) || raw.startsWith("//")) {
    return raw;
  }

  // 2. Separate the path from the cache-busting query (e.g., ?t=123)
  const [path, query] = raw.split("?");
  let cleanPath = path.startsWith("/") ? path.substring(1) : path;

  // 3. Strip out the old redundant folders if they exist in the DB record
  if (cleanPath.startsWith("tara-kabataan-webapp/uploads/")) {
    cleanPath = cleanPath.replace("tara-kabataan-webapp/uploads/", "");
  } else if (cleanPath.startsWith("tara-kabataan-optimized/tara-kabataan-webapp/uploads/")) {
    cleanPath = cleanPath.replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "");
  }

  // 4. If it's just a raw filename, make sure it goes into the members-images folder
  if (!cleanPath.includes("/")) {
    cleanPath = `members-images/${cleanPath}`;
  }

  // 5. Combine perfectly
  let full = `${IMAGE_BASE}/${cleanPath}`;
  if (query) full += `?${query}`;
  
  return full;
};

export default function Council() {
  // PERSISTENT CACHE
  const [councilData, setCouncilData] = useState<Member[]>(() => {
    const cached = localStorage.getItem("tk_council_list");
    return cached ? JSON.parse(cached) : [];
  });
  const [councilText, setCouncilText] = useState<string>(() => {
    return JSON.parse(localStorage.getItem("tk_council_desc") || '"Loading..."');
  });

  useEffect(() => {
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

        const normalized = Array.isArray(council) ? council.map((m) => ({
                ...m,
                member_image: resolveImage(m.member_image),
              })).filter((m) => !blacklist.has(m.role_name.toLowerCase())) : [];

        setCouncilText(text);
        setCouncilData(normalized);
        
        // Save everything to disk
        localStorage.setItem("tk_council_list", JSON.stringify(normalized));
        localStorage.setItem("tk_council_desc", JSON.stringify(text));
      })
      .catch((err) => err?.name !== "AbortError" && console.error(err));

    return () => ctrl.abort();
  }, []);

  // Identify president (case-insensitive), then others
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
}
