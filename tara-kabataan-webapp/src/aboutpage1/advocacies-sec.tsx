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

/* ---------- constants ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const API_URL = `${API_BASE}/members.php`;
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";

/** 
 * Robust resolver: uses S3 base URL and cleans up paths 
 * Specific to members-images folder structure
 */
const getSafeMemberImage = (url?: string | null) => {
  if (!url || !url.trim()) return placeholderImg;

  // 1. If it's already an absolute URL, use it
  if (url.startsWith("http") || url.startsWith("//")) {
    return url;
  }

  // 2. Clean up the path (removes redundant server paths and fixes double folder bugs)
  let cleanPath = url
    .replace(/^\/?tara-kabataan-optimized\/tara-kabataan-webapp\/uploads\//, "")
    .replace("members-images/members-images/", "members-images/"); 

  // 3. Remove leading slash if exists
  if (cleanPath.startsWith("/")) {
    cleanPath = cleanPath.substring(1);
  }

  // 4. Combine with S3 base
  return `${IMAGE_BASE}/${cleanPath}`;
};

// ---------- tiny cache ----------
const CACHE_VERSION = 1;
let _ver = 0;
let _at = 0;
let _members: Member[] | null = null;
const TTL = 5 * 60 * 1000;

// ---------- slides configuration ----------
const slides = [
  {
    key: "Kalusugan",
    defaultImage: healthIconDefault,
    hoverImage: healthIconHover,
    category: "Kalusugan",
    title: "Itinataguyod ang abot-kamay at makataong serbisyong pangkalusugan para sa lahat...",
  },
  {
    key: "Kalikasan",
    defaultImage: natureIconDefault,
    hoverImage: natureIconHover,
    category: "Kalikasan",
    title: "Nangunguna sa panawagan para sa katarungang pangklima at pangangalaga sa kalikasan...",
  },
  {
    key: "Karunungan",
    defaultImage: bookIconDefault,
    hoverImage: bookIconHover,
    category: "Karunungan",
    title: "Isinusulong ang kabuuang pagkatuto at mapagpalayang edukasyon...",
  },
  {
    key: "Kultura",
    defaultImage: kulturaIconDefault,
    hoverImage: kulturaIconHover,
    category: "Kultura",
    title: "Pinapalakas ang pambansang identidad at malikhaing kaisipan...",
  },
  {
    key: "Kasarian",
    defaultImage: kasarianIconDefault,
    hoverImage: kasarianIconHover,
    category: "Kasarian",
    title: "Pinapahalagahan ang pagkakapantay-pantay ng kasarian at inklusibong lipunan...",
  },
] as const;

// ---------- grouping logic ----------
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
    const fresh = _ver === CACHE_VERSION && _members && now - _at < TTL;

    if (fresh) return;

    const ctrl = new AbortController();

    setTimeout(() => {
      fetch(API_URL, { signal: ctrl.signal }) 
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
            // Apply the new S3 image resolver here
            member_image: getSafeMemberImage(m.member_image),
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
                <img src={slide.defaultImage} alt="" className="default-icon" loading="lazy" />
                <img src={slide.hoverImage} alt="" className="hover-icon" loading="lazy" />
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
                      // Fallback for broken S3 links
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = placeholderImg;
                      }}
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