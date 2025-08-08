import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../header";
import Footer from "../footer";
import "./singleblog.css";
import silverPencil from "../assets/logos/silverPencil.png";
import silverTime from "../assets/logos/silverTime.jpg";
import attachIcon from "../assets/logos/attachicon.jpg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Blog {
  blog_id: string;
  title: string;
  content: string;
  image_url: string;
  category: string;
  created_at: string;
  author: string;
}

/* ---------- stable constants/helpers ---------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const UPLOADS_BASE = `${API_BASE}/tara-kabataan-optimized/tara-kabataan-webapp/uploads/blogs-images`;
const DATE_FMT = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

/** Robust resolver: handles absolute, protocol-relative, server-relative, and bare filenames */
const getFullImageUrl = (path: string) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path) || path.startsWith("//")) return path; // already absolute
  if (path.startsWith("/")) return `${API_BASE}${path}`; // server-relative
  return `${UPLOADS_BASE}/${path}`; // bare filename
};

function arraysShallowEqual(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export default function SingleBlog() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [moreImages, setMoreImages] = useState<string[]>([]);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);
  const [showAllImagesModal, setShowAllImagesModal] = useState(false);
  const sessionRestored = useRef(false);

  /* ---------- scroll restoration BEFORE paint (no flicker) ---------- */
  useLayoutEffect(() => {
    if (!sessionRestored.current) {
      const y = sessionStorage.getItem("singleBlogScrollY");
      if (y) window.scrollTo(0, +y);
      sessionStorage.removeItem("singleBlogScrollY");
      sessionRestored.current = true;
    }
  }, []);

  /* ---------- fetch main blog (abortable, guarded) ---------- */
  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();
    setLoading(true);
    setNotFound(false);

    fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/blogs.php?blog_id=${id}`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.blog_id) {
          setBlog((prev) => (prev?.blog_id === data.blog_id ? prev : (data as Blog)));
        } else {
          setNotFound(true);
        }
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setNotFound(true);
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [id]);

  /* ---------- fetch more images (abortable, pre-resolve URLs) ---------- */
  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();

    fetch(`${API_BASE}/tara-kabataan-optimized/tara-kabataan-backend/api/get_blog_images.php?blog_id=${id}`, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
      .then((res) => res.json())
      .then(({ success, images }) => {
        if (success && Array.isArray(images)) {
          const resolved = images.map((p: string) => getFullImageUrl(p));
          setMoreImages((prev) => (arraysShallowEqual(prev, resolved) ? prev : resolved));
        }
      })
      .catch(() => {
        /* ignore */
      });

    return () => ctrl.abort();
  }, [id]);

  /* ---------- lock background scroll when modal/viewer is open ---------- */
  useEffect(() => {
    const lock = showAllImagesModal || !!fullImageUrl;
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showAllImagesModal, fullImageUrl]);

  /* ---------- copy link (stable) ---------- */
  const copyBlogLink = useCallback(async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied!");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      toast.success("Link copied!");
    }
  }, []);

  /* ---------- memoized formatted content & date ---------- */
  const formattedContent = useMemo(
    () => (blog ? blog.content.replace(/\n/g, "<br>").replace(/  /g, " &nbsp;") : ""),
    [blog]
  );

  const formattedDate = useMemo(
    () => (blog ? DATE_FMT.format(new Date(blog.created_at)) : ""),
    [blog?.created_at]
  );

  /* ---------- precompute hero URL & stable openers ---------- */
  const heroUrl = useMemo(() => (blog ? getFullImageUrl(blog.image_url) : ""), [blog?.image_url]);
  const openHero = useCallback(() => setFullImageUrl(heroUrl), [heroUrl]);
  const openFull = useCallback((u: string) => setFullImageUrl(u), []);

  /* ---------- tiny derived slice ---------- */
  const previewImages = useMemo(() => moreImages.slice(0, 4), [moreImages]);

  if (notFound) return <div className="single-blog-not-found">Blog does not exist.</div>;
  if (loading || !blog) return null;

  return (
    <div className="single-blog-container">
      <Header />
      <main className="single-blog-main">
        <button
          className="back-button"
          onClick={() => {
            sessionStorage.setItem("singleBlogScrollY", window.scrollY.toString());
            navigate(-1);
          }}
        >
          ← Go Back
        </button>

        <div className="single-blog-image-wrapper">
          <img
            src={heroUrl}
            alt={blog.title}
            className="single-blog-image"
            loading="lazy"
            decoding="async"
            style={{ cursor: "zoom-in" }}
            onClick={openHero}
          />
        </div>

        {moreImages.length > 0 && (
          <div className="blog-more-image-grid">
            {previewImages.map((img, i) => {
              const isLast = i === 3 && moreImages.length > 4;
              return (
                <div key={i} className="blog-image-preview">
                  <img
                    src={img}
                    alt={`More ${i}`}
                    loading="lazy"
                    decoding="async"
                    style={{ cursor: "zoom-in" }}
                    onClick={() => openFull(img)}
                  />
                  {isLast && (
                    <div className="blog-image-overlay" onClick={() => setShowAllImagesModal(true)}>
                      +{moreImages.length - 3}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="single-blog-info">
          <h1 className="single-blog-title">{blog.title}</h1>
          <div className="single-blog-meta">
            <div className="single-blog-meta-item">
              <span className="single-blog-category">{blog.category}</span>
              <img src={silverTime} alt="Time" className="single-blog-icon" />
              <span>{formattedDate}</span>
            </div>
            <div className="single-blog-meta-item">
              <img src={silverPencil} alt="Author" className="single-blog-icon" />
              <span>{blog.author}</span>
            </div>
            <button className="single-blog-copy-link" onClick={copyBlogLink}>
              <img src={attachIcon} alt="Copy" />
              <span>Copy Blog Link</span>
            </button>
          </div>
          <div
            className="single-blog-content"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />
        </div>

        {showAllImagesModal && (
          <div className="blog-gallery-modal">
            <div className="blog-gallery-overlay" onClick={() => setShowAllImagesModal(false)} />
            <div className="blog-gallery-wrapper">
              <button className="blog-gallery-close" onClick={() => setShowAllImagesModal(false)}>
                ✕
              </button>
              <div className="blog-gallery-grid">
                {moreImages.map((img, idx) => (
                  <div key={idx} className="blog-gallery-thumb">
                    <img
                      src={img}
                      alt={`Gallery ${idx}`}
                      loading="lazy"
                      decoding="async"
                      onClick={() => openFull(img)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {fullImageUrl && (
          <div className="blog-fullscreen-viewer">
            <div className="blog-fullscreen-backdrop" onClick={() => setFullImageUrl(null)} />
            <img src={fullImageUrl} alt="Fullscreen" className="blog-fullscreen-image" />
            <button className="blog-fullscreen-exit" onClick={() => setFullImageUrl(null)}>
              ✕
            </button>
          </div>
        )}
      </main>

      <ToastContainer
        position="top-center"
        autoClose={1500}
        hideProgressBar
        closeOnClick
        pauseOnFocusLoss={false}
        pauseOnHover={false}
        className="custom-toast-container"
        toastClassName="custom-toast"
        limit={1}
      />

      <Footer />
    </div>
  );
}
