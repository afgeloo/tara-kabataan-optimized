// src/components/AboutAdvocacies.tsx
import React, { memo, useEffect, useMemo, useState } from "react";
import "./css/advocacies-sec.css";

import healthIconDefault from "../assets/eventspage/health-icon.png";
import healthIconHover from "../assets/eventspage/health-hover.png";
import natureIconDefault from "../assets/eventspage/nature-icon.png";
import natureIconHover from "../assets/eventspage/nature-hover.png";
import bookIconDefault from "../assets/eventspage/book-icon.png";
import bookIconHover from "../assets/eventspage/book-hover.png";
import kasarianIconDefault from "../assets/eventspage/kasarian-icon.png";
import kasarianIconHover from "../assets/eventspage/kasarian-hover.png";
import kulturaIconDefault from "../assets/eventspage/kultura-icon.png";
import kulturaIconHover from "../assets/eventspage/kultura-hover.png";
import placeholderImg from "../assets/aboutpage/img-placeholder-guy.png";

type Member = {
  member_id: string;
  member_name: string;
  member_image: string | null;
  role_name: string;
};

type ApiPayload = {
  success: boolean | number | string;
  members: Member[];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const API_URL = `${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/members.php`;

// ---------- tiny cache ----------
const CACHE_VERSION = 1;
let _ver = 0;
let _at = 0;
let _members: Member[] | null = null;
const TTL = 5 * 60 * 1000;

// ---------- slides ----------
const slides = [
  {
    key: "Kalusugan",
    defaultImage: healthIconDefault,
    hoverImage: healthIconHover,
    category: "Kalusugan",
    title:
      "Itinataguyod ang abot-kamay at makataong serbisyong pangkalusugan para sa lahat sa pamamagitan ng paglaban sa pribatisasyon ng healthcare, pagtugon sa mga salik panlipunan na nakakaapekto sa kalusugan, at pagsasaayos sa kakulangan ng health workers at pasilidad.",
  },
  {
    key: "Kalikasan",
    defaultImage: natureIconDefault,
    hoverImage: natureIconHover,
    category: "Kalikasan",
    title:
      "Nangunguna sa panawagan para sa katarungang pangklima at pangangalaga sa kalikasan sa pamamagitan ng makatarungang paglipat sa sustenableng pamumuhay, paghahanda sa sakuna, at pagprotekta sa mga komunidad laban sa mapaminsalang proyekto tulad ng reclamation.",
  },
  {
    key: "Karunungan",
    defaultImage: bookIconDefault,
    hoverImage: bookIconHover,
    category: "Karunungan",
    title:
      "Isinusulong ang kabuuang pagkatuto at mapagpalayang edukasyon sa pamamagitan ng mga programang nakabatay sa laro, pagpapalalim ng kamalayang panlipunan, at pagtataguyod ng mabuting pamamahala.",
  },
  {
    key: "Kultura",
    defaultImage: kulturaIconDefault,
    hoverImage: kulturaIconHover,
    category: "Kultura",
    title:
      "Pinapalakas ang pambansang identidad at malikhaing kaisipan habang nilalabanan ang historikal na distorsyon sa pamamagitan ng sining bilang sandata ng paglaban at adbokasiya.",
  },
  {
    key: "Kasarian",
    defaultImage: kasarianIconDefault,
    hoverImage: kasarianIconHover,
    category: "Kasarian",
    title:
      "Pinapahalagahan ang pagkakapantay-pantay ng kasarian at inklusibong lipunan sa pamamagitan ng pagsusulong ng mga polisiya tulad ng SOGIESC Bill, Divorce Bill, at pagtatanggol sa karapatan ng kababaihan.",
  },
] as const;

// ---------- utils ----------
const resolveMemberImage = (raw: string | null): string => {
  if (!raw || !raw.trim()) return placeholderImg;
  if (raw.startsWith("http")) return raw;

  const [path, query] = raw.split("?");
  const hasOpt = path.includes("/tara-kabataan-optimized/");
  const hasNon = path.includes("/tara-kabataan-optimized/");

  let normalized: string;
  if (hasOpt || hasNon) {
    normalized = `${API_BASE}${path}`;
  } else {
    const clean = path.startsWith("/") ? path.slice(1) : path;
    normalized = `${API_BASE}/tara-kabataan-optimized/${clean}`;
  }

  return query ? `${normalized}?${query}` : normalized;
};

const groupByRole = (list: Member[]) => {
  const m = new Map<string, Member[]>();
  for (const it of list) {
    const key = (it.role_name ?? "").trim().toLowerCase();
    const arr = m.get(key);
    if (arr) arr.push(it);
    else m.set(key, [it]);
  }
  return m;
};

// ---------- component ----------
const AboutAdvocacies = memo(function AboutAdvocacies() {
  const [members, setMembers] = useState<Member[]>(
    _ver === CACHE_VERSION ? _members ?? [] : []
  );

  useEffect(() => {
    const now = Date.now();
    const fresh =
      _ver === CACHE_VERSION && _members && now - _at < TTL;

    if (fresh) return;

    const ctrl = new AbortController();

    // yield once; don't rely on requestIdleCallback
    setTimeout(() => {
      fetch(API_URL, { signal: ctrl.signal }) // no credentials
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<ApiPayload>;
        })
        .then((data) => {
          const ok =
            data &&
            (data.success === true ||
              data.success === 1 ||
              data.success === "1" ||
              data.success === "true");
          if (!ok || !Array.isArray(data.members)) return;

          const resolved = data.members.map((m) => ({
            ...m,
            role_name: (m.role_name || "").trim(),
            member_image: resolveMemberImage(m.member_image),
          }));

          _ver = CACHE_VERSION;
          _members = resolved;
          _at = Date.now();
          setMembers(resolved);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            console.error("[AboutAdvocacies] fetch members failed:", err);
          }
        });
    }, 0);

    return () => ctrl.abort();
  }, []);

  const membersByRole = useMemo(() => groupByRole(members), [members]);

  return (
    <section className="advocacies-section" aria-labelledby="advocacies-header">
      <hr className="advocacies-line" />
      <h1 id="advocacies-header" className="advocacies-header">Advocacies</h1>

      <div className="advocacies-slider" role="list">
        {slides.map((slide) => {
          const leads = membersByRole.get(slide.category.toLowerCase()) ?? [];

          return (
            <article
              key={slide.key}
              className={`advocacy-card ${slide.category.toLowerCase()}`}
              role="listitem"
            >
              <div className="advocacy-icon-container" aria-hidden="true">
                <img
                  src={slide.defaultImage}
                  alt=""
                  className="default-icon"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  src={slide.hoverImage}
                  alt=""
                  className="hover-icon"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <h2 className="advocacy-category">{slide.category}</h2>
              <p className="advocacy-title">{slide.title}</p>

              {leads.length > 0 && (
                <h3 className="advocacy-category">
                  {leads.length > 1 ? "Leads" : "Lead"}
                </h3>
              )}

              <div className="advocacy-leads">
                {leads.map((lead) => (
                  <div
                    key={lead.member_id}
                    className="advocacy-lead-container"
                    title={lead.member_name}
                  >
                    <img
                      className="lead-photo"
                      src={lead.member_image || placeholderImg}
                      alt={lead.member_name}
                      loading="lazy"
                      decoding="async"
                      width={96}
                      height={96}
                    />
                    <p className="advocacy-lead">{lead.member_name}</p>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
});

export default AboutAdvocacies;
