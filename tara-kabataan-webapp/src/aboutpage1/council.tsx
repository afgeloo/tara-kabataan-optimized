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

const BLACKLISTED_ROLES = ["Kalusugan", "Kalikasan", "Karunungan", "Kultura", "Kasarian"];

// ---- tiny in-tab cache to avoid refetches per mount ----
let _cacheAt = 0;
let _councilCache: Member[] | null = null;
let _aboutCache: string | null = null;
const TTL = 5 * 60 * 1000;

const resolveImage = (raw: string | null): string => {
  if (!raw || !raw.trim()) return placeholderImg;
  if (raw.startsWith("http")) return raw;

  const [path, query] = raw.split("?");
  const hasOpt = path.includes("/tara-kabataan-optimized/");
  const hasNon = path.includes("/tara-kabataan-optimized/");

  let full = hasOpt || hasNon ? `${API_BASE}${path}` : `${API_BASE}/tara-kabataan-optimized/${path.startsWith("/") ? path.slice(1) : path}`;
  if (query) full += `?${query}`;
  return full;
};

export default function Council() {
  const [councilData, setCouncilData] = useState<Member[]>(_councilCache ?? []);
  const [councilText, setCouncilText] = useState<string>(_aboutCache ?? "Loading...");

  useEffect(() => {
    const now = Date.now();
    const fresh = now - _cacheAt < TTL && _councilCache && _aboutCache;

    if (fresh) return;

    const ctrl = new AbortController();
    const aboutUrl = `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/aboutus.php`;
    const councilUrl = `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/council.php`;

    Promise.all([
      fetch(aboutUrl, { signal: ctrl.signal }).then((r) => (r.ok ? r.json() : Promise.reject(r))),
      fetch(councilUrl, { signal: ctrl.signal }).then((r) => (r.ok ? r.json() : Promise.reject(r))),
    ])
      .then(([about, council]: [AboutPayload, Member[]]) => {
        const text = (about?.council ?? "").toString().trim() || "No data.";
        const blacklist = new Set(BLACKLISTED_ROLES.map((s) => s.toLowerCase()));

        const normalized: Member[] = Array.isArray(council)
          ? council
              .map((m) => ({
                ...m,
                role_name: (m.role_name ?? "").trim(),
                member_image: resolveImage(m.member_image),
              }))
              .filter((m) => !blacklist.has(m.role_name.toLowerCase()))
          : [];

        _aboutCache = text;
        _councilCache = normalized;
        _cacheAt = Date.now();

        setCouncilText(text);
        setCouncilData(normalized);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Council fetch error:", err);
          if (!_aboutCache) setCouncilText("Failed to load.");
          if (!_councilCache) setCouncilData([]);
        }
      });

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
