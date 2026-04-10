// src/src/about/AdvocaciesSection.tsx (or wherever this file lives)

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

/* ---------- Constants ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const API_URL = `${API_BASE}/members.php`;
const IMAGE_BASE = import.meta.env.VITE_IMAGE_BASE_URL || "https://tara-kabataan-webapp-v2.s3.ap-southeast-2.amazonaws.com/tara-kabataan-optimized/tara-kabataan-webapp/uploads";

/** * Robust S3 Resolver: 
 * Strips legacy prefixes to prevent the "Double Folder" bug found in old DB records.
 */
const resolveImage = (raw: string | null): string => {
  if (!raw || !raw.trim()) return placeholderImg;
  
  // --- HOTFIX: Intercept the old bucket name before doing anything else! ---
  let finalUrl = raw.replace("tara-kabataan-webapp.s3", "tara-kabataan-webapp-v2.s3");
  
  if (/^https?:\/\//i.test(finalUrl) || finalUrl.startsWith("//")) {
    return finalUrl;
  }

  const [path, query] = finalUrl.split("?");
  let cleanPath = path.startsWith("/") ? path.substring(1) : path;

  // Kill redundant folders causing broken S3 links
  if (cleanPath.startsWith("tara-kabataan-webapp/uploads/")) {
    cleanPath = cleanPath.replace("tara-kabataan-webapp/uploads/", "");
  } else if (cleanPath.startsWith("tara-kabataan-optimized/tara-kabataan-webapp/uploads/")) {
    cleanPath = cleanPath.replace("tara-kabataan-optimized/tara-kabataan-webapp/uploads/", "");
  }

  // Ensure it points to the members-images folder if no folder is present
  if (!cleanPath.includes("/")) {
    cleanPath = `members-images/${cleanPath}`;
  }

  let full = `${IMAGE_BASE}/${cleanPath}`;
  if (query) full += `?${query}`;
  
  return full;
};

// ---------- Advocacy Slides Configuration ----------
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

// ---------- Helper: Grouping ----------
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

// ---------- Component ----------
const AboutAdvocacies = memo(function AboutAdvocacies() {
  // ZERO LATENCY: Pull from disk immediately
  const [members, setMembers] = useState<Member[]>(() => {
    const cached = localStorage.getItem("tk_advocacy_members");
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    const ctrl = new AbortController();

    fetch(API_URL, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ApiPayload>;
      })
      .then((data) => {
        if (!data || !Array.isArray(data.members)) return;

        const resolved = data.members.map((m) => ({
          ...m,
          role_name: (m.role_name || "").trim(),
          member_image: resolveImage(m.member_image),
        }));

        setMembers(resolved);
        // Persist data for zero-latency loading on next visit
        localStorage.setItem("tk_advocacy_members", JSON.stringify(resolved));
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("[AboutAdvocacies] fetch members failed:", err);
        }
      });

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